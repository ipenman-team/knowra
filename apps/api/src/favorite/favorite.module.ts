import { Global, Module } from '@nestjs/common';
import {
  GetFavoriteStatusUseCase,
  ListFavoritesUseCase,
  SetFavoriteUseCase,
} from '@contexta/application';
import { PrismaFavoriteRepository } from '@contexta/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import { FavoriteController } from './favorite.controller';
import { FAVORITE_REPOSITORY } from './favorite.tokens';

@Global()
@Module({
  controllers: [FavoriteController],
  providers: [
    {
      provide: FAVORITE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaFavoriteRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: SetFavoriteUseCase,
      useFactory: (repo: PrismaFavoriteRepository) => new SetFavoriteUseCase(repo),
      inject: [FAVORITE_REPOSITORY],
    },
    {
      provide: GetFavoriteStatusUseCase,
      useFactory: (repo: PrismaFavoriteRepository) =>
        new GetFavoriteStatusUseCase(repo),
      inject: [FAVORITE_REPOSITORY],
    },
    {
      provide: ListFavoritesUseCase,
      useFactory: (repo: PrismaFavoriteRepository) => new ListFavoritesUseCase(repo),
      inject: [FAVORITE_REPOSITORY],
    },
  ],
  exports: [SetFavoriteUseCase, GetFavoriteStatusUseCase, ListFavoritesUseCase],
})
export class FavoriteModule {}
