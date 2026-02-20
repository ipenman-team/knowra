import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import {
  SessionId,
  UserId,
} from '../common/tenant/tenant-id.decorator';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  buildAccessTokenCookieOptions,
} from '../common/http/access-token-cookie';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { Response as ApiResponse } from '@knowra/shared';

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
  async sendVerificationCode(
    @UserId() userId: string | undefined,
    @Body() body: SendVerificationCodeBody,
  ) {
    return new ApiResponse(
      await this.authService.sendVerificationCode(body, { userId }),
    );
  }

  @Post('login-or-register-by-code')
  async loginOrRegisterByCode(
    @UserId() userId: string | undefined,
    @Body() body: LoginOrRegisterByCodeBody,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.loginOrRegisterByCode(body, { userId });
    const accessToken = String(data?.token?.accessToken ?? '');
    res.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      accessToken,
      buildAccessTokenCookieOptions(req, ACCESS_TOKEN_COOKIE_MAX_AGE_MS),
    );
    return new ApiResponse(data);
  }

  @Post('login-by-password')
  async loginByPassword(
    @UserId() userId: string | undefined,
    @Body() body: LoginByPasswordBody,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.loginByPassword(body, { userId });
    const accessToken = String(data?.token?.accessToken ?? '');
    res.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      accessToken,
      buildAccessTokenCookieOptions(req, ACCESS_TOKEN_COOKIE_MAX_AGE_MS),
    );
    return new ApiResponse(data);
  }

  @Post('logout')
  logout(
    @SessionId() sessionId: string | undefined,
    @UserId() userId: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // clear cookie
    res.cookie(ACCESS_TOKEN_COOKIE_NAME, '', buildAccessTokenCookieOptions(req, 0));
    return new ApiResponse(null);
  }

  @Post('switch-tenant')
  switchTenant(
    @UserId() userId: string | undefined,
    @SessionId() sessionId: string | undefined,
    @Body() body: SwitchTenantBody,
    @Req() req: Request,
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
          res.cookie(
            ACCESS_TOKEN_COOKIE_NAME,
            accessToken,
            buildAccessTokenCookieOptions(req, ACCESS_TOKEN_COOKIE_MAX_AGE_MS),
          );
        }
        return new ApiResponse(result);
      });
  }

  @Post('password/reset')
  async resetPassword(
    @UserId() userId: string | undefined,
    @Body() body: ResetPasswordBody,
  ) {
    return new ApiResponse(
      await this.authService.resetPasswordByEmail(body, { userId }),
    );
  }
}
