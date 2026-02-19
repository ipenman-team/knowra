import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Body,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CommentThreadSummaryUseCase,
  CreateCommentThreadUseCase,
  GetCommentThreadUseCase,
  ListCommentMessagesUseCase,
  ListCommentThreadsUseCase,
  ReplyCommentThreadUseCase,
  ResolveCommentThreadUseCase,
  type CreateCommentThreadResult,
  type ReplyCommentThreadResult,
  GetShareAccessUseCase,
} from '@contexta/application';
import { ListResponse, Response } from '@contexta/shared';
import { PageService } from '../page/page.service';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import type { Share } from '@contexta/domain';
import type { CreateCommentThreadDto } from './dto/create-comment-thread.dto';
import type { ReplyCommentDto } from './dto/reply-comment.dto';
import type { ListCommentThreadsQuery } from './dto/list-comment-threads.query';
import type { ListCommentMessagesQuery } from './dto/list-comment-messages.query';
import type { ResolveCommentThreadDto } from './dto/resolve-comment-thread.dto';

const DEFAULT_COMMENT_AGREEMENT_MARKDOWN = `# 评论协议\n\n欢迎参与评论互动。\n\n- 请保持友善与尊重，避免人身攻击。\n- 请勿发布违法违规、色情、赌博、毒品、政治煽动等内容。\n- 系统会对评论内容进行安全检测，违规内容可能被拦截。`;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeOptionalText(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  return value.length > 0 ? value : null;
}

function normalizeRequiredText(name: string, input: unknown): string {
  const value = normalizeOptionalText(input);
  if (!value) throw new BadRequestException(`${name} is required`);
  return value;
}

function parseLimit(raw: unknown): number | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new BadRequestException('limit invalid');
  return n;
}

function toPlainMessage(input: unknown): string {
  if (typeof input === 'string') {
    const text = input.trim();
    if (!text) throw new BadRequestException('content is required');
    return text;
  }

  if (input && typeof input === 'object') {
    const maybeText = (input as { text?: unknown }).text;
    if (typeof maybeText === 'string' && maybeText.trim()) {
      return maybeText.trim();
    }
  }

  throw new BadRequestException('content is required');
}

function toCommentContentPayload(content: unknown): { text: string } {
  return { text: toPlainMessage(content) };
}

function handleModerationResult(
  result: CreateCommentThreadResult | ReplyCommentThreadResult,
) {
  if (result.kind === 'created') {
    return new Response({
      moderation: {
        status: result.moderation.status,
        riskCategories: result.moderation.riskCategories,
      },
      thread: result.data.thread,
      message: result.data.message,
    });
  }

  if (result.moderation.status === 'REJECT') {
    throw new UnprocessableEntityException('comment content blocked');
  }

  return new Response({
    moderation: {
      status: result.moderation.status,
      riskCategories: result.moderation.riskCategories,
    },
  });
}

function parseCommentAgreement(share: Share): {
  title: string;
  version: string;
  updatedAt: string;
  contentMarkdown: string;
} {
  const nowIso = new Date().toISOString();
  const extra = share.extraData;
  if (!extra || typeof extra !== 'object') {
    return {
      title: '评论协议',
      version: 'v1',
      updatedAt: nowIso,
      contentMarkdown: DEFAULT_COMMENT_AGREEMENT_MARKDOWN,
    };
  }

  const rawPolicy = (extra as { commentPolicy?: unknown }).commentPolicy;
  if (!rawPolicy || typeof rawPolicy !== 'object') {
    return {
      title: '评论协议',
      version: 'v1',
      updatedAt: nowIso,
      contentMarkdown: DEFAULT_COMMENT_AGREEMENT_MARKDOWN,
    };
  }

  const agreement = (rawPolicy as { agreement?: unknown }).agreement;
  if (!agreement || typeof agreement !== 'object') {
    return {
      title: '评论协议',
      version: 'v1',
      updatedAt: nowIso,
      contentMarkdown: DEFAULT_COMMENT_AGREEMENT_MARKDOWN,
    };
  }

  const title =
    normalizeOptionalText((agreement as { title?: unknown }).title) ?? '评论协议';
  const version =
    normalizeOptionalText((agreement as { version?: unknown }).version) ?? 'v1';
  const contentMarkdown =
    normalizeOptionalText(
      (agreement as { contentMarkdown?: unknown; content?: unknown }).contentMarkdown,
    ) ??
    normalizeOptionalText(
      (agreement as { contentMarkdown?: unknown; content?: unknown }).content,
    ) ??
    DEFAULT_COMMENT_AGREEMENT_MARKDOWN;
  const updatedAt =
    normalizeOptionalText((agreement as { updatedAt?: unknown }).updatedAt) ?? nowIso;

  return {
    title,
    version,
    updatedAt,
    contentMarkdown,
  };
}

function normalizeGuestId(raw: unknown): string | null {
  const guestId = normalizeOptionalText(raw);
  if (!guestId) return null;
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(guestId)) {
    throw new BadRequestException('guestId invalid');
  }
  return guestId;
}

function resolveExternalAuthor(
  userId: string | undefined,
  guestIdRaw: unknown,
): {
  authorType: 'REGISTERED_EXTERNAL' | 'GUEST_EXTERNAL';
  authorUserId?: string | null;
  authorGuestId?: string | null;
  actorUserId: string;
} {
  const guestId = normalizeGuestId(guestIdRaw);
  if (guestId) {
    return {
      authorType: 'GUEST_EXTERNAL',
      authorUserId: null,
      authorGuestId: guestId,
      actorUserId: `guest:${guestId}`,
    };
  }

  const normalizedUserId = normalizeOptionalText(userId);
  if (normalizedUserId) {
    return {
      authorType: 'REGISTERED_EXTERNAL',
      authorUserId: normalizedUserId,
      authorGuestId: null,
      actorUserId: normalizedUserId,
    };
  }

  throw new UnauthorizedException('guest identity required');
}

function normalizeGuestNickname(raw: unknown, guestId: string): string {
  const nickname = normalizeOptionalText(raw);
  if (nickname) return nickname.slice(0, 30);
  const suffix = guestId.slice(-4).toUpperCase() || 'GUEST';
  return `访客-${suffix}`;
}

function normalizeGuestEmail(raw: unknown): string | null {
  const email = normalizeOptionalText(raw);
  if (!email) return null;
  const normalizedEmail = email.toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new BadRequestException('guest email invalid');
  }
  return normalizedEmail;
}

function resolveExternalGuestProfile(
  author: ReturnType<typeof resolveExternalAuthor>,
  raw: unknown,
): {
  authorGuestNickname?: string | null;
  authorGuestEmail?: string | null;
} {
  if (author.authorType !== 'GUEST_EXTERNAL') {
    return {
      authorGuestNickname: null,
      authorGuestEmail: null,
    };
  }

  const profile =
    raw && typeof raw === 'object'
      ? (raw as { nickname?: unknown; email?: unknown })
      : {};

  return {
    authorGuestNickname: normalizeGuestNickname(profile.nickname, author.authorGuestId ?? ''),
    authorGuestEmail: normalizeGuestEmail(profile.email),
  };
}

@Controller('comments')
export class CommentController {
  constructor(
    private readonly createThreadUseCase: CreateCommentThreadUseCase,
    private readonly replyThreadUseCase: ReplyCommentThreadUseCase,
    private readonly listThreadsUseCase: ListCommentThreadsUseCase,
    private readonly listMessagesUseCase: ListCommentMessagesUseCase,
    private readonly summaryUseCase: CommentThreadSummaryUseCase,
    private readonly resolveThreadUseCase: ResolveCommentThreadUseCase,
    private readonly pageService: PageService,
  ) {}

  @Get('threads')
  async listThreads(
    @TenantId() tenantId: string,
    @Query() query: ListCommentThreadsQuery,
  ) {
    const pageId = normalizeRequiredText('pageId', query.pageId);

    const result = await this.listThreadsUseCase.list({
      tenantId,
      pageId,
      source: query.source ?? 'ALL',
      status: query.status ?? 'OPEN',
      cursor: normalizeOptionalText(query.cursor),
      limit: parseLimit(query.limit),
    });

    return new ListResponse(result.items, undefined, {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  @Get('threads/summary')
  async summary(
    @TenantId() tenantId: string,
    @Query('pageId') pageIdRaw: string | undefined,
  ) {
    const pageId = normalizeRequiredText('pageId', pageIdRaw);
    return new Response(
      await this.summaryUseCase.summary({
        tenantId,
        pageId,
      }),
    );
  }

  @Get('threads/:threadId/messages')
  async listMessages(
    @TenantId() tenantId: string,
    @Param('threadId') threadId: string,
    @Query() query: ListCommentMessagesQuery,
  ) {
    const result = await this.listMessagesUseCase.list({
      tenantId,
      threadId,
      cursor: normalizeOptionalText(query.cursor),
      limit: parseLimit(query.limit),
      order: query.order === 'desc' ? 'desc' : 'asc',
    });

    return new ListResponse(result.items, undefined, {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  @Post('threads')
  async createThread(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreateCommentThreadDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const pageId = normalizeRequiredText('pageId', body.pageId);
    const spaceId = normalizeRequiredText('spaceId', body.spaceId);
    const page = await this.pageService.get(pageId, tenantId);
    if (page.spaceId !== spaceId) {
      throw new BadRequestException('spaceId mismatch');
    }

    const result = await this.createThreadUseCase.create({
      tenantId,
      spaceId,
      pageId,
      source: 'INTERNAL',
      content: toCommentContentPayload(body.content),
      quoteText: normalizeOptionalText(body.quoteText),
      anchorType: normalizeOptionalText(body.anchorType),
      anchorPayload: body.anchorPayload ?? null,
      authorType: 'MEMBER',
      authorUserId: userId,
      actorUserId: userId,
    });

    return handleModerationResult(result);
  }

  @Post('threads/:threadId/replies')
  async replyThread(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('threadId') threadId: string,
    @Body() body: ReplyCommentDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const result = await this.replyThreadUseCase.reply({
      tenantId,
      threadId,
      content: toCommentContentPayload(body.content),
      parentId: normalizeOptionalText(body.parentId),
      replyToMessageId: normalizeOptionalText(body.replyToMessageId),
      authorType: 'MEMBER',
      authorUserId: userId,
      actorUserId: userId,
    });

    return handleModerationResult(result);
  }

  @Post('threads/:threadId/status')
  async updateStatus(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('threadId') threadId: string,
    @Body() body: ResolveCommentThreadDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');
    if (!body?.status) throw new BadRequestException('status is required');

    const status = body.status;
    if (status !== 'OPEN' && status !== 'RESOLVED') {
      throw new BadRequestException('status invalid');
    }

    return new Response(
      await this.resolveThreadUseCase.resolve({
        tenantId,
        threadId,
        status,
        actorUserId: userId,
      }),
    );
  }
}

@Controller('public/shares/:publicId/comments')
export class PublicCommentController {
  constructor(
    private readonly createThreadUseCase: CreateCommentThreadUseCase,
    private readonly replyThreadUseCase: ReplyCommentThreadUseCase,
    private readonly listThreadsUseCase: ListCommentThreadsUseCase,
    private readonly listMessagesUseCase: ListCommentMessagesUseCase,
    private readonly summaryUseCase: CommentThreadSummaryUseCase,
    private readonly getThreadUseCase: GetCommentThreadUseCase,
    private readonly accessUseCase: GetShareAccessUseCase,
    private readonly pageService: PageService,
  ) {}

  private async accessShare(publicId: string, password?: string | null): Promise<Share> {
    try {
      return await this.accessUseCase.getAccess({
        publicId,
        password: normalizeOptionalText(password),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'forbidden';
      if (message === 'password required' || message === 'password invalid') {
        throw new UnauthorizedException(message);
      }
      if (message === 'share not found') {
        throw new NotFoundException(message);
      }
      if (message === 'share not active' || message === 'share expired') {
        throw new ForbiddenException(message);
      }
      throw error;
    }
  }

  private async resolvePageContext(params: {
    share: Share;
    pageIdRaw?: string | null;
  }): Promise<{ pageId: string; spaceId: string }> {
    const pageIdRaw = normalizeOptionalText(params.pageIdRaw);

    if (params.share.type === 'PAGE') {
      const page = await this.pageService.get(params.share.targetId, params.share.tenantId);
      return {
        pageId: page.id,
        spaceId: page.spaceId,
      };
    }

    if (params.share.type === 'SPACE') {
      const pageId = normalizeRequiredText('pageId', pageIdRaw);
      const page = await this.pageService.get(pageId, params.share.tenantId);
      if (page.spaceId !== params.share.targetId) {
        throw new ForbiddenException('page not in shared space');
      }

      return {
        pageId: page.id,
        spaceId: page.spaceId,
      };
    }

    throw new BadRequestException('share type not supported for comments');
  }

  @Get()
  async listThreads(
    @Param('publicId') publicId: string,
    @Query() query: ListCommentThreadsQuery,
  ) {
    const share = await this.accessShare(publicId, query.password);
    const pageContext = await this.resolvePageContext({
      share,
      pageIdRaw: query.pageId,
    });

    const result = await this.listThreadsUseCase.list({
      tenantId: share.tenantId,
      pageId: pageContext.pageId,
      shareId: share.id,
      source: 'EXTERNAL',
      status: query.status ?? 'OPEN',
      cursor: normalizeOptionalText(query.cursor),
      limit: parseLimit(query.limit),
    });

    return new ListResponse(result.items, undefined, {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  @Get('agreement')
  async agreement(@Param('publicId') publicId: string, @Query('password') password: string | undefined) {
    const share = await this.accessShare(publicId, password);
    return new Response(parseCommentAgreement(share));
  }

  @Get('summary')
  async summary(
    @Param('publicId') publicId: string,
    @Query('pageId') pageIdRaw: string | undefined,
    @Query('password') password: string | undefined,
  ) {
    const share = await this.accessShare(publicId, password);
    const pageContext = await this.resolvePageContext({
      share,
      pageIdRaw,
    });

    return new Response(
      await this.summaryUseCase.summary({
        tenantId: share.tenantId,
        pageId: pageContext.pageId,
        shareId: share.id,
      }),
    );
  }

  @Get('threads/:threadId/messages')
  async listMessages(
    @Param('publicId') publicId: string,
    @Param('threadId') threadId: string,
    @Query() query: ListCommentMessagesQuery,
  ) {
    const share = await this.accessShare(publicId, query.password);

    const thread = await this.getThreadUseCase.get({
      tenantId: share.tenantId,
      threadId,
    });
    if (!thread || thread.isDeleted) throw new NotFoundException('thread not found');
    if (thread.source !== 'EXTERNAL') throw new NotFoundException('thread not found');
    if (thread.shareId !== share.id) throw new NotFoundException('thread not found');

    if (share.type === 'PAGE' && thread.pageId !== share.targetId) {
      throw new NotFoundException('thread not found');
    }

    if (share.type === 'SPACE') {
      const page = await this.pageService.get(thread.pageId, share.tenantId);
      if (page.spaceId !== share.targetId) throw new NotFoundException('thread not found');
    }

    const result = await this.listMessagesUseCase.list({
      tenantId: share.tenantId,
      threadId,
      cursor: normalizeOptionalText(query.cursor),
      limit: parseLimit(query.limit),
      order: query.order === 'desc' ? 'desc' : 'asc',
    });

    return new ListResponse(result.items, undefined, {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  @Post('threads')
  async createThread(
    @Param('publicId') publicId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreateCommentThreadDto,
  ) {
    const share = await this.accessShare(publicId, body.password ?? undefined);
    const pageContext = await this.resolvePageContext({
      share,
      pageIdRaw: body.pageId,
    });
    const author = resolveExternalAuthor(userId, body.guestId);
    const guestProfile = resolveExternalGuestProfile(author, body.guestProfile);

    const result = await this.createThreadUseCase.create({
      tenantId: share.tenantId,
      spaceId: pageContext.spaceId,
      pageId: pageContext.pageId,
      shareId: share.id,
      source: 'EXTERNAL',
      content: toCommentContentPayload(body.content),
      quoteText: normalizeOptionalText(body.quoteText),
      anchorType: normalizeOptionalText(body.anchorType),
      anchorPayload: body.anchorPayload ?? null,
      authorType: author.authorType,
      authorUserId: author.authorUserId ?? null,
      authorGuestId: author.authorGuestId ?? null,
      authorGuestNickname: guestProfile.authorGuestNickname ?? null,
      authorGuestEmail: guestProfile.authorGuestEmail ?? null,
      actorUserId: author.actorUserId,
    });

    return handleModerationResult(result);
  }

  @Post('threads/:threadId/replies')
  async reply(
    @Param('publicId') publicId: string,
    @Param('threadId') threadId: string,
    @UserId() userId: string | undefined,
    @Body() body: ReplyCommentDto,
  ) {
    const share = await this.accessShare(publicId, body.password ?? undefined);
    const author = resolveExternalAuthor(userId, body.guestId);
    const guestProfile = resolveExternalGuestProfile(author, body.guestProfile);

    const thread = await this.getThreadUseCase.get({
      tenantId: share.tenantId,
      threadId,
    });
    if (!thread || thread.isDeleted) throw new NotFoundException('thread not found');
    if (thread.source !== 'EXTERNAL') throw new NotFoundException('thread not found');
    if (thread.shareId !== share.id) throw new NotFoundException('thread not found');

    const result = await this.replyThreadUseCase.reply({
      tenantId: share.tenantId,
      threadId,
      content: toCommentContentPayload(body.content),
      parentId: normalizeOptionalText(body.parentId),
      replyToMessageId: normalizeOptionalText(body.replyToMessageId),
      authorType: author.authorType,
      authorUserId: author.authorUserId ?? null,
      authorGuestId: author.authorGuestId ?? null,
      authorGuestNickname: guestProfile.authorGuestNickname ?? null,
      authorGuestEmail: guestProfile.authorGuestEmail ?? null,
      actorUserId: author.actorUserId,
    });

    return handleModerationResult(result);
  }
}
