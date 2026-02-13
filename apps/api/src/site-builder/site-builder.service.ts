import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  CreateShareSnapshotUseCase,
  CreateShareUseCase,
  ListSharesUseCase,
  UpdateShareStatusUseCase,
} from '@contexta/application';
import type { Share, ShareStatus } from '@contexta/domain';
import { PrismaService } from '../prisma/prisma.service';
import { PageService } from '../page/page.service';
import type { PublishSiteBuilderDto } from './dto/publish-site-builder.dto';
import type {
  SiteBuilderBranding,
  PublishSiteBuilderResult,
  SiteBuilderBlogMenuConfig,
  SiteBuilderBlogSource,
  SiteBuilderConfigV1,
  SiteBuilderCustomMenuConfig,
  SiteBuilderCustomMenuType,
  SiteBuilderGetResult,
  SiteBuilderMenus,
  SiteBuilderMetadata,
} from './site-builder.types';

const SITE_BUILDER_KIND = 'SPACE_SITE';
const SITE_BUILDER_TARGET_SUFFIX = ':site-builder';
const MAX_PAGE_LIST_LIMIT = 20;
const MAX_CUSTOM_MENUS = 20;
const MAX_MENU_LABEL_LENGTH = 40;
const MAX_LOGO_URL_LENGTH = 2 * 1024 * 1024;

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

function parseDateFromInput(
  input: string | Date | null | undefined,
): Date | null {
  if (input == null) return null;
  if (input instanceof Date)
    return Number.isFinite(input.getTime()) ? input : null;
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
    customMenus: [
      {
        id: 'menu-home',
        label: 'Home',
        type: 'SINGLE_PAGE',
        style: 'card',
        pageId: null,
        pageIds: [],
        pageCovers: {},
      },
      {
        id: 'menu-about',
        label: 'About',
        type: 'SINGLE_PAGE',
        style: 'card',
        pageId: null,
        pageIds: [],
        pageCovers: {},
      },
      {
        id: 'menu-contact',
        label: 'Contact',
        type: 'SINGLE_PAGE',
        style: 'card',
        pageId: null,
        pageIds: [],
        pageCovers: {},
      },
    ],
    branding: {
      logoUrl: null,
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
    await this.getSpaceOrThrow(tenantId, spaceId);
    const activeShare = await this.findActiveSiteShare(tenantId, spaceId);
    const latestShare =
      activeShare ?? (await this.findLatestSiteShare(tenantId, spaceId));
    const metadata = this.readSiteBuilderMetadataFromShareExtraData(
      latestShare?.extraData,
    );

    return {
      draft: metadata.draft ?? null,
      published: metadata.published ?? null,
      publishedAt: metadata.publishedAt ?? null,
      publishedBy: metadata.publishedBy ?? null,
      share: activeShare
        ? {
            id: activeShare.id,
            publicId: activeShare.publicId,
            status: activeShare.status,
            visibility: activeShare.visibility,
            expiresAt: activeShare.expiresAt?.toISOString() ?? null,
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
    await this.getSpaceOrThrow(tenantId, spaceId);
    const config = this.normalizeConfig(inputConfig, actorUserId);
    const latestShare = await this.findLatestSiteShare(tenantId, spaceId);
    const metadata = this.readSiteBuilderMetadataFromShareExtraData(
      latestShare?.extraData,
    );

    const nextMetadata = {
      ...metadata,
      draft: config,
    };

    if (!latestShare || latestShare.status === 'EXPIRED') {
      await this.createShareUseCase.create({
        tenantId,
        type: 'CUSTOM',
        targetId: buildSiteShareTargetId(spaceId),
        visibility: 'PUBLIC',
        status: 'REVOKED',
        scopeType: 'SPACE',
        scopeId: spaceId,
        expiresAt: null,
        password: null,
        tokenEnabled: false,
        extraData: this.buildSiteShareExtraData(null, spaceId, nextMetadata),
        actorUserId,
      });
      return config;
    }

    await this.persistSiteBuilderMetadataToShare({
      share: latestShare,
      spaceId,
      actorUserId,
      metadata: nextMetadata,
    });

    return config;
  }

  async publish(
    tenantId: string,
    spaceId: string,
    actorUserId: string,
    body: PublishSiteBuilderDto,
  ): Promise<PublishSiteBuilderResult> {
    const space = await this.getSpaceOrThrow(tenantId, spaceId);
    const activeShare = await this.findActiveSiteShare(tenantId, spaceId);
    const latestShare =
      activeShare ?? (await this.findLatestSiteShare(tenantId, spaceId));
    const metadata = this.readSiteBuilderMetadataFromShareExtraData(
      latestShare?.extraData,
    );

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

    let share = activeShare ?? latestShare;
    if (!share || share.status === 'EXPIRED') {
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
        extraData: this.buildSiteShareExtraData(null, spaceId, {
          ...metadata,
          draft,
          published: draft,
          publishedAt,
          publishedBy: actorUserId,
        }),
        actorUserId,
      });
      share = created.share;
    } else if (share.status !== 'ACTIVE') {
      await this.updateShareStatusUseCase.update({
        tenantId,
        shareId: share.id,
        status: 'ACTIVE',
        actorUserId,
      });
      share = {
        ...share,
        status: 'ACTIVE',
      };
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

    await this.persistSiteBuilderMetadataToShare({
      share,
      spaceId,
      actorUserId,
      metadata: nextMetadata,
    });

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
    await this.getSpaceOrThrow(tenantId, spaceId);
    const activeShare = await this.findActiveSiteShare(tenantId, spaceId);
    const latestShare =
      activeShare ?? (await this.findLatestSiteShare(tenantId, spaceId));

    if (activeShare) {
      await this.updateShareStatusUseCase.update({
        tenantId,
        shareId: activeShare.id,
        status: 'REVOKED',
        actorUserId,
      });
    }

    const metadata = this.readSiteBuilderMetadataFromShareExtraData(
      latestShare?.extraData,
    );
    if (latestShare) {
      const nextMetadata: SiteBuilderMetadata = {
        ...metadata,
        publishedAt: null,
        publishedBy: null,
      };
      await this.persistSiteBuilderMetadataToShare({
        share: latestShare,
        spaceId,
        actorUserId,
        metadata: nextMetadata,
      });
    }

    return {
      ok: true,
      revoked: Boolean(activeShare),
    };
  }

  private async findActiveSiteShare(
    tenantId: string,
    spaceId: string,
  ): Promise<Share | null> {
    const found = await this.findSiteShares(tenantId, spaceId, 'ACTIVE');
    return found[0] ?? null;
  }

  private async findLatestSiteShare(
    tenantId: string,
    spaceId: string,
  ): Promise<Share | null> {
    const found = await this.findSiteShares(tenantId, spaceId, null);
    return found[0] ?? null;
  }

  private async findSiteShares(
    tenantId: string,
    spaceId: string,
    status: ShareStatus | null,
  ): Promise<Share[]> {
    const targetId = buildSiteShareTargetId(spaceId);
    const result = await this.listSharesUseCase.list({
      tenantId,
      type: 'CUSTOM',
      targetId,
      status,
      visibility: null,
      scopeId: null,
      scopeType: null,
      createdBy: null,
      skip: 0,
      take: 200,
    });

    return result.items
      .filter((item) => {
        if (item.targetId !== targetId) return false;
        if (item.type !== 'CUSTOM') return false;
        if (!isObjectLike(item.extraData)) return false;
        return item.extraData.kind === SITE_BUILDER_KIND;
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
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
      customMenus: Array<{
        id: string;
        label: string;
        type: SiteBuilderCustomMenuType;
        style: 'list' | 'card';
        pageId: string | null;
        pageIds: string[];
        pageCovers: Record<string, string>;
      }>;
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
      ...config.customMenus.map((menu) => menu.pageId),
      ...config.customMenus.flatMap((menu) => menu.pageIds),
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
    const publishedById = new Map(
      publishedPages.map((page) => [page.id, page]),
    );

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
      .filter(
        (item): item is { id: string; title: string; updatedAt: string } =>
          Boolean(item),
      );

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
        customMenus: config.customMenus.map((menu) => ({
          id: menu.id,
          label: menu.label,
          type: menu.type,
          style: menu.style,
          pageId: menu.type === 'SINGLE_PAGE' ? safePageId(menu.pageId) : null,
          pageIds:
            menu.type === 'PAGE_LIST'
              ? menu.pageIds
                  .map((id) => safePageId(id))
                  .filter((id): id is string => Boolean(id))
              : [],
          pageCovers:
            menu.type === 'PAGE_LIST'
              ? Object.fromEntries(
                  menu.pageIds
                    .map((id) => safePageId(id))
                    .filter((id): id is string => Boolean(id))
                    .map((id) => [id, menu.pageCovers[id]])
                    .filter(
                      (entry): entry is [string, string] =>
                        typeof entry[1] === 'string' &&
                        entry[1].trim().length > 0,
                    ),
                )
              : {},
        })),
      },
    };
  }

  private normalizeConfig(
    input: unknown,
    actorUserId: string,
  ): SiteBuilderConfigV1 {
    if (!isObjectLike(input)) {
      throw new BadRequestException('config invalid');
    }

    const defaults = defaultConfig(actorUserId);
    const themeInput = isObjectLike(input.theme) ? input.theme : {};
    const modeRaw = toTrimmedString(themeInput.mode);
    const mode = modeRaw === 'dark' || modeRaw === 'system' ? modeRaw : 'light';

    const primaryColorRaw =
      toTrimmedString(themeInput.primaryColor) ?? '#2563eb';
    if (!isHexColor(primaryColorRaw)) {
      throw new BadRequestException('theme.primaryColor invalid');
    }

    const defaultMenus = defaults.menus;
    const menusInput = isObjectLike(input.menus) ? input.menus : {};
    const menus = this.normalizeMenus(menusInput, defaultMenus);
    const fallbackCustomMenus = this.buildCustomMenusFromMenus(
      menus,
      defaults.customMenus,
    );
    const customMenus = this.normalizeCustomMenus(
      Array.isArray(input.customMenus) ? input.customMenus : [],
      fallbackCustomMenus,
    );
    const branding = this.normalizeBranding(
      isObjectLike(input.branding) ? input.branding : {},
      defaults.branding,
    );

    return {
      version: 1,
      template: 'knowledge-site',
      theme: {
        mode,
        primaryColor: primaryColorRaw,
      },
      menus,
      customMenus,
      branding,
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
        sourceRaw === 'MANUAL_PAGE_IDS'
          ? 'MANUAL_PAGE_IDS'
          : 'LATEST_PUBLISHED';
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
      const limit = clamp(
        Number(menu.limit ?? base.limit),
        1,
        MAX_PAGE_LIST_LIMIT,
      );
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

  private normalizeBranding(
    input: Record<string, unknown>,
    fallback: SiteBuilderBranding,
  ): SiteBuilderBranding {
    const logoUrlRaw = toTrimmedString(input.logoUrl);
    if (!logoUrlRaw) return { logoUrl: fallback.logoUrl ?? null };
    if (logoUrlRaw.length > MAX_LOGO_URL_LENGTH) {
      throw new BadRequestException('branding.logoUrl too large');
    }
    return { logoUrl: logoUrlRaw };
  }

  private buildCustomMenusFromMenus(
    menus: SiteBuilderMenus,
    fallback: SiteBuilderCustomMenuConfig[],
  ): SiteBuilderCustomMenuConfig[] {
    const entries: SiteBuilderCustomMenuConfig[] = [];
    if (menus.home.enabled) {
      entries.push({
        id: 'menu-home',
        label: 'Home',
        type: 'SINGLE_PAGE',
        style: 'card',
        pageId: menus.home.pageId,
        pageIds: [],
        pageCovers: {},
      });
    }
    if (menus.about.enabled) {
      entries.push({
        id: 'menu-about',
        label: 'About',
        type: 'SINGLE_PAGE',
        style: 'card',
        pageId: menus.about.pageId,
        pageIds: [],
        pageCovers: {},
      });
    }
    if (menus.contact.enabled) {
      entries.push({
        id: 'menu-contact',
        label: 'Contact',
        type: 'SINGLE_PAGE',
        style: 'card',
        pageId: menus.contact.pageId,
        pageIds: [],
        pageCovers: {},
      });
    }
    if (entries.length) return entries;
    return fallback.map((item) => ({ ...item }));
  }

  private normalizeCustomMenus(
    input: unknown[],
    fallback: SiteBuilderCustomMenuConfig[],
  ): SiteBuilderCustomMenuConfig[] {
    const items: SiteBuilderCustomMenuConfig[] = [];
    const seen = new Set<string>();
    const rawItems = input.slice(0, MAX_CUSTOM_MENUS);

    for (let index = 0; index < rawItems.length; index += 1) {
      const raw = rawItems[index];
      if (!isObjectLike(raw)) continue;

      const baseId = toTrimmedString(raw.id) ?? `menu-${index + 1}`;
      let id = baseId.slice(0, 64);
      if (!id) continue;
      if (seen.has(id)) {
        let counter = 2;
        let nextId = `${id}-${counter}`;
        while (seen.has(nextId)) {
          counter += 1;
          nextId = `${id}-${counter}`;
        }
        id = nextId;
      }

      const rawLabel = toTrimmedString(raw.label) ?? `Menu ${items.length + 1}`;
      const label = rawLabel.slice(0, MAX_MENU_LABEL_LENGTH);
      const typeRaw = toTrimmedString(raw.type);
      const type: SiteBuilderCustomMenuType =
        typeRaw === 'PAGE_LIST' ? 'PAGE_LIST' : 'SINGLE_PAGE';
      const styleRaw = toTrimmedString(raw.style);
      const style = styleRaw === 'list' ? 'list' : 'card';
      const pageId =
        type === 'SINGLE_PAGE' ? toTrimmedString(raw.pageId) : null;
      const pageIds =
        type === 'PAGE_LIST' && Array.isArray(raw.pageIds)
          ? Array.from(
              new Set(
                raw.pageIds
                  .map((id) => toTrimmedString(id))
                  .filter((id): id is string => Boolean(id)),
              ),
            ).slice(0, MAX_PAGE_LIST_LIMIT)
          : [];
      const pageCovers =
        type === 'PAGE_LIST' && isObjectLike(raw.pageCovers)
          ? Object.fromEntries(
              Object.entries(raw.pageCovers)
                .map(
                  ([pageId, coverUrl]) =>
                    [
                      toTrimmedString(pageId),
                      toTrimmedString(coverUrl),
                    ] as const,
                )
                .filter(
                  (entry): entry is [string, string] =>
                    entry[0] !== null &&
                    entry[1] !== null &&
                    entry[1].length > 0 &&
                    pageIds.includes(entry[0]) &&
                    entry[1].length <= MAX_LOGO_URL_LENGTH,
                ),
            )
          : {};
      seen.add(id);
      items.push({
        id,
        label,
        type,
        style,
        pageId,
        pageIds,
        pageCovers,
      });
    }

    if (items.length) return items;

    return fallback.slice(0, MAX_CUSTOM_MENUS).map((item, index) => {
      const label = (item.label || `Menu ${index + 1}`).slice(
        0,
        MAX_MENU_LABEL_LENGTH,
      );
      return {
        id: item.id || `menu-${index + 1}`,
        label,
        type: item.type === 'PAGE_LIST' ? 'PAGE_LIST' : 'SINGLE_PAGE',
        style: item.style === 'list' ? 'list' : 'card',
        pageId: item.pageId ?? null,
        pageIds: Array.isArray(item.pageIds)
          ? item.pageIds
              .map((id) => toTrimmedString(id))
              .filter((id): id is string => Boolean(id))
          : [],
        pageCovers:
          item.type === 'PAGE_LIST' && isObjectLike(item.pageCovers)
            ? Object.fromEntries(
                Object.entries(item.pageCovers)
                  .map(
                    ([pageId, coverUrl]) =>
                      [
                        toTrimmedString(pageId),
                        toTrimmedString(coverUrl),
                      ] as const,
                  )
                  .filter(
                    (entry): entry is [string, string] =>
                      entry[0] !== null &&
                      entry[1] !== null &&
                      entry[1].length > 0 &&
                      entry[1].length <= MAX_LOGO_URL_LENGTH,
                  ),
              )
            : {},
      };
    });
  }

  private readSiteBuilderMetadataFromShareExtraData(
    input: unknown,
  ): SiteBuilderMetadata {
    if (!isObjectLike(input)) return {};
    const siteBuilder = isObjectLike(input.siteBuilder)
      ? input.siteBuilder
      : input;
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
      return this.normalizeConfig(
        input,
        toTrimmedString(input.updatedBy) ?? 'system',
      );
    } catch {
      return undefined;
    }
  }

  private buildSiteShareExtraData(
    baseExtraData: unknown,
    spaceId: string,
    siteBuilder: SiteBuilderMetadata,
  ): Record<string, unknown> {
    const extraData = isObjectLike(baseExtraData) ? { ...baseExtraData } : {};
    const nextSiteBuilder: Record<string, unknown> = {};
    if (siteBuilder.draft) nextSiteBuilder.draft = siteBuilder.draft;
    if (siteBuilder.published)
      nextSiteBuilder.published = siteBuilder.published;
    nextSiteBuilder.publishedAt = siteBuilder.publishedAt ?? null;
    nextSiteBuilder.publishedBy = siteBuilder.publishedBy ?? null;

    extraData.kind = SITE_BUILDER_KIND;
    extraData.spaceId = spaceId;
    extraData.siteBuilder = nextSiteBuilder;
    return extraData;
  }

  private async persistSiteBuilderMetadataToShare(params: {
    share: Share;
    spaceId: string;
    actorUserId: string;
    metadata: SiteBuilderMetadata;
    status?: ShareStatus;
  }): Promise<void> {
    const nextExtraData = this.buildSiteShareExtraData(
      params.share.extraData ?? null,
      params.spaceId,
      params.metadata,
    );

    await this.prisma.externalShare.update({
      where: { id: params.share.id },
      data: {
        extraData: nextExtraData as Prisma.InputJsonValue,
        updatedBy: params.actorUserId,
        status: params.status,
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
      },
    });
    if (!space) throw new NotFoundException('space not found');
    return space;
  }
}
