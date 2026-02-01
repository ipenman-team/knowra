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
import { ListPageQuery } from './dto/list-page.query';
import { ListPageTreeQuery } from './dto/list-page-tree.query';
import { PageVersionService } from './page-version.service';

@Injectable()
export class PageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pageVersionService: PageVersionService,
  ) {}

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

    if (updated.latestPublishedVersionId) {
      await this.prisma.pageVersion.update({
        where: { id: updated.latestPublishedVersionId },
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

    await this.prisma.page.update({
      where: { id: page.id },
      data: {
        latestPublishedVersionId: version.id,
        updatedBy: actor,
      },
    });

    return { ok: true, versionId: version.id };
  }

  async listVersions(
    pageId: string,
    tenantId: string,
  ): Promise<PageVersionDto[]> {
    return this.pageVersionService.listVersions(pageId, tenantId);
  }

  async getVersion(pageId: string, versionId: string, tenantId: string) {
    return this.pageVersionService.getVersion(pageId, versionId, tenantId);
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

  async list(
    tenantId: string,
    spaceId: string,
    q?: ListPageQuery,
  ): Promise<Omit<PageDto, 'content'>[]> {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!spaceId) throw new BadRequestException('spaceId is required');

    const skip = Number(q?.skip) || 0;
    const take = Math.min(Math.max(Number(q?.take) || 50, 1), 200);
    const query = q?.q?.trim();

    return this.prisma.page.findMany({
      where: {
        tenantId,
        spaceId,
        ...(query
          ? { title: { contains: query, mode: 'insensitive' } }
          : {}),
      },
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      omit: { content: true },
    });
  }

  async listTree(
    tenantId: string,
    spaceId: string,
    q?: ListPageTreeQuery,
  ): Promise<{
    items: Omit<PageDto, 'content'>[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!spaceId) throw new BadRequestException('spaceId is required');

    const take = Math.min(Math.max(Number(q?.take) || 200, 1), 500);
    const cursor = q?.cursor?.trim() || null;
    const query = q?.query?.trim();
    const parentId = q?.parentId?.trim() || null;
    const onlyRoots = String(q?.onlyRoots).toLowerCase() === 'true';

    const where: Prisma.PageWhereInput = {
      tenantId,
      spaceId,
    };

    if (query) {
      where.title = { contains: query, mode: 'insensitive' };
    }

    if (parentId) {
      where.parentIds = { has: parentId };
    } else if (onlyRoots) {
      where.parentIds = { isEmpty: true };
    }

    const rows = await this.prisma.page.findMany({
      where,
      orderBy: { id: 'asc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        tenantId: true,
        spaceId: true,
        title: true,
        latestPublishedVersionId: true,
        parentIds: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const items = rows.slice(0, take);
    const hasMore = rows.length > take;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    return { items, nextCursor, hasMore };
  }
}
