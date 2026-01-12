import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskRuntimeService {
  private readonly abortControllers = new Map<string, AbortController>();

  registerAbortController(taskId: string, controller: AbortController) {
    this.abortControllers.set(taskId, controller);
  }

  unregisterAbortController(taskId: string) {
    this.abortControllers.delete(taskId);
  }

  abort(taskId: string): boolean {
    const controller = this.abortControllers.get(taskId);
    if (!controller) return false;

    controller.abort();
    this.abortControllers.delete(taskId);
    return true;
  }
}
