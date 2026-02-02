import { Body, Controller, Post, Get, Res } from '@nestjs/common';
import {
  SessionId,
  TenantId,
  UserId,
} from '../common/tenant/tenant-id.decorator';
import { AuthService } from './auth.service';
import type { Response } from 'express';

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

type LoginByPasswordBody = {
  account: string;
  password: string;
  tenantKey?: string;
};

type SwitchTenantBody = {
  tenantId?: string;
  tenantKey?: string;
};

type ResetPasswordBody = {
  recipient: string;
  code: string;
  newPassword: string;
};

const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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
  async loginOrRegisterByCode(
    @UserId() userId: string | undefined,
    @Body() body: LoginOrRegisterByCodeBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.loginOrRegisterByCode(body, { userId });
    const accessToken = String(data?.token?.accessToken ?? '');
    res.cookie('ctxa_access_token', accessToken, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
      secure: process.env.NODE_ENV === 'production',
    });
    return data;
  }

  @Post('login-by-password')
  async loginByPassword(
    @UserId() userId: string | undefined,
    @Body() body: LoginByPasswordBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.loginByPassword(body, { userId });
    const accessToken = String(data?.token?.accessToken ?? '');
    res.cookie('ctxa_access_token', accessToken, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
      secure: process.env.NODE_ENV === 'production',
    });
    return data;
  }

  @Post('logout')
  logout(
    @SessionId() sessionId: string | undefined,
    @UserId() userId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    // clear cookie
    res.cookie('ctxa_access_token', '', {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 0,
      secure: process.env.NODE_ENV === 'production',
    });
    return this.authService.logout({ sessionId, userId });
  }

  @Post('switch-tenant')
  switchTenant(
    @UserId() userId: string | undefined,
    @SessionId() sessionId: string | undefined,
    @Body() body: SwitchTenantBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService
      .switchTenant({
        userId: userId ?? '',
        sessionId,
        tenantId: body.tenantId,
        tenantKey: body.tenantKey,
      })
      .then((result) => {
        const accessToken = String(result?.token?.accessToken ?? '');
        if (accessToken) {
          res.cookie('ctxa_access_token', accessToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
            secure: process.env.NODE_ENV === 'production',
          });
        }
        return result;
      });
  }

  @Post('password/reset')
  resetPassword(
    @UserId() userId: string | undefined,
    @Body() body: ResetPasswordBody,
  ) {
    return this.authService.resetPasswordByEmail(body, { userId });
  }
}
