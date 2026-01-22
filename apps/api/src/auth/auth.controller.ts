import { Body, Controller, Post, Get } from '@nestjs/common';
import { SessionId, TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { AuthService } from './auth.service';

type SendVerificationCodeBody = {
  channel: string;
  recipient: string;
  type: string;
};

type LoginOrRegisterByCodeBody = {
  channel: string;
  recipient: string;
  code: string;
  type?: string;
  tenantKey?: string;
};

type SwitchTenantBody = {
  tenantId?: string;
  tenantKey?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verification-codes/send')
  sendVerificationCode(
    @UserId() userId: string | undefined,
    @Body() body: SendVerificationCodeBody,
  ) {
    return this.authService.sendVerificationCode(body, { userId });
  }

  @Post('login-or-register-by-code')
  loginOrRegisterByCode(
    @UserId() userId: string | undefined,
    @Body() body: LoginOrRegisterByCodeBody,
  ) {
    return this.authService.loginOrRegisterByCode(body, { userId });
  }

  @Post('logout')
  logout(@SessionId() sessionId: string | undefined, @UserId() userId: string | undefined) {
    return this.authService.logout({ sessionId, userId });
  }

  @Get('me')
  me(@UserId() userId: string | undefined, @TenantId() tenantId: string) {
    return this.authService.me({ userId: userId ?? '', tenantId });
  }

  @Post('switch-tenant')
  switchTenant(
    @UserId() userId: string | undefined,
    @SessionId() sessionId: string | undefined,
    @Body() body: SwitchTenantBody,
  ) {
    return this.authService.switchTenant({
      userId: userId ?? '',
      sessionId,
      tenantId: body.tenantId,
      tenantKey: body.tenantKey,
    });
  }
}
