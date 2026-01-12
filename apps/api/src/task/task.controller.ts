import { Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { TenantId } from '../common/tenant/tenant-id.decorator';
import { TaskRuntimeService } from './task.runtime.service';
import { TaskService } from './task.service';

@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly taskRuntime: TaskRuntimeService,
  ) {}

  @Get(':id')
  get(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.taskService.get(tenantId, id);
  }

  @Post(':id/cancel')
  async cancel(
    @TenantId() tenantId: string,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') id: string,
  ) {
    const actor = userId?.trim() || 'system';
    this.taskRuntime.abort(id);
    const task = await this.taskService.cancel(tenantId, id, actor, 'Cancelled');
    return { ok: true, task };
  }
}
