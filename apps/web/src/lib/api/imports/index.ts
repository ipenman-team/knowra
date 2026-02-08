import { apiClient } from "../client";

export type CreateImportResult = { ok: true; taskId: string };

export const importsApi = {
  async createMarkdown(
    args: {
      file: File;
      spaceId: string;
      title?: string;
      parentId?: string;
    },
    options?: {
      signal?: AbortSignal;
      onUploadProgress?: (progress: number) => void;
    },
  ) {
    const form = new FormData();
    form.append("format", "markdown");
    form.append("spaceId", args.spaceId);
    if (args.title) form.append("title", args.title);
    if (args.parentId) form.append("parentId", args.parentId);
    form.append("file", args.file, args.file.name);

    const res = await apiClient.post<CreateImportResult>("/imports", form, {
      signal: options?.signal,
      onUploadProgress: (e) => {
        const total = e.total ?? 0;
        if (!total) return;
        const ratio = e.loaded / total;
        const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
        options?.onUploadProgress?.(pct);
      },
    });

    return res.data;
  },
  async createPdf(
    args: {
      file: File;
      spaceId: string;
      title?: string;
      parentId?: string;
    },
    options?: {
      signal?: AbortSignal;
      onUploadProgress?: (progress: number) => void;
    },
  ) {
    const form = new FormData();
    form.append("format", "pdf");
    form.append("spaceId", args.spaceId);
    if (args.title) form.append("title", args.title);
    if (args.parentId) form.append("parentId", args.parentId);
    form.append("file", args.file, args.file.name);

    const res = await apiClient.post<CreateImportResult>("/imports", form, {
      signal: options?.signal,
      onUploadProgress: (e) => {
        const total = e.total ?? 0;
        if (!total) return;
        const ratio = e.loaded / total;
        const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
        options?.onUploadProgress?.(pct);
      },
    });

    return res.data;
  },
  async createDocx(
    args: {
      file: File;
      spaceId: string;
      title?: string;
      parentId?: string;
    },
    options?: {
      signal?: AbortSignal;
      onUploadProgress?: (progress: number) => void;
    },
  ) {
    const form = new FormData();
    form.append("format", "docx");
    form.append("spaceId", args.spaceId);
    if (args.title) form.append("title", args.title);
    if (args.parentId) form.append("parentId", args.parentId);
    form.append("file", args.file, args.file.name);

    const res = await apiClient.post<CreateImportResult>("/imports", form, {
      signal: options?.signal,
      onUploadProgress: (e) => {
        const total = e.total ?? 0;
        if (!total) return;
        const ratio = e.loaded / total;
        const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
        options?.onUploadProgress?.(pct);
      },
    });

    return res.data;
  },
};
