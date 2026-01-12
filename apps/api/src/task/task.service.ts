import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus, TaskType, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTaskInput, TaskDto } from './task.dto';

const TERMINAL_STATUSES: TaskStatus[] = [
  TaskStatus.SUCCEEDED,
  TaskStatus.FAILED,
  TaskStatus.CANCELLED,
];

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, input: CreateTaskInput): Promise<TaskDto> {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!userId) throw new BadRequestException('userId is required');

    return this.prisma.task.create({
      data: {
        tenantId,
        type: input.type,
        status: TaskStatus.PENDING,
        progress: 0,
        payload: (input.payload ?? null) as Prisma.InputJsonValue,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async get(tenantId: string, id: string): Promise<TaskDto> {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!id) throw new BadRequestException('id is required');

    const task = await this.prisma.task.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!task) throw new NotFoundException('task not found');
    return task;
  }

  async markRunning(tenantId: string, id: string, message?: string) {
    await this.prisma.task.updateMany({
      where: {
        id,
        tenantId,
        isDeleted: false,
        status: TaskStatus.PENDING,
      },
      data: {
        status: TaskStatus.RUNNING,
        startedAt: new Date(),
        message,
      },
    });

    return this.get(tenantId, id);
  }

  async updateProgress(tenantId: string, id: string, progress: number, message?: string) {
    const normalized = Math.max(0, Math.min(100, Math.trunc(progress)));

    await this.prisma.task.updateMany({
      where: {
        id,
        tenantId,
        isDeleted: false,
        status: TaskStatus.RUNNING,
      },
      data: {
        progress: normalized,
        message,
      },
    });

    return this.get(tenantId, id);
  }

  async succeed(tenantId: string, id: string, result?: unknown, message?: string) {
    await this.prisma.task.updateMany({
      where: {
        id,
        tenantId,
        isDeleted: false,
        status: TaskStatus.RUNNING,
      },
      data: {
        status: TaskStatus.SUCCEEDED,
        progress: 100,
        message,
        result: (result ?? null) as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });

    return this.get(tenantId, id);
  }

  async fail(tenantId: string, id: string, error: unknown, message?: string) {
    const text =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : JSON.stringify(error);

    await this.prisma.task.updateMany({
      where: {
        id,
        tenantId,
        isDeleted: false,
        status: { notIn: TERMINAL_STATUSES },
      },
      data: {
        status: TaskStatus.FAILED,
        message,
        error: text,
        finishedAt: new Date(),
      },
    });

    return this.get(tenantId, id);
  }

  async cancel(tenantId: string, id: string, userId: string, message?: string) {
    await this.prisma.task.updateMany({
      where: {
        id,
        tenantId,
        isDeleted: false,
        status: { notIn: TERMINAL_STATUSES },
      },
      data: {
        status: TaskStatus.CANCELLED,
        message,
        cancelRequestedAt: new Date(),
        finishedAt: new Date(),
        updatedBy: userId,
      },
    });

    return this.get(tenantId, id);
  }

  isTerminal(status: TaskStatus) {
    return TERMINAL_STATUSES.includes(status);
  }

  ensureNotCancelled(task: { status: TaskStatus }) {
    if (task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException('task cancelled');
    }
  }
}
