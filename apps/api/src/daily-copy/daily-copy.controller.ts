import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  GenerateTodayDailyCopyUseCase,
  SetTodayDailyCopyLikeUseCase,
} from '@contexta/application';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { SetDailyCopyLikeDto } from './dto/set-daily-copy-like.dto';

@Controller('daily-copies')
export class DailyCopyController {
  constructor(
    private readonly generateUseCase: GenerateTodayDailyCopyUseCase,
    private readonly setLikeUseCase: SetTodayDailyCopyLikeUseCase,
  ) {}

  @Get('today')
  async getToday(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const item = await this.generateUseCase.generateToday({ tenantId, userId });
    return { ok: true, item };
  }

  @Put('today/like')
  async setLike(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: SetDailyCopyLikeDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');
    if (typeof body?.liked !== 'boolean') {
      throw new BadRequestException('liked must be boolean');
    }

    const item = await this.setLikeUseCase.setLike({
      tenantId,
      userId,
      liked: body.liked,
    });

    if (!item) throw new NotFoundException('daily copy not found');

    return { ok: true, item };
  }
}
