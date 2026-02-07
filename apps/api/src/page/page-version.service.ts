import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PageVersionDto } from './dto/page-version.dto';

@Injectable()
export class PageVersionService {
  constructor(private readonly prisma: PrismaService) {}

  async listVersions(pageId: string, tenantId: string): Promise<PageVersionDto[]> {
    if (!pageId) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const existing = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('page not found');

    return this.prisma.pageVersion.findMany({
      where: { tenantId, pageId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tenantId: true,
        pageId: true,
        status: true,
        title: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getVersion(pageId: string, versionId: string, tenantId: string) {
    if (!pageId) throw new BadRequestException('id is required');
    if (!versionId) throw new BadRequestException('versionId is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const existing = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId, isDeleted: false },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('page not found');

    const version = await this.prisma.pageVersion.findFirst({
      where: { id: versionId, pageId, tenantId, isDeleted: false },
      select: {
        id: true,
        pageId: true,
        status: true,
        title: true,
        content: true,
        updatedBy: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!version) throw new NotFoundException('version not found');
    return version;
  }
}
