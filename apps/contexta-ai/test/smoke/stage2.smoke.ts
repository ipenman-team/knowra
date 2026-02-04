import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'node:crypto';
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

async function main() {
  for (const p of getEnvPathCandidates()) {
    loadDotenv({ path: p, override: false });
  }

  const prisma = new PrismaClient();

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

  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  const baseUrl = await app.getUrl();

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const healthRes = await fetch(`${baseUrl}/health`);
  if (!healthRes.ok) throw new Error(`/health failed: ${healthRes.status}`);

  const createRes = await fetch(`${baseUrl}/api/conversations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: '测试对话' }),
  });
  if (!createRes.ok) {
    throw new Error(`create conversation failed: ${createRes.status}`);
  }
  const created = (await createRes.json()) as { id: string; title: string };
  if (!created?.id) throw new Error('create response missing id');

  const listRes = await fetch(`${baseUrl}/api/conversations`, {
    method: 'GET',
    headers,
  });
  if (!listRes.ok) throw new Error(`list conversations failed: ${listRes.status}`);
  const list = (await listRes.json()) as Array<{ id: string }>;
  if (!Array.isArray(list) || list.length < 1) {
    throw new Error('list conversations empty');
  }

  const messagesRes = await fetch(
    `${baseUrl}/api/conversations/${created.id}/messages`,
    {
      method: 'GET',
      headers,
    },
  );
  if (!messagesRes.ok) {
    throw new Error(`list messages failed: ${messagesRes.status}`);
  }
  const messages = (await messagesRes.json()) as unknown[];
  if (!Array.isArray(messages)) throw new Error('messages is not array');

  const renameRes = await fetch(
    `${baseUrl}/api/conversations/${created.id}/rename`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: '重命名-测试对话' }),
    },
  );
  if (!renameRes.ok) {
    throw new Error(`rename conversation failed: ${renameRes.status}`);
  }
  const renamed = (await renameRes.json()) as { id: string; title: string };
  if (renamed?.id !== created.id) throw new Error('rename response id mismatch');
  if (renamed?.title !== '重命名-测试对话') {
    throw new Error(`rename response title mismatch: ${renamed?.title}`);
  }

  await app.close();
  await prisma.$disconnect();

  process.stdout.write(
    `OK stage2: conversation=${created.id} title=${renamed.title} messages=${messages.length}\n`,
  );
}

void main();
