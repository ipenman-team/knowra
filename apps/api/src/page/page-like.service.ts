import {
  CountFavoriteByTargetUseCase,
  GetFavoriteStatusUseCase,
  SetFavoriteUseCase,
} from '@knowra/application';
import { FavoriteTarget } from '@knowra/domain';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PageService } from './page.service';

function normalizeRequiredText(name: string, raw: unknown): string {
  if (typeof raw !== 'string') throw new Error(`${name} is required`);
  const value = raw.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

@Injectable()
export class PageLikeService {
  constructor(
    private readonly pageService: PageService,
    private readonly setFavoriteUseCase: SetFavoriteUseCase,
    private readonly getFavoriteStatusUseCase: GetFavoriteStatusUseCase,
    private readonly countFavoriteByTargetUseCase: CountFavoriteByTargetUseCase,
  ) {}

  async getSummary(params: {
    tenantId: string;
    userId: string;
    spaceId: string;
    pageId: string;
  }): Promise<{ liked: boolean; likeCount: number }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const userId = normalizeRequiredText('userId', params.userId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const pageId = normalizeRequiredText('pageId', params.pageId);

    await this.getPageInSpace({ tenantId, spaceId, pageId });

    const [status, count] = await Promise.all([
      this.getFavoriteStatusUseCase.getStatus({
        tenantId,
        userId,
        targetType: FavoriteTarget.PageLike,
        targetId: pageId,
      }),
      this.countFavoriteByTargetUseCase.count({
        tenantId,
        targetType: FavoriteTarget.PageLike,
        targetId: pageId,
      }),
    ]);

    return {
      liked: Boolean(status.favorite),
      likeCount: Math.max(0, Number(count.count) || 0),
    };
  }

  async setLike(params: {
    tenantId: string;
    userId: string;
    spaceId: string;
    pageId: string;
    liked: boolean;
  }): Promise<{ liked: boolean; likeCount: number }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const userId = normalizeRequiredText('userId', params.userId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const pageId = normalizeRequiredText('pageId', params.pageId);
    if (typeof params.liked !== 'boolean') {
      throw new Error('liked must be boolean');
    }
    const liked = params.liked;

    const page = await this.getPageInSpace({ tenantId, spaceId, pageId });

    await this.setFavoriteUseCase.set({
      tenantId,
      userId,
      targetType: FavoriteTarget.PageLike,
      targetId: pageId,
      favorite: liked,
      extraData: {
        spaceId: page.spaceId ?? null,
      },
    });

    const count = await this.countFavoriteByTargetUseCase.count({
      tenantId,
      targetType: FavoriteTarget.PageLike,
      targetId: pageId,
    });

    return {
      liked,
      likeCount: Math.max(0, Number(count.count) || 0),
    };
  }

  private async getPageInSpace(params: {
    tenantId: string;
    spaceId: string;
    pageId: string;
  }) {
    const page = await this.pageService.get(params.pageId, params.tenantId);
    if (page.spaceId !== params.spaceId) {
      throw new NotFoundException('page not found');
    }
    return page;
  }
}
