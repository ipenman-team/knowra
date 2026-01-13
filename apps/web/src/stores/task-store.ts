import { create } from 'zustand';
import type { ProgressTask } from '@/features/home/components/progress-manager';

interface TaskRuntimeData {
  upload?: AbortController;
  sse?: EventSource;
}

interface TaskState {
  tasks: ProgressTask[];
  taskRuntime: Map<string, TaskRuntimeData>;

  // Actions
  addTask: (task: ProgressTask) => void;
  updateTask: (taskId: string, updates: Partial<ProgressTask>) => void;
  replaceTaskId: (oldId: string, newId: string) => void;
  removeTask: (taskId: string) => void;

  // Runtime management
  setTaskRuntime: (taskId: string, runtime: TaskRuntimeData) => void;
  getTaskRuntime: (taskId: string) => TaskRuntimeData | undefined;
  cleanupTaskRuntime: (taskId: string) => void;
  cleanupAllRuntimes: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  taskRuntime: new Map(),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),

  replaceTaskId: (oldId, newId) =>
    set((state) => {
      const runtime = state.taskRuntime.get(oldId);
      const newRuntime = new Map(state.taskRuntime);
      if (runtime) {
        newRuntime.delete(oldId);
        newRuntime.set(newId, runtime);
      }

      return {
        tasks: state.tasks.map((t) =>
          t.id === oldId ? { ...t, id: newId } : t
        ),
        taskRuntime: newRuntime,
      };
    }),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),

  setTaskRuntime: (taskId, runtime) =>
    set((state) => {
      const newRuntime = new Map(state.taskRuntime);
      newRuntime.set(taskId, runtime);
      return { taskRuntime: newRuntime };
    }),

  getTaskRuntime: (taskId) => get().taskRuntime.get(taskId),

  cleanupTaskRuntime: (taskId) =>
    set((state) => {
      const runtime = state.taskRuntime.get(taskId);
      runtime?.upload?.abort();
      runtime?.sse?.close();

      const newRuntime = new Map(state.taskRuntime);
      newRuntime.delete(taskId);
      return { taskRuntime: newRuntime };
    }),

  cleanupAllRuntimes: () => {
    const { taskRuntime } = get();
    for (const [, runtime] of taskRuntime) {
      runtime.upload?.abort();
      runtime.sse?.close();
    }
    set({ taskRuntime: new Map() });
  },
}));

// Selector hooks
export const useTasks = () => useTaskStore((s) => s.tasks);
export const useTaskById = (taskId: string) =>
  useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
