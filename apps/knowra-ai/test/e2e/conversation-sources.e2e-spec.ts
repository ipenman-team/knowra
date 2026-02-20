import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import * as path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { AppModule } from '../../src/app.module';

function getEnvPathCandidates(): string[] {
  const cwd = process.cwd();
  return [
    path.resolve(cwd, '../../.env'),
    path.resolve(cwd, '../../.env.local'),
    path.resolve(cwd, '.env'),
    path.resolve(cwd, '.env.local'),
  ];
}

describe('ConversationsController (e2e)', () => {
  let prisma: PrismaClient;
  let app: { close: () => Promise<void>; getUrl: () => Promise<string> };
  let baseUrl: string;
  let headers: Record<string, string>;

  beforeAll(async () => {
    for (const p of getEnvPathCandidates()) {
      loadDotenv({ path: p, override: false });
    }

    prisma = new PrismaClient();

    const token = `dev-token-${randomBytes(16).toString('hex')}`;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const tenant = await prisma.tenant.create({
      data: {
        type: 'PERSONAL',
        key: `dev-${randomBytes(4).toString('hex')}`,
        name: 'Dev Tenant',
        createdBy: 'system',
        updatedBy: 'system',
      },
    });

    const user = await prisma.user.create({
      data: {
        createdBy: 'system',
        updatedBy: 'system',
      },
    });

    await prisma.tenantMembership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: 'OWNER',
        createdBy: 'system',
        updatedBy: 'system',
      },
    });

    await prisma.authSession.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: 'system',
        updatedBy: 'system',
      },
    });

    const nestApp = await NestFactory.create(AppModule, { logger: false });
    await nestApp.listen(0);

    app = {
      close: () => nestApp.close(),
      getUrl: () => nestApp.getUrl(),
    };

    baseUrl = await app.getUrl();
    headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('GET /api/conversations/:id/sources returns spaceEnabled=true by default', async () => {
    const createRes = await fetch(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: '测试对话' }),
    });
    expect(createRes.ok).toBe(true);
    const created = (await createRes.json()) as { id?: string };
    expect(typeof created?.id).toBe('string');
    const conversationId = created.id as string;

    const sourcesRes = await fetch(
      `${baseUrl}/api/conversations/${encodeURIComponent(conversationId)}/sources`,
      {
        method: 'GET',
        headers,
      },
    );

    expect(sourcesRes.ok).toBe(true);
    const sources = (await sourcesRes.json()) as {
      internetEnabled: boolean;
      spaceEnabled: boolean;
      spaceIds: unknown;
      carryContext: boolean;
    };

    expect(sources.internetEnabled).toBe(true);
    expect(sources.spaceEnabled).toBe(true);
    expect(Array.isArray(sources.spaceIds)).toBe(true);
    expect(sources.carryContext).toBe(true);
  });
});
