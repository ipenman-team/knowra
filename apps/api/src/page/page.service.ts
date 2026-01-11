import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { PageDto } from './dto/page.dto';
import { SavePageDto } from './dto/save-page.dto';

@Injectable()
export class PageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePageDto): Promise<PageDto> {
    if (!input.tenantId) throw new BadRequestException('tenantId is required');
    if (!input.title) throw new BadRequestException('title is required');

    return this.prisma.page.create({
      data: {
        tenantId: input.tenantId,
        title: input.title,
        content: input.content ?? '',
        parentIds: input.parentIds ?? [],
      },
    });
  }

  async save(id: string, input: SavePageDto): Promise<PageDto> {
    if (!id) throw new BadRequestException('id is required');
    if (!input.tenantId) throw new BadRequestException('tenantId is required');

    const existing = await this.prisma.page.findFirst({
      where: { id, tenantId: input.tenantId },
    });
    if (!existing) throw new NotFoundException('page not found');

    return this.prisma.page.update({
      where: { id },
      data: {
        title: input.title ?? existing.title,
        content: input.content ?? existing.content,
        parentIds: input.parentIds ?? existing.parentIds,
      },
    });
  }

  async remove(id: string, tenantId: string): Promise<{ ok: true }>{
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const existing = await this.prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('page not found');

    await this.prisma.page.delete({ where: { id } });
    return { ok: true };
  }

  async get(id: string, tenantId: string): Promise<PageDto> {
    if (!id) throw new BadRequestException('id is required');
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const page = await this.prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) throw new NotFoundException('page not found');

    return page;
  }

  async list(tenantId: string): Promise<PageDto[]> {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    return this.prisma.page.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
