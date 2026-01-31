import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import * as crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import {
  generateNumericCode,
  isValidE164,
  isValidEmail,
  normalizeLowerTrim,
  normalizeTrim,
  pickActorId,
} from '@contexta/utils';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private emailTransporter: nodemailer.Transporter | null = null;

  private getEmailTransporter() {
    if (this.emailTransporter) return this.emailTransporter;

    const host = process.env.SMTP_HOST?.trim();
    if (!host) return null;

    const portRaw = process.env.SMTP_PORT?.trim() || '587';
    const port = Number(portRaw);
    if (!Number.isFinite(port) || port <= 0) {
      throw new BadRequestException('SMTP_PORT 配置不正确');
    }

    const secureRaw = process.env.SMTP_SECURE?.trim().toLowerCase();
    const secure = secureRaw ? secureRaw === 'true' : port === 465;

    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    if (user && !pass) {
      throw new BadRequestException('SMTP_PASS 缺失');
    }

    this.emailTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass || '' } : undefined,
    });

    return this.emailTransporter;
  }

  private getEmailFromAddress() {
    const from = process.env.SMTP_FROM?.trim();
    if (from) return from;
    const user = process.env.SMTP_USER?.trim();
    if (user) return user;
    return null;
  }

  private buildEmailContent(args: {
    code: string;
    type: string;
    ttlMinutes: number;
  }): { subject: string; text: string; html: string } {
    const action =
      args.type === 'login'
        ? '登录'
        : args.type === 'register'
          ? '注册'
          : args.type === 'reset_password'
            ? '重置密码'
            : '验证';

    const subject = `Contexta ${action}验证码`;
    const text = `你的 Contexta ${action}验证码是：${args.code}\n\n有效期：${args.ttlMinutes} 分钟。\n如非本人操作，请忽略此邮件。`;
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.6;">
        <div style="font-size: 16px; font-weight: 600;">Contexta ${action}验证码</div>
        <div style="margin-top: 12px; font-size: 14px;">你的验证码是：</div>
        <div style="margin-top: 10px; font-size: 28px; font-weight: 700; letter-spacing: 4px;">${args.code}</div>
        <div style="margin-top: 12px; font-size: 14px; color: #6b7280;">有效期：${args.ttlMinutes} 分钟。如非本人操作，请忽略此邮件。</div>
      </div>
    `.trim();

    return { subject, text, html };
  }

  private buildDefaultNickname(args: {
    provider: string;
    recipient: string;
    identifier: string;
  }): string {
    const fallback = args.provider === 'email' ? 'user@example.com' : '用户';
    const raw =
      normalizeTrim(args.recipient) ||
      normalizeTrim(args.identifier) ||
      fallback;
    const maxLen = 80;
    return raw.length > maxLen ? raw.slice(0, maxLen) : raw;
  }

  private buildAvatarLabel(nickname: string): string {
    const raw = normalizeTrim(nickname);
    if (!raw) return 'U';

    const head = raw.includes('@') ? raw.split('@')[0] : raw;
    const cleaned = head.replace(/[^0-9a-zA-Z\u4e00-\u9fff]/g, '');
    if (!cleaned) return 'U';

    const chars = Array.from(cleaned);
    const label = chars.slice(0, 2).join('');
    return /^[a-z0-9]+$/i.test(label) ? label.toUpperCase() : label;
  }

  private buildDefaultAvatarDataUrl(args: {
    seed: string;
    nickname: string;
  }): string {
    const label = this.buildAvatarLabel(args.nickname).replace(/[<>&'"]/g, '');
    const hash = crypto.createHash('sha256').update(args.seed).digest('hex');
    const hue = parseInt(hash.slice(0, 8), 16) % 360;
    const bg = `hsl(${hue} 70% 45%)`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="${bg}"/><text x="64" y="78" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="48" font-weight="700" fill="#ffffff">${label}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  private hashPassword(raw: string): string {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(raw, salt, 32);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  private verifyPassword(raw: string, secretHash: string | null | undefined): boolean {
    if (!secretHash) return false;
    const [saltHex, hashHex] = secretHash.split(':');
    if (!saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(raw, salt, expected.length);
    return crypto.timingSafeEqual(actual, expected);
  }

  private makeSessionToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private hashSessionToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async ensureTenantForUser(
    db: Prisma.TransactionClient,
    args: { userId: string; tenantKey?: string; actorId: string },
  ) {
    const key = normalizeLowerTrim(args.tenantKey ?? '');
    if (key) {
      const tenant = await db.tenant.findFirst({
        where: { key, isDeleted: false },
        select: { id: true, type: true, key: true, name: true },
      });
      if (!tenant) {
        throw new BadRequestException('tenant 不存在');
      }

      const membership = await db.tenantMembership.findFirst({
        where: {
          tenantId: tenant.id,
          userId: args.userId,
          isDeleted: false,
        },
        select: { id: true },
      });
      if (!membership) {
        throw new HttpException('无权限访问该租户', HttpStatus.FORBIDDEN);
      }
      return tenant;
    }

    const personal = await db.tenantMembership.findFirst({
      where: {
        userId: args.userId,
        isDeleted: false,
        tenant: {
          isDeleted: false,
          type: 'PERSONAL',
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        tenant: { select: { id: true, type: true, key: true, name: true } },
      },
    });
    if (personal?.tenant) return personal.tenant;

    const anyMembership = await db.tenantMembership.findFirst({
      where: {
        userId: args.userId,
        isDeleted: false,
        tenant: {
          isDeleted: false,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        tenant: { select: { id: true, type: true, key: true, name: true } },
      },
    });
    if (anyMembership?.tenant) return anyMembership.tenant;

    const createdTenant = await db.tenant.create({
      data: {
        type: 'PERSONAL',
        key: null,
        name: '个人空间',
        isDeleted: false,
        createdBy: args.actorId,
        updatedBy: args.actorId,
      },
      select: { id: true, type: true, key: true, name: true },
    });

    await db.tenantMembership.create({
      data: {
        tenantId: createdTenant.id,
        userId: args.userId,
        role: 'OWNER',
        isDeleted: false,
        createdBy: args.actorId,
        updatedBy: args.actorId,
      },
      select: { id: true },
    });

    return createdTenant;
  }

  async sendVerificationCode(
    body: { channel: string; recipient: string; type: string },
    ctx: { userId?: string },
  ) {
    const channel = normalizeLowerTrim(body.channel);
    const recipient = normalizeTrim(body.recipient);
    const type = normalizeLowerTrim(body.type);

    if (channel !== 'email' && channel !== 'sms') {
      throw new BadRequestException('channel 不支持');
    }

    if (
      !type ||
      (type !== 'register' && type !== 'login' && type !== 'reset_password')
    ) {
      throw new BadRequestException('type 不支持');
    }

    if (type === 'reset_password' && channel !== 'email') {
      throw new BadRequestException('重置密码仅支持邮箱验证码');
    }

    if (channel === 'email' && !isValidEmail(recipient)) {
      throw new BadRequestException('邮箱格式不正确');
    }
    if (channel === 'sms' && !isValidE164(recipient)) {
      throw new BadRequestException('手机号格式不正确');
    }

    if (type === 'reset_password') {
      const identifier = normalizeLowerTrim(recipient);
      const existingIdentity = await this.prisma.userIdentity.findFirst({
        where: {
          provider: 'email',
          identifier,
          isDeleted: false,
        },
        select: { id: true },
      });
      if (!existingIdentity) {
        throw new BadRequestException('邮箱未注册');
      }
    }

    const actor = pickActorId(ctx.userId);
    const now = new Date();
    const cooldownSeconds = 60;
    const ttlMinutes = 10;

    const latest = await this.prisma.verificationCode.findFirst({
      where: {
        channel,
        recipient,
        type,
        used: false,
        isDeleted: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        createdAt: true,
      },
    });

    if (latest) {
      const elapsedSeconds = Math.floor(
        (now.getTime() - latest.createdAt.getTime()) / 1000,
      );
      if (elapsedSeconds < cooldownSeconds) {
        const remaining = Math.max(0, cooldownSeconds - elapsedSeconds);
        return {
          cooldownSeconds: remaining,
        };
      }
    }

    const code = generateNumericCode(6);
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const created = await this.prisma.verificationCode.create({
      data: {
        channel,
        recipient,
        code,
        type,
        expiresAt,
        used: false,
        isDeleted: false,
        createdBy: actor,
        updatedBy: actor,
      },
      select: { id: true },
    });

    if (channel === 'sms') {
      throw new HttpException('短信验证码暂未接入', HttpStatus.NOT_IMPLEMENTED);
    }

    const transporter = this.getEmailTransporter();
    const from = this.getEmailFromAddress();
    if (!transporter || !from) {
      await this.prisma.verificationCode.update({
        where: { id: created.id },
        data: { isDeleted: true, updatedBy: actor },
        select: { id: true },
      });
      throw new HttpException('邮件服务未配置', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const content = this.buildEmailContent({ code, type, ttlMinutes });
      await transporter.sendMail({
        from,
        to: recipient,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
    } catch {
      await this.prisma.verificationCode.update({
        where: { id: created.id },
        data: { isDeleted: true, updatedBy: actor },
        select: { id: true },
      });
      throw new HttpException(
        '邮件发送失败，请稍后重试',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      cooldownSeconds,
    };
  }

  async loginOrRegisterByCode(
    body: {
      channel: string;
      recipient: string;
      code: string;
      type?: string;
      tenantKey?: string;
    },
    ctx: { userId?: string },
  ) {
    const channel = normalizeLowerTrim(body.channel);
    const recipient = normalizeTrim(body.recipient);
    const code = (body.code ?? '').trim();
    const type = normalizeLowerTrim(body.type ?? 'login');
    const tenantKey = normalizeLowerTrim(body.tenantKey ?? '');

    if (channel !== 'email' && channel !== 'sms') {
      throw new BadRequestException('channel 不支持');
    }

    if (
      !type ||
      (type !== 'register' && type !== 'login' && type !== 'reset_password')
    ) {
      throw new BadRequestException('type 不支持');
    }

    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('验证码格式不正确');
    }

    if (channel === 'email' && !isValidEmail(recipient)) {
      throw new BadRequestException('邮箱格式不正确');
    }
    if (channel === 'sms' && !isValidE164(recipient)) {
      throw new BadRequestException('手机号格式不正确');
    }

    const now = new Date();

    const latest = await this.prisma.verificationCode.findFirst({
      where: {
        channel,
        recipient,
        type,
        used: false,
        isDeleted: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
      },
    });

    if (!latest || latest.code !== code) {
      throw new BadRequestException('验证码错误或已过期');
    }

    const provider = channel === 'email' ? 'email' : 'phone';
    const identifier =
      channel === 'email'
        ? normalizeLowerTrim(recipient)
        : normalizeTrim(recipient);

    const now2 = new Date();

    const sessionTtlDays = 30;
    const expiresAt = new Date(
      now2.getTime() + sessionTtlDays * 24 * 60 * 60 * 1000,
    );
    return this.prisma.$transaction(async (tx) => {
      const existingIdentity = await tx.userIdentity.findFirst({
        where: {
          provider,
          identifier,
          isDeleted: false,
        },
        select: {
          id: true,
          userId: true,
          isVerified: true,
        },
      });

      let userId: string;
      if (!existingIdentity) {
        const createdUser = await tx.user.create({
          data: {
            isDeleted: false,
            createdBy: pickActorId(ctx.userId),
            updatedBy: pickActorId(ctx.userId),
          },
          select: { id: true },
        });

        userId = createdUser.id;

        await tx.userIdentity.create({
          data: {
            userId,
            provider,
            identifier,
            isVerified: true,
            isDeleted: false,
            createdBy: userId,
            updatedBy: userId,
          },
          select: { id: true },
        });
      } else {
        userId = existingIdentity.userId;

        if (!existingIdentity.isVerified) {
          await tx.userIdentity.update({
            where: { id: existingIdentity.id },
            data: { isVerified: true, updatedBy: userId },
            select: { id: true },
          });
        }
      }

      const actorId = userId;

      const defaultNickname = this.buildDefaultNickname({
        provider,
        recipient,
        identifier,
      });
      const defaultPhone =
        provider === 'phone' ? normalizeTrim(recipient) : null;

      const existingProfile = await tx.userProfile.findFirst({
        where: { userId, isDeleted: false },
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
          phone: true,
        },
      });

      if (!existingProfile) {
        const avatarUrl = this.buildDefaultAvatarDataUrl({
          seed: userId,
          nickname: defaultNickname,
        });
        await tx.userProfile.create({
          data: {
            userId,
            nickname: defaultNickname,
            avatarUrl,
            bio: null,
            phone: defaultPhone,
            isDeleted: false,
            createdBy: actorId,
            updatedBy: actorId,
          },
          select: { id: true },
        });
      } else {
        const next: {
          nickname?: string;
          avatarUrl?: string | null;
          phone?: string | null;
        } = {};

        const baseNickname = existingProfile.nickname || defaultNickname;

        if (!existingProfile.nickname) next.nickname = defaultNickname;
        if (existingProfile.avatarUrl == null) {
          next.avatarUrl = this.buildDefaultAvatarDataUrl({
            seed: userId,
            nickname: baseNickname,
          });
        }
        if (defaultPhone && !existingProfile.phone) next.phone = defaultPhone;

        if (Object.keys(next).length > 0) {
          await tx.userProfile.update({
            where: { id: existingProfile.id },
            data: {
              ...next,
              updatedBy: actorId,
            },
            select: { id: true },
          });
        }
      }

      const used = await tx.verificationCode.updateMany({
        where: {
          id: latest.id,
          channel,
          recipient,
          type,
          code,
          used: false,
          isDeleted: false,
          expiresAt: { gt: now },
        },
        data: {
          used: true,
          updatedBy: actorId,
        },
      });
      if (used.count !== 1) {
        throw new BadRequestException('验证码错误或已过期');
      }

      const tenant = await this.ensureTenantForUser(tx, {
        userId,
        tenantKey: tenantKey || undefined,
        actorId,
      });

      const accessToken = this.makeSessionToken();
      const tokenHash = this.hashSessionToken(accessToken);
      await tx.authSession.create({
        data: {
          userId,
          tenantId: tenant.id,
          tokenHash,
          expiresAt,
          revokedAt: null,
          isDeleted: false,
          createdBy: actorId,
          updatedBy: actorId,
        },
        select: { id: true },
      });

      return {
        ok: true,
        user: { id: userId },
        tenant,
        token: { accessToken, expiresIn: sessionTtlDays * 24 * 60 * 60 },
      };
    });
  }

  async logout(input: { sessionId?: string; userId?: string }) {
    const sessionId = (input.sessionId ?? '').trim();
    if (!sessionId) return { ok: true };

    const actor = pickActorId(input.userId);
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        isDeleted: false,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        updatedBy: actor,
      },
    });

    return { ok: true };
  }

  async loginByPassword(
    body: { account: string; password: string; tenantKey?: string },
    ctx: { userId?: string },
  ) {
    const account = normalizeTrim(body.account);
    const password = (body.password ?? '').trim();
    const tenantKey = normalizeLowerTrim(body.tenantKey ?? '');

    if (!account) {
      throw new BadRequestException('账号不能为空');
    }
    if (!password) {
      throw new BadRequestException('密码不能为空');
    }

    let provider: 'email' | 'phone';
    let identifier: string;
    if (isValidEmail(account)) {
      provider = 'email';
      identifier = normalizeLowerTrim(account);
    } else if (isValidE164(account)) {
      provider = 'phone';
      identifier = normalizeTrim(account);
    } else {
      throw new BadRequestException('账号格式不正确');
    }

    const now = new Date();
    const sessionTtlDays = 30;
    const expiresAt = new Date(
      now.getTime() + sessionTtlDays * 24 * 60 * 60 * 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      const identity = await tx.userIdentity.findFirst({
        where: {
          provider,
          identifier,
          isDeleted: false,
        },
        select: {
          id: true,
          userId: true,
          isVerified: true,
          secretHash: true,
        },
      });

      if (!identity || !this.verifyPassword(password, identity.secretHash)) {
        throw new BadRequestException('账号或密码错误');
      }

      const userId = identity.userId;
      const actorId = userId;

      if (!identity.isVerified) {
        await tx.userIdentity.update({
          where: { id: identity.id },
          data: { isVerified: true, updatedBy: actorId },
          select: { id: true },
        });
      }

      const defaultNickname = this.buildDefaultNickname({
        provider,
        recipient: account,
        identifier,
      });
      const defaultPhone =
        provider === 'phone' ? normalizeTrim(account) : null;

      const existingProfile = await tx.userProfile.findFirst({
        where: { userId, isDeleted: false },
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
          phone: true,
        },
      });

      if (!existingProfile) {
        const avatarUrl = this.buildDefaultAvatarDataUrl({
          seed: userId,
          nickname: defaultNickname,
        });
        await tx.userProfile.create({
          data: {
            userId,
            nickname: defaultNickname,
            avatarUrl,
            bio: null,
            phone: defaultPhone,
            isDeleted: false,
            createdBy: actorId,
            updatedBy: actorId,
          },
          select: { id: true },
        });
      } else {
        const next: {
          nickname?: string;
          avatarUrl?: string | null;
          phone?: string | null;
        } = {};

        const baseNickname = existingProfile.nickname || defaultNickname;

        if (!existingProfile.nickname) next.nickname = defaultNickname;
        if (existingProfile.avatarUrl == null) {
          next.avatarUrl = this.buildDefaultAvatarDataUrl({
            seed: userId,
            nickname: baseNickname,
          });
        }
        if (defaultPhone && !existingProfile.phone) next.phone = defaultPhone;

        if (Object.keys(next).length > 0) {
          await tx.userProfile.update({
            where: { id: existingProfile.id },
            data: {
              ...next,
              updatedBy: actorId,
            },
            select: { id: true },
          });
        }
      }

      const tenant = await this.ensureTenantForUser(tx, {
        userId,
        tenantKey: tenantKey || undefined,
        actorId,
      });

      const accessToken = this.makeSessionToken();
      const tokenHash = this.hashSessionToken(accessToken);
      await tx.authSession.create({
        data: {
          userId,
          tenantId: tenant.id,
          tokenHash,
          expiresAt,
          revokedAt: null,
          isDeleted: false,
          createdBy: actorId,
          updatedBy: actorId,
        },
        select: { id: true },
      });

      return {
        ok: true,
        user: { id: userId },
        tenant,
        token: { accessToken, expiresIn: sessionTtlDays * 24 * 60 * 60 },
      };
    });
  }

  async switchTenant(input: {
    userId: string;
    sessionId?: string;
    tenantId?: string;
    tenantKey?: string;
  }) {
    const userId = input.userId?.trim();
    if (!userId) throw new BadRequestException('userId is required');

    const tenantId = (input.tenantId ?? '').trim();
    const tenantKey = normalizeLowerTrim(input.tenantKey ?? '');
    if (!tenantId && !tenantKey) {
      throw new BadRequestException('tenantId or tenantKey is required');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        isDeleted: false,
        ...(tenantId ? { id: tenantId } : { key: tenantKey }),
      },
      select: { id: true, type: true, key: true, name: true },
    });
    if (!tenant) throw new BadRequestException('tenant 不存在');

    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        tenantId: tenant.id,
        userId,
        isDeleted: false,
      },
      select: { id: true },
    });
    if (!membership) {
      throw new HttpException('无权限访问该租户', HttpStatus.FORBIDDEN);
    }

    const sessionTtlDays = 30;
    const expiresAt = new Date(
      Date.now() + sessionTtlDays * 24 * 60 * 60 * 1000,
    );
    const accessToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto
      .createHash('sha256')
      .update(accessToken)
      .digest('hex');
    const actor = pickActorId(userId);

    await this.prisma.authSession.create({
      data: {
        userId,
        tenantId: tenant.id,
        tokenHash,
        expiresAt,
        revokedAt: null,
        isDeleted: false,
        createdBy: actor,
        updatedBy: actor,
      },
      select: { id: true },
    });

    const oldSessionId = (input.sessionId ?? '').trim();
    if (oldSessionId) {
      await this.prisma.authSession.updateMany({
        where: {
          id: oldSessionId,
          userId,
          isDeleted: false,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          updatedBy: actor,
        },
      });
    }

    return {
      ok: true,
      tenant,
      token: { accessToken, expiresIn: sessionTtlDays * 24 * 60 * 60 },
    };
  }

  async resetPasswordByEmail(
    body: { recipient: string; code: string; newPassword: string },
    ctx: { userId?: string },
  ) {
    const recipient = normalizeTrim(body.recipient);
    const code = (body.code ?? '').trim();
    const newPassword = (body.newPassword ?? '').trim();

    if (!isValidEmail(recipient)) {
      throw new BadRequestException('邮箱格式不正确');
    }
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('验证码格式不正确');
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('密码至少 8 位');
    }

    const actor = pickActorId(ctx.userId);
    const identifier = normalizeLowerTrim(recipient);
    const now = new Date();

    const latest = await this.prisma.verificationCode.findFirst({
      where: {
        channel: 'email',
        recipient,
        type: 'reset_password',
        used: false,
        isDeleted: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
      },
    });

    if (!latest || latest.code !== code) {
      throw new BadRequestException('验证码错误或已过期');
    }

    return this.prisma.$transaction(async (tx) => {
      const identity = await tx.userIdentity.findFirst({
        where: {
          provider: 'email',
          identifier,
          isDeleted: false,
        },
        select: { id: true, userId: true },
      });

      if (!identity) {
        throw new BadRequestException('邮箱未注册');
      }

      await tx.userIdentity.update({
        where: { id: identity.id },
        data: {
          secretHash: this.hashPassword(newPassword),
          isVerified: true,
          updatedBy: actor,
        },
        select: { id: true },
      });

      const used = await tx.verificationCode.updateMany({
        where: {
          id: latest.id,
          channel: 'email',
          recipient,
          type: 'reset_password',
          code,
          used: false,
          isDeleted: false,
          expiresAt: { gt: now },
        },
        data: {
          used: true,
          updatedBy: actor,
        },
      });
      if (used.count !== 1) {
        throw new BadRequestException('验证码错误或已过期');
      }

      return { ok: true };
    });
  }
}
