import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PageVersionStatus, type Prisma } from '@prisma/client';
import { ActivityRecorderUseCase } from '@contexta/application';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { PageDto } from './dto/page.dto';
import { PageVersionDto } from './dto/page-version.dto';
import { SavePageDto } from './dto/save-page.dto';
import { ListPageQuery } from './dto/list-page.query';
import { ListPageTreeQuery } from './dto/list-page-tree.query';
import { PageVersionService } from './page-version.service';
import {
  DefaultPageContent,
  DefaultPageTitle,
  PageActivityAction,
} from './constant';
import _ from 'lodash';

@Injectable()
export class PageService {
  private readonly logger = new Logger(PageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pageVersionService: PageVersionService,
    private readonly activityRecorder: ActivityRecorderUseCase,
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
    needPublish = false,
  ): Promise<PageDto> {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!input.title) throw new BadRequestException('title is required');

    const actor = userId?.trim() || 'system';

    const normalizedContent = this.normalizePageContent(input.content);
    const parentId = input.parentId || '';
    const parentIds: string[] = [];
    if (!parentId) {
      const parent = await this.prisma.page.findFirst({
        where: { id: parentId, tenantId, isDeleted: false },
      });
      if (parent) {
        parentIds.push(parentId, ...(parent.parentIds ?? []));
      }
    } else {
      parentIds.push(parentId as string);
    }

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

    const version = await this.createPageVersion({
      tenantId,
      spaceId: input.spaceId,
      pageId: created.id,
      status: needPublish
        ? PageVersionStatus.PUBLISHED
        : PageVersionStatus.DRAFT,
      title: created.title,
      content: normalizedContent,
      parentIds: created.parentIds,
      userId: actor,
    });
    if (needPublish) {
      await this.prisma.page.update({
        where: { id: created.id },
        data: {
          latestPublishedVersionId: version.id,
          updatedBy: actor,
        },
      });
    }

    this.recordPageCreateActivity({
      tenantId,
      actorUserId: actor,
      page: created,
    });

    return created;
  }

  async initializePage(
    tenantId: string,
    input: { spaceId: string; userId: string },
  ): Promise<PageDto> {
    return await this.create(
      tenantId,
      {
        spaceId: input.spaceId,
        title: DefaultPageTitle,
        content: DefaultPageContent,
      },
      input.userId,
      true,
    );
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
      where: { id, tenantId, isDeleted: false },
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
      where: { id, tenantId, isDeleted: false },
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

    this.recordPageRenameActivity({
      tenantId,
      actorUserId: actor,
      pageId: updated.id,
      spaceId: updated.spaceId,
      fromTitle: existing.title,
      toTitle: updated.title,
      hasPublished: Boolean(updated.latestPublishedVersionId),
    });

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
      where: { id, tenantId, isDeleted: false },
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

    if (version.status === PageVersionStatus.PUBLISHED) {
      this.recordPagePublishActivity({
        tenantId,
        actorUserId: actor,
        pageId: page.id,
        spaceId: page.spaceId,
        versionId: version.id,
        title: page.title,
      });
    }

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

  async getPublishedPage(
    id: string,
    tenantId: string,
  ): Promise<PageDto | null> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const page = await this.prisma.page.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!page) return null;

    if (!page.latestPublishedVersionId) return null;

    const version = await this.prisma.pageVersion.findUnique({
      where: { id: page.latestPublishedVersionId },
    });
    if (!version) return null;

    return {
      ...page,
      title: version.title,
      content: version.content as Prisma.JsonValue,
      updatedAt: version.updatedAt,
    };
  }

  async remove(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<{ ok: true }> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const actor = userId?.trim() || 'system';

    const existing = await this.prisma.page.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('page not found');

    await this.prisma.page.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedBy: actor,
      },
    });

    // Ensure deleted pages do not participate in RAG retrieval.
    // (Vector-store filtering is also applied, but this keeps storage tidy.)
    await this.prisma.ragChunk.deleteMany({
      where: {
        tenantId,
        pageId: id,
      },
    });

    this.recordPageDeleteActivity({
      tenantId,
      actorUserId: actor,
      pageId: existing.id,
      spaceId: existing.spaceId,
      title: existing.title,
      hadPublished: Boolean(existing.latestPublishedVersionId),
    });

    return { ok: true };
  }

  async restore(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<{ ok: true }> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const actor = userId?.trim() || 'system';

    const existing = await this.prisma.page.findFirst({
      where: { id, tenantId, isDeleted: true },
    });
    if (!existing) throw new NotFoundException('page not found');

    await this.prisma.page.update({
      where: { id },
      data: {
        isDeleted: false,
        updatedBy: actor,
      },
    });

    this.recordPageRestoreActivity({
      tenantId,
      actorUserId: actor,
      pageId: existing.id,
      spaceId: existing.spaceId,
      title: existing.title,
      hadPublished: Boolean(existing.latestPublishedVersionId),
    });

    return { ok: true };
  }

  async permanentRemove(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<{ ok: true }> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const actor = userId?.trim() || 'system';

    const existing = await this.prisma.page.findFirst({
      where: { id, tenantId, isDeleted: true },
    });
    if (!existing) throw new NotFoundException('page not found');

    await this.prisma.ragChunk.deleteMany({
      where: {
        tenantId,
        pageId: id,
      },
    });

    await this.prisma.page.delete({ where: { id } });

    this.recordPagePurgeActivity({
      tenantId,
      actorUserId: actor,
      pageId: existing.id,
      spaceId: existing.spaceId,
      title: existing.title,
      hadPublished: Boolean(existing.latestPublishedVersionId),
    });

    return { ok: true };
  }

  private recordPageCreateActivity(args: {
    tenantId: string;
    actorUserId: string;
    page: { id: string; spaceId: string; title: string; parentIds: string[] };
  }) {
    void this.activityRecorder
      .record({
        tenantId: args.tenantId,
        actorUserId: args.actorUserId,
        action: PageActivityAction.Create,
        subjectType: 'page',
        subjectId: args.page.id,
        metadata: {
          spaceId: args.page.spaceId,
          title: args.page.title,
          parentIds: args.page.parentIds,
        },
      })
      .catch((e) => {
        this.logger.warn(
          `Failed to record activity(page.create): ${(e as Error)?.message ?? e}`,
        );
      });
  }

  private recordPageRenameActivity(args: {
    tenantId: string;
    actorUserId: string;
    pageId: string;
    spaceId: string;
    fromTitle: string;
    toTitle: string;
    hasPublished: boolean;
  }) {
    void this.activityRecorder
      .record({
        tenantId: args.tenantId,
        actorUserId: args.actorUserId,
        action: PageActivityAction.Rename,
        subjectType: 'page',
        subjectId: args.pageId,
        metadata: {
          spaceId: args.spaceId,
          fromTitle: args.fromTitle,
          toTitle: args.toTitle,
          hasPublished: args.hasPublished,
        },
      })
      .catch((e) => {
        this.logger.warn(
          `Failed to record activity(page.rename): ${(e as Error)?.message ?? e}`,
        );
      });
  }

  private recordPagePublishActivity(args: {
    tenantId: string;
    actorUserId: string;
    pageId: string;
    spaceId: string;
    versionId: string;
    title: string;
  }) {
    void this.activityRecorder
      .record({
        tenantId: args.tenantId,
        actorUserId: args.actorUserId,
        action: PageActivityAction.Publish,
        subjectType: 'page',
        subjectId: args.pageId,
        metadata: {
          spaceId: args.spaceId,
          versionId: args.versionId,
          title: args.title,
          status: PageVersionStatus.PUBLISHED,
        },
      })
      .catch((e) => {
        this.logger.warn(
          `Failed to record activity(page.publish): ${(e as Error)?.message ?? e}`,
        );
      });
  }

  private recordPageDeleteActivity(args: {
    tenantId: string;
    actorUserId: string;
    pageId: string;
    spaceId: string;
    title: string;
    hadPublished: boolean;
  }) {
    void this.activityRecorder
      .record({
        tenantId: args.tenantId,
        actorUserId: args.actorUserId,
        action: PageActivityAction.Delete,
        subjectType: 'page',
        subjectId: args.pageId,
        metadata: {
          spaceId: args.spaceId,
          title: args.title,
          hadPublished: args.hadPublished,
        },
      })
      .catch((e) => {
        this.logger.warn(
          `Failed to record activity(page.delete): ${(e as Error)?.message ?? e}`,
        );
      });
  }

  async get(id: string, tenantId: string): Promise<PageDto> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const page = await this.prisma.page.findFirst({
      where: { id, tenantId, isDeleted: false },
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
        isDeleted: false,
        ...(query ? { title: { contains: query, mode: 'insensitive' } } : {}),
      },
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      omit: { content: true },
    });
  }

  async listTrash(
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
        isDeleted: true,
        ...(query ? { title: { contains: query, mode: 'insensitive' } } : {}),
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
      isDeleted: false,
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
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items, nextCursor, hasMore };
  }

  private recordPageRestoreActivity(args: {
    tenantId: string;
    actorUserId: string;
    pageId: string;
    spaceId: string;
    title: string;
    hadPublished: boolean;
  }) {
    void this.activityRecorder
      .record({
        tenantId: args.tenantId,
        actorUserId: args.actorUserId,
        action: PageActivityAction.Restore,
        subjectType: 'page',
        subjectId: args.pageId,
        metadata: {
          spaceId: args.spaceId,
          title: args.title,
          hadPublished: args.hadPublished,
        },
      })
      .catch((e) => {
        this.logger.warn(
          `Failed to record activity(page.restore): ${(e as Error)?.message ?? e}`,
        );
      });
  }

  private recordPagePurgeActivity(args: {
    tenantId: string;
    actorUserId: string;
    pageId: string;
    spaceId: string;
    title: string;
    hadPublished: boolean;
  }) {
    void this.activityRecorder
      .record({
        tenantId: args.tenantId,
        actorUserId: args.actorUserId,
        action: PageActivityAction.Purge,
        subjectType: 'page',
        subjectId: args.pageId,
        metadata: {
          spaceId: args.spaceId,
          title: args.title,
          hadPublished: args.hadPublished,
        },
      })
      .catch((e) => {
        this.logger.warn(
          `Failed to record activity(page.purge): ${(e as Error)?.message ?? e}`,
        );
      });
  }
}
