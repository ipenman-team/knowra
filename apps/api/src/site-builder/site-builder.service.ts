import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  CreateShareSnapshotUseCase,
  CreateShareUseCase,
  ListSharesUseCase,
  UpdateShareStatusUseCase,
} from '@contexta/application';
import type { Share } from '@contexta/domain';
import { PrismaService } from '../prisma/prisma.service';
import { PageService } from '../page/page.service';
import type { PublishSiteBuilderDto } from './dto/publish-site-builder.dto';
import type {
  PublishSiteBuilderResult,
  SiteBuilderBlogMenuConfig,
  SiteBuilderBlogSource,
  SiteBuilderConfigV1,
  SiteBuilderGetResult,
  SiteBuilderMenus,
  SiteBuilderMetadata,
} from './site-builder.types';

const SITE_BUILDER_KIND = 'SPACE_SITE';
const SITE_BUILDER_TARGET_SUFFIX = ':site-builder';
const MAX_PAGE_LIST_LIMIT = 20;

function isObjectLike(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function toTrimmedString(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  return value ? value : null;
}

function clamp(input: number, min: number, max: number): number {
  return Math.min(Math.max(input, min), max);
}

function parseDateFromInput(input: string | Date | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return Number.isFinite(input.getTime()) ? input : null;
  if (typeof input === 'string') {
    const value = input.trim();
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  return null;
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function buildSiteShareTargetId(spaceId: string): string {
  return `${spaceId}${SITE_BUILDER_TARGET_SUFFIX}`;
}

function defaultConfig(actorUserId: string): SiteBuilderConfigV1 {
  const now = new Date().toISOString();
  return {
    version: 1,
    template: 'knowledge-site',
    theme: {
      mode: 'light',
      primaryColor: '#2563eb',
    },
    menus: {
      home: { enabled: true, pageId: null },
      about: { enabled: false, pageId: null },
      blog: {
        enabled: true,
        source: 'LATEST_PUBLISHED',
        style: 'card',
        pageIds: [],
        limit: 6,
      },
      contact: { enabled: false, pageId: null },
    },
    updatedAt: now,
    updatedBy: actorUserId,
  };
}

@Injectable()
export class SiteBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pageService: PageService,
    private readonly listSharesUseCase: ListSharesUseCase,
    private readonly createShareUseCase: CreateShareUseCase,
    private readonly createShareSnapshotUseCase: CreateShareSnapshotUseCase,
    private readonly updateShareStatusUseCase: UpdateShareStatusUseCase,
  ) {}

  async get(tenantId: string, spaceId: string): Promise<SiteBuilderGetResult> {
    const space = await this.getSpaceOrThrow(tenantId, spaceId);
    const metadata = this.readSiteBuilderMetadata(space.metadata);
    const share = await this.findActiveSiteShare(tenantId, spaceId);

    return {
      draft: metadata.draft ?? null,
      published: metadata.published ?? null,
      publishedAt: metadata.publishedAt ?? null,
      publishedBy: metadata.publishedBy ?? null,
      share: share
        ? {
            id: share.id,
            publicId: share.publicId,
            status: share.status,
            visibility: share.visibility,
            expiresAt: share.expiresAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  async saveDraft(
    tenantId: string,
    spaceId: string,
    actorUserId: string,
    inputConfig: unknown,
  ): Promise<SiteBuilderConfigV1> {
    const space = await this.getSpaceOrThrow(tenantId, spaceId);
    const metadata = this.readSiteBuilderMetadata(space.metadata);
    const config = this.normalizeConfig(inputConfig, actorUserId);

    const nextMetadata = {
      ...metadata,
      draft: config,
    };
    await this.updateSpaceSiteBuilderMetadata(space.id, actorUserId, space.metadata, nextMetadata);

    return config;
  }

  async publish(
    tenantId: string,
    spaceId: string,
    actorUserId: string,
    body: PublishSiteBuilderDto,
  ): Promise<PublishSiteBuilderResult> {
    const space = await this.getSpaceOrThrow(tenantId, spaceId);
    const metadata = this.readSiteBuilderMetadata(space.metadata);

    const draft = metadata.draft
      ? this.normalizeConfig(metadata.draft, actorUserId)
      : defaultConfig(actorUserId);

    const resolvedData = await this.resolveBindData(tenantId, spaceId, draft);
    const publishedAt = new Date().toISOString();
    const snapshotPayload = {
      mode: 'site-builder',
      space: {
        id: space.id,
        name: space.name,
        description: space.description ?? null,
      },
      siteConfig: draft,
      resolvedData,
      publishedAt,
    };

    let share = await this.findActiveSiteShare(tenantId, spaceId);
    if (!share) {
      const parsedExpiresAt = parseDateFromInput(body.expiresAt ?? null);
      if (body.expiresAt != null && !parsedExpiresAt) {
        throw new BadRequestException('expiresAt invalid');
      }

      const created = await this.createShareUseCase.create({
        tenantId,
        type: 'CUSTOM',
        targetId: buildSiteShareTargetId(spaceId),
        visibility: body.visibility ?? 'PUBLIC',
        status: 'ACTIVE',
        scopeType: 'SPACE',
        scopeId: spaceId,
        expiresAt: parsedExpiresAt,
        password: body.password ?? null,
        tokenEnabled: body.tokenEnabled ?? false,
        extraData: {
          kind: SITE_BUILDER_KIND,
          spaceId,
        },
        actorUserId,
      });
      share = created.share;
    }

    await this.createShareSnapshotUseCase.create({
      tenantId,
      shareId: share.id,
      payload: snapshotPayload,
      actorUserId,
    });

    const nextMetadata = {
      ...metadata,
      draft,
      published: draft,
      publishedAt,
      publishedBy: actorUserId,
    };
    await this.updateSpaceSiteBuilderMetadata(space.id, actorUserId, space.metadata, nextMetadata);

    return {
      publicId: share.publicId,
      url: `/share/s/${share.publicId}`,
      publishedAt,
    };
  }

  async unpublish(
    tenantId: string,
    spaceId: string,
    actorUserId: string,
  ): Promise<{ ok: true; revoked: boolean }> {
    const space = await this.getSpaceOrThrow(tenantId, spaceId);
    const share = await this.findActiveSiteShare(tenantId, spaceId);

    if (share) {
      await this.updateShareStatusUseCase.update({
        tenantId,
        shareId: share.id,
        status: 'REVOKED',
        actorUserId,
      });
    }

    const metadata = this.readSiteBuilderMetadata(space.metadata);
    const nextMetadata: SiteBuilderMetadata = {
      ...metadata,
      publishedAt: null,
      publishedBy: null,
    };
    await this.updateSpaceSiteBuilderMetadata(space.id, actorUserId, space.metadata, nextMetadata);

    return {
      ok: true,
      revoked: Boolean(share),
    };
  }

  private async findActiveSiteShare(
    tenantId: string,
    spaceId: string,
  ): Promise<Share | null> {
    const targetId = buildSiteShareTargetId(spaceId);
    const result = await this.listSharesUseCase.list({
      tenantId,
      type: 'CUSTOM',
      targetId,
      status: 'ACTIVE',
      visibility: null,
      scopeId: null,
      scopeType: null,
      createdBy: null,
      skip: 0,
      take: 20,
    });

    const found = result.items.find((item) => {
      if (item.targetId !== targetId) return false;
      if (item.type !== 'CUSTOM') return false;
      if (!isObjectLike(item.extraData)) return false;
      return item.extraData.kind === SITE_BUILDER_KIND;
    });

    return found ?? null;
  }

  private async resolveBindData(
    tenantId: string,
    spaceId: string,
    config: SiteBuilderConfigV1,
  ): Promise<{
    pageMap: Record<
      string,
      {
        id: string;
        title: string;
        content: Prisma.JsonValue;
        updatedAt: string;
      }
    >;
    menuData: {
      home: { pageId: string | null };
      about: { pageId: string | null };
      blog: {
        style: 'list' | 'card';
        items: Array<{ id: string; title: string; updatedAt: string }>;
      };
      contact: { pageId: string | null };
    };
  }> {
    const pageMap: Record<
      string,
      {
        id: string;
        title: string;
        content: Prisma.JsonValue;
        updatedAt: string;
      }
    > = {};

    const pageMenuCandidateIds = [
      config.menus.home.enabled ? config.menus.home.pageId : null,
      config.menus.about.enabled ? config.menus.about.pageId : null,
      config.menus.contact.enabled ? config.menus.contact.pageId : null,
    ].filter((id): id is string => Boolean(id));

    let blogCandidateIds: string[] = [];
    if (config.menus.blog.enabled) {
      if (config.menus.blog.source === 'LATEST_PUBLISHED') {
        const limit = clamp(
          Number(config.menus.blog.limit ?? 6),
          1,
          MAX_PAGE_LIST_LIMIT,
        );
        const latest = await this.prisma.page.findMany({
          where: {
            tenantId,
            spaceId,
            isDeleted: false,
            NOT: {
              latestPublishedVersionId: null,
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: { id: true },
        });
        blogCandidateIds = latest.map((item) => item.id);
      } else {
        blogCandidateIds = Array.from(
          new Set(
            config.menus.blog.pageIds
              .map((id) => id?.trim())
              .filter((id): id is string => Boolean(id)),
          ),
        );
      }
    }

    const allCandidateIds = Array.from(
      new Set([...pageMenuCandidateIds, ...blogCandidateIds]),
    );

    const pagesInSpace = allCandidateIds.length
      ? await this.pageService.getPagesByIds(tenantId, spaceId, allCandidateIds)
      : [];
    const idsInSpace = new Set(pagesInSpace.map((page) => page.id));

    const publishedPages = idsInSpace.size
      ? await this.pageService.getPublishedPagesByIds(
          tenantId,
          Array.from(idsInSpace),
        )
      : [];
    const publishedById = new Map(publishedPages.map((page) => [page.id, page]));

    for (const page of publishedPages) {
      pageMap[page.id] = {
        id: page.id,
        title: page.title,
        content: page.content,
        updatedAt: page.updatedAt.toISOString(),
      };
    }

    const safePageId = (id: string | null): string | null => {
      if (!id) return null;
      return publishedById.has(id) ? id : null;
    };

    const blogIds = blogCandidateIds.filter((id) => publishedById.has(id));
    const blogItems = blogIds
      .map((id) => {
        const page = publishedById.get(id);
        if (!page) return null;
        return {
          id: page.id,
          title: page.title,
          updatedAt: page.updatedAt.toISOString(),
        };
      })
      .filter((item): item is { id: string; title: string; updatedAt: string } => Boolean(item));

    return {
      pageMap,
      menuData: {
        home: { pageId: safePageId(config.menus.home.pageId) },
        about: { pageId: safePageId(config.menus.about.pageId) },
        blog: {
          style: config.menus.blog.style,
          items: blogItems,
        },
        contact: { pageId: safePageId(config.menus.contact.pageId) },
      },
    };
  }

  private normalizeConfig(input: unknown, actorUserId: string): SiteBuilderConfigV1 {
    if (!isObjectLike(input)) {
      throw new BadRequestException('config invalid');
    }

    const themeInput = isObjectLike(input.theme) ? input.theme : {};
    const modeRaw = toTrimmedString(themeInput.mode);
    const mode = modeRaw === 'dark' || modeRaw === 'system' ? modeRaw : 'light';

    const primaryColorRaw = toTrimmedString(themeInput.primaryColor) ?? '#2563eb';
    if (!isHexColor(primaryColorRaw)) {
      throw new BadRequestException('theme.primaryColor invalid');
    }

    const defaultMenus = defaultConfig(actorUserId).menus;
    const menusInput = isObjectLike(input.menus) ? input.menus : {};
    const menus = this.normalizeMenus(menusInput, defaultMenus);

    return {
      version: 1,
      template: 'knowledge-site',
      theme: {
        mode,
        primaryColor: primaryColorRaw,
      },
      menus,
      updatedAt: new Date().toISOString(),
      updatedBy: actorUserId,
    };
  }

  private normalizeMenus(
    input: Record<string, unknown>,
    fallback: SiteBuilderMenus,
  ): SiteBuilderMenus {
    const toPageMenu = (
      raw: unknown,
      base: { enabled: boolean; pageId: string | null },
    ) => {
      const menu = isObjectLike(raw) ? raw : {};
      const enabled =
        menu.enabled === undefined ? base.enabled : Boolean(menu.enabled);
      const pageId = enabled ? toTrimmedString(menu.pageId) : null;
      return {
        enabled,
        pageId,
      };
    };

    const toBlogMenu = (
      raw: unknown,
      base: SiteBuilderBlogMenuConfig,
    ): SiteBuilderBlogMenuConfig => {
      const menu = isObjectLike(raw) ? raw : {};
      const enabled =
        menu.enabled === undefined ? base.enabled : Boolean(menu.enabled);
      const sourceRaw = toTrimmedString(menu.source);
      const source: SiteBuilderBlogSource =
        sourceRaw === 'MANUAL_PAGE_IDS' ? 'MANUAL_PAGE_IDS' : 'LATEST_PUBLISHED';
      const styleRaw = toTrimmedString(menu.style);
      const style = styleRaw === 'list' ? 'list' : 'card';
      const pageIds = Array.isArray(menu.pageIds)
        ? Array.from(
            new Set(
              menu.pageIds
                .map((id) => toTrimmedString(id))
                .filter((id): id is string => Boolean(id)),
            ),
          )
        : [];
      const limit = clamp(Number(menu.limit ?? base.limit), 1, MAX_PAGE_LIST_LIMIT);
      return {
        enabled,
        source,
        style,
        pageIds,
        limit,
      };
    };

    return {
      home: toPageMenu(input.home, fallback.home),
      about: toPageMenu(input.about, fallback.about),
      blog: toBlogMenu(input.blog, fallback.blog),
      contact: toPageMenu(input.contact, fallback.contact),
    };
  }

  private readSiteBuilderMetadata(input: unknown): SiteBuilderMetadata {
    if (!isObjectLike(input)) return {};
    if (!isObjectLike(input.siteBuilder)) return {};

    const siteBuilder = input.siteBuilder as Record<string, unknown>;
    return {
      draft: this.readConfigMaybe(siteBuilder.draft),
      published: this.readConfigMaybe(siteBuilder.published),
      publishedAt: toTrimmedString(siteBuilder.publishedAt),
      publishedBy: toTrimmedString(siteBuilder.publishedBy),
    };
  }

  private readConfigMaybe(input: unknown): SiteBuilderConfigV1 | undefined {
    if (!isObjectLike(input)) return undefined;
    try {
      return this.normalizeConfig(input, toTrimmedString(input.updatedBy) ?? 'system');
    } catch {
      return undefined;
    }
  }

  private async updateSpaceSiteBuilderMetadata(
    spaceId: string,
    actorUserId: string,
    metadataRaw: unknown,
    siteBuilder: SiteBuilderMetadata,
  ): Promise<void> {
    const metadata = isObjectLike(metadataRaw) ? { ...metadataRaw } : {};
    const nextSiteBuilder: Record<string, unknown> = {};
    if (siteBuilder.draft) nextSiteBuilder.draft = siteBuilder.draft;
    if (siteBuilder.published) nextSiteBuilder.published = siteBuilder.published;
    nextSiteBuilder.publishedAt = siteBuilder.publishedAt ?? null;
    nextSiteBuilder.publishedBy = siteBuilder.publishedBy ?? null;
    metadata.siteBuilder = nextSiteBuilder;
    await this.prisma.space.update({
      where: { id: spaceId },
      data: {
        metadata: metadata as Prisma.InputJsonValue,
        updatedBy: actorUserId,
      },
    });
  }

  private async getSpaceOrThrow(tenantId: string, spaceId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!spaceId) throw new BadRequestException('spaceId is required');

    const space = await this.prisma.space.findFirst({
      where: {
        id: spaceId,
        tenantId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        metadata: true,
      },
    });
    if (!space) throw new NotFoundException('space not found');
    return space;
  }
}
