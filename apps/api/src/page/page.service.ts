import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PageVersionStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { PageDto } from './dto/page.dto';
import { PageVersionDto } from './dto/page-version.dto';
import { SavePageDto } from './dto/save-page.dto';

@Injectable()
export class PageService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePageContent(input: unknown): Prisma.InputJsonValue {
    const defaultDoc = () =>
      [
        {
          type: 'paragraph',
          children: [{ text: '' }],
        },
      ] as unknown as Prisma.InputJsonValue;

    if (input == null) return defaultDoc();
    if (Array.isArray(input))
      return input.length > 0 ? (input as Prisma.InputJsonValue) : defaultDoc();

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) return defaultDoc();
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.length > 0
            ? (parsed as Prisma.InputJsonValue)
            : defaultDoc();
        }
      } catch {
        void 0;
      }

      return [
        {
          type: 'paragraph',
          children: [{ text: input }],
        },
      ] as unknown as Prisma.InputJsonValue;
    }

    return input as Prisma.InputJsonValue;
  }

  private async createPageVersion(args: {
    tenantId: string;
    spaceId: string;
    pageId: string;
    status: PageVersionStatus;
    title: string;
    content: Prisma.InputJsonValue;
    parentIds: string[];
    userId: string;
  }) {
    return this.prisma.pageVersion.create({
      data: {
        spaceId: args.spaceId,
        tenantId: args.tenantId,
        pageId: args.pageId,
        status: args.status,
        title: args.title,
        content: args.content,
        parentIds: args.parentIds,
        createdBy: args.userId,
        updatedBy: args.userId,
      },
    });
  }

  async create(
    tenantId: string,
    input: CreatePageDto,
    userId?: string,
  ): Promise<PageDto> {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!input.title) throw new BadRequestException('title is required');

    const actor = userId?.trim() || 'system';

    const normalizedContent = this.normalizePageContent(input.content);
    const parentIds = input.parentIds ?? [];

    const created = await this.prisma.page.create({
      data: {
        tenantId,
        spaceId: input.spaceId,
        title: input.title,
        content: normalizedContent,
        parentIds,
        createdBy: actor,
        updatedBy: actor,
      },
    });

    await this.createPageVersion({
      tenantId,
      spaceId: input.spaceId,
      pageId: created.id,
      status: PageVersionStatus.DRAFT,
      title: created.title,
      content: normalizedContent,
      parentIds: created.parentIds,
      userId: actor,
    });

    return created;
  }

  async save(
    tenantId: string,
    id: string,
    input: SavePageDto,
    userId?: string,
  ): Promise<PageDto> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const actor = userId?.trim() || 'system';

    const existing = await this.prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('page not found');

    const existingContent = (existing.content ?? []) as Prisma.InputJsonValue;

    const nextContent =
      input.content === undefined
        ? existingContent
        : this.normalizePageContent(input.content);

    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        title: input.title ?? existing.title,
        content: nextContent,
        parentIds: input.parentIds ?? existing.parentIds,
        updatedBy: actor,
      },
    });

    await this.createPageVersion({
      tenantId,
      spaceId: updated.spaceId,
      pageId: updated.id,
      status: PageVersionStatus.TEMP,
      title: updated.title,
      content: (updated.content ?? []) as Prisma.InputJsonValue,
      parentIds: updated.parentIds,
      userId: actor,
    });

    return updated;
  }

  async rename(
    tenantId: string,
    id: string,
    input: { title: string },
    userId?: string,
  ): Promise<PageDto> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const actor = userId?.trim() || 'system';

    const existing = await this.prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('page not found');

    const nextTitle = input.title?.trim() || '无标题文档';

    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        title: nextTitle,
        updatedBy: actor,
      },
    });

    const latestPublished = await this.prisma.pageVersion.findFirst({
      where: {
        tenantId,
        pageId: updated.id,
        status: PageVersionStatus.PUBLISHED,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (latestPublished) {
      await this.prisma.pageVersion.update({
        where: { id: latestPublished.id },
        data: {
          title: updated.title,
          updatedBy: actor,
        },
      });
    }

    return updated;
  }

  async publish(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<{ ok: true; versionId: string }> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const actor = userId?.trim() || 'system';

    const page = await this.prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) throw new NotFoundException('page not found');

    const version = await this.createPageVersion({
      tenantId,
      spaceId: page.spaceId,
      pageId: page.id,
      status: PageVersionStatus.PUBLISHED,
      title: page.title,
      content: (page.content ?? []) as Prisma.InputJsonValue,
      parentIds: page.parentIds,
      userId: actor,
    });

    return { ok: true, versionId: version.id };
  }

  async getLatestPublished(pageId: string, tenantId: string) {
    if (!pageId) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const existing = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('page not found');

    const latest = await this.prisma.pageVersion.findFirst({
      where: {
        tenantId,
        pageId,
        status: PageVersionStatus.PUBLISHED,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        pageId: true,
        status: true,
        title: true,
        content: true,
        updatedBy: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!latest) throw new NotFoundException('published version not found');
    return latest;
  }

  async listVersions(
    pageId: string,
    tenantId: string,
  ): Promise<PageVersionDto[]> {
    if (!pageId) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const existing = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('page not found');

    return this.prisma.pageVersion.findMany({
      where: { tenantId, pageId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tenantId: true,
        pageId: true,
        status: true,
        title: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getVersion(pageId: string, versionId: string, tenantId: string) {
    if (!pageId) throw new BadRequestException('id is required');
    if (!versionId) throw new BadRequestException('versionId is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const existing = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('page not found');

    const version = await this.prisma.pageVersion.findFirst({
      where: { id: versionId, pageId, tenantId, isDeleted: false },
      select: {
        id: true,
        pageId: true,
        status: true,
        title: true,
        content: true,
        updatedBy: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!version) throw new NotFoundException('version not found');
    return version;
  }

  async remove(id: string, tenantId: string): Promise<{ ok: true }> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const existing = await this.prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('page not found');

    await this.prisma.page.delete({ where: { id } });
    return { ok: true };
  }

  async get(id: string, tenantId: string): Promise<PageDto> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const page = await this.prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) throw new NotFoundException('page not found');

    return page;
  }

  async list(tenantId: string): Promise<Omit<PageDto, 'content'>[]> {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    return this.prisma.page.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      omit: { content: true },
    });
  }
}
