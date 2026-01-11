import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreatePageDto } from './dto/create-page.dto';
import { SavePageDto } from './dto/save-page.dto';
import { PageService } from './page.service';

@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  create(@Body() body: CreatePageDto) {
    return this.pageService.create(body);
  }

  @Put(':id')
  save(@Param('id') id: string, @Body() body: SavePageDto) {
    return this.pageService.save(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.pageService.remove(id, tenantId);
  }

  @Get(':id')
  get(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.pageService.get(id, tenantId);
  }

  @Get()
  list(@Query('tenantId') tenantId: string) {
    return this.pageService.list(tenantId);
  }
}
