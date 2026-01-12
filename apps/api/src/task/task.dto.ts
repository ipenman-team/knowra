import type { Task, TaskStatus, TaskType } from '@prisma/client';

export type TaskDto = Pick<
  Task,
  | 'id'
  | 'tenantId'
  | 'type'
  | 'status'
  | 'progress'
  | 'message'
  | 'payload'
  | 'result'
  | 'error'
  | 'cancelRequestedAt'
  | 'startedAt'
  | 'finishedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export type CreateTaskInput = {
  type: TaskType;
  payload?: unknown;
};

export type CancelTaskResult = {
  ok: true;
  task: TaskDto;
};

export type GetTaskResult = TaskDto;

export { TaskStatus, TaskType };
