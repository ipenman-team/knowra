import { Controller, Get, Param, Post, Sse } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { concat, from, map, type Observable } from 'rxjs';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
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

  @Sse(':id/events')
  events(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Observable<MessageEvent> {
    const initial$ = from(this.taskService.get(tenantId, id));
    const updates$ = this.taskRuntime.observe(id);

    return concat(initial$, updates$).pipe(map((task) => ({ data: task })));
  }

  @Post(':id/cancel')
  async cancel(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
  ) {
    const actor = userId?.trim() || 'system';
    this.taskRuntime.abort(id);
    const task = await this.taskService.cancel(
      tenantId,
      id,
      actor,
      'Cancelled',
    );
    return { ok: true, task };
  }
}
