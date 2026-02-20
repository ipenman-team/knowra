import { Test, TestingModule } from '@nestjs/testing';
import {
  CountFavoriteByTargetUseCase,
  GetFavoriteStatusUseCase,
  SetFavoriteUseCase,
} from '@knowra/application';
import { FavoriteTarget } from '@knowra/domain';

import { PageLikeService } from '../../page-like.service';
import { PageService } from '../../page.service';

describe('PageLikeService', () => {
  let service: PageLikeService;

  const pageService = {
    get: jest.fn(),
  };

  const setFavoriteUseCase = {
    set: jest.fn(),
  };

  const getFavoriteStatusUseCase = {
    getStatus: jest.fn(),
  };

  const countFavoriteByTargetUseCase = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageLikeService,
        { provide: PageService, useValue: pageService },
        { provide: SetFavoriteUseCase, useValue: setFavoriteUseCase },
        {
          provide: GetFavoriteStatusUseCase,
          useValue: getFavoriteStatusUseCase,
        },
        {
          provide: CountFavoriteByTargetUseCase,
          useValue: countFavoriteByTargetUseCase,
        },
      ],
    }).compile();

    service = module.get(PageLikeService);
  });

  it('setLike updates like state without recording activity', async () => {
    pageService.get.mockResolvedValue({
      id: 'p1',
      spaceId: 's1',
      title: 'T',
    });
    setFavoriteUseCase.set.mockResolvedValue(undefined);
    countFavoriteByTargetUseCase.count.mockResolvedValue({ count: 2 });

    await expect(
      service.setLike({
        tenantId: 't1',
        userId: 'u1',
        spaceId: 's1',
        pageId: 'p1',
        liked: true,
      }),
    ).resolves.toEqual({
      liked: true,
      likeCount: 2,
    });

    expect(setFavoriteUseCase.set).toHaveBeenCalledWith({
      tenantId: 't1',
      userId: 'u1',
      targetType: FavoriteTarget.PageLike,
      targetId: 'p1',
      favorite: true,
      extraData: {
        spaceId: 's1',
      },
    });
    expect(getFavoriteStatusUseCase.getStatus).not.toHaveBeenCalled();
  });

  it('getSummary returns liked status and like count', async () => {
    pageService.get.mockResolvedValue({
      id: 'p1',
      spaceId: 's1',
      title: 'T',
    });
    getFavoriteStatusUseCase.getStatus.mockResolvedValue({ favorite: true });
    countFavoriteByTargetUseCase.count.mockResolvedValue({ count: 5 });

    await expect(
      service.getSummary({
        tenantId: 't1',
        userId: 'u1',
        spaceId: 's1',
        pageId: 'p1',
      }),
    ).resolves.toEqual({
      liked: true,
      likeCount: 5,
    });
  });
});
