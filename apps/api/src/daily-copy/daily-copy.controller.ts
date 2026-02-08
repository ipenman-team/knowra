import {
  Controller,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import {
  GenerateTodayDailyCopyUseCase,
} from '@contexta/application';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';

@Controller('daily-copies')
export class DailyCopyController {
  constructor(
    private readonly generateUseCase: GenerateTodayDailyCopyUseCase,
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
}
