import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TenantId } from '../common/tenant/tenant-id.decorator';
import { CreatePageDto } from './dto/create-page.dto';
import { SavePageDto } from './dto/save-page.dto';
import { PageService } from './page.service';

@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() body: CreatePageDto) {
    return this.pageService.create(tenantId, body);
  }

  @Put(':id')
  save(@TenantId() tenantId: string, @Param('id') id: string, @Body() body: SavePageDto) {
    return this.pageService.save(tenantId, id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.pageService.remove(id, tenantId);
  }

  @Get(':id')
  get(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.pageService.get(id, tenantId);
  }

  @Get()
  list(@TenantId() tenantId: string) {
    return this.pageService.list(tenantId);
  }
}
