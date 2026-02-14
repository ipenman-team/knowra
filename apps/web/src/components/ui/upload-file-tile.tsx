'use client';

import { useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { Eye, ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type UploadFileTileState = 'empty' | 'uploading' | 'success' | 'error';

export type UploadTileData =
  | Record<string, unknown>
  | ((file: File) => Record<string, unknown> | Promise<Record<string, unknown>>);

export type UploadTileProgressEvent = {
  percent: number;
  loaded: number;
  total: number;
};

export type UploadFileTileProps = {
  value?: string | null;
  fileName?: string | null;
  alt?: string;
  accept?: string;
  className?: string;
  imageClassName?: string;
  disabled?: boolean;
  maxSizeBytes?: number;
  shape?: 'square' | 'circle';
  emptyLabel?: string;
  uploadingLabel?: string;
  errorLabel?: string;
  action?: string;
  data?: UploadTileData;
  filename?: string;
  file?: File | null;
  withCredentials?: boolean;
  headers?: Record<string, string>;
  method?: string;
  onProgress?: (event: UploadTileProgressEvent, file: File) => void;
  onError?: (event: unknown, body?: Record<string, unknown>) => void;
  onSuccess?: (
    body: Record<string, unknown>,
    fileOrXhr?: File | XMLHttpRequest,
  ) => void;
  onResolveUrl?: (body: Record<string, unknown>) => string | null | undefined;
  onUpload?: (file: File) => Promise<string | null>;
  onChange: (url: string | null) => void;
  onPreview?: (url: string) => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return '上传失败，请重试';
}

function appendFormDataField(
  formData: FormData,
  key: string,
  value: unknown,
): void {
  if (value == null) return;
  if (value instanceof Blob) {
    formData.append(key, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => appendFormDataField(formData, key, item));
    return;
  }
  if (typeof value === 'object') {
    formData.append(key, JSON.stringify(value));
    return;
  }
  formData.append(key, String(value));
}

function defaultResolveUrl(body: Record<string, unknown>): string | null {
  const directUrl = typeof body.url === 'string' ? body.url.trim() : '';
  if (directUrl) return directUrl;

  const data = body.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const nestedUrl =
      typeof (data as Record<string, unknown>).url === 'string'
        ? (data as Record<string, string>).url.trim()
        : '';
    if (nestedUrl) return nestedUrl;
  }
  return null;
}

async function resolveExtraData(
  data: UploadTileData | undefined,
  file: File,
): Promise<Record<string, unknown>> {
  if (!data) return {};
  const result = typeof data === 'function' ? await data(file) : data;
  return result ?? {};
}

export function UploadFileTile({
  value,
  fileName,
  alt = 'uploaded file',
  accept = 'image/*',
  className,
  imageClassName,
  disabled,
  maxSizeBytes,
  shape = 'square',
  emptyLabel = 'Upload',
  uploadingLabel = '文件上传中',
  errorLabel = '上传失败',
  action,
  data,
  filename = 'file',
  withCredentials = false,
  headers,
  method = 'POST',
  onProgress,
  onError,
  onSuccess,
  onResolveUrl,
  onUpload,
  onChange,
  onPreview,
}: UploadFileTileProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);
  const [lastFileName, setLastFileName] = useState<string>('');
  const normalizedValue = value?.trim() ? value.trim() : null;
  const previewFailed = Boolean(normalizedValue && failedPreviewUrl === normalizedValue);
  const errorMessage = previewFailed ? '图片展示失败' : uploadError;
  const state: UploadFileTileState = uploading
    ? 'uploading'
    : previewFailed || (!normalizedValue && Boolean(uploadError))
      ? 'error'
      : normalizedValue
        ? 'success'
        : 'empty';

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  const openPicker = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleRemove = () => {
    if (disabled || uploading) return;
    setUploadError(null);
    setFailedPreviewUrl(null);
    onChange(null);
  };

  const handlePreview = () => {
    if (!normalizedValue) return;
    if (onPreview) {
      onPreview(normalizedValue);
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(normalizedValue, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={cn(
        'group/upload-tile relative isolate flex shrink-0 select-none items-center justify-center overflow-hidden border bg-background transition-colors',
        shapeClass,
        state === 'empty' &&
          'cursor-pointer border-dashed border-muted-foreground/40 hover:border-primary/60',
        state === 'uploading' && 'border-dashed',
        state === 'success' && 'border-border',
        state === 'error' &&
          'cursor-pointer border-destructive/80 text-destructive',
        className,
      )}
      onClick={() => {
        if (state === 'empty' || state === 'error') {
          openPicker();
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (state === 'empty' || state === 'error') {
          openPicker();
        }
      }}
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;

          setLastFileName(file.name);
          setUploadError(null);
          setFailedPreviewUrl(null);

          if (maxSizeBytes && file.size > maxSizeBytes) {
            setUploadError(`文件不能超过 ${formatFileSize(maxSizeBytes)}`);
            return;
          }
          if (accept.includes('image/') && !file.type.startsWith('image/')) {
            setUploadError('请选择图片文件');
            return;
          }

          setUploading(true);
          setUploadPercent(0);
          let errorReported = false;

          const uploadByAction = async (): Promise<string | null> => {
            if (!action?.trim()) {
              throw new Error('缺少上传地址');
            }
            const extraData = await resolveExtraData(data, file);
            const formData = new FormData();
            formData.append(filename, file, file.name);
            Object.entries(extraData).forEach(([key, value]) => {
              appendFormDataField(formData, key, value);
            });

            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;
            return await new Promise<string | null>((resolve, reject) => {
              xhr.open(method.toUpperCase(), action, true);
              xhr.withCredentials = withCredentials;
              Object.entries(headers ?? {}).forEach(([key, val]) => {
                xhr.setRequestHeader(key, val);
              });

              xhr.upload.onprogress = (progressEvent) => {
                if (!progressEvent.lengthComputable) return;
                const percent = Math.min(
                  100,
                  Math.max(
                    0,
                    (progressEvent.loaded / progressEvent.total) * 100,
                  ),
                );
                setUploadPercent(percent);
                onProgress?.(
                  {
                    percent,
                    loaded: progressEvent.loaded,
                    total: progressEvent.total,
                  },
                  file,
                );
              };

              xhr.onerror = (event) => {
                errorReported = true;
                onError?.(event);
                reject(new Error('网络错误，上传失败'));
              };

              xhr.onabort = () => {
                reject(new Error('上传已取消'));
              };

              xhr.onload = () => {
                const statusOk = xhr.status >= 200 && xhr.status < 300;
                let body: Record<string, unknown> = {};
                try {
                  const parsed = JSON.parse(xhr.responseText || '{}');
                  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    body = parsed as Record<string, unknown>;
                  }
                } catch {
                  body = {};
                }

                if (!statusOk) {
                  errorReported = true;
                  onError?.(new Error(`上传失败: ${xhr.status}`), body);
                  reject(new Error(`上传失败: ${xhr.status}`));
                  return;
                }

                onSuccess?.(body, xhr);
                const resolvedUrl =
                  onResolveUrl?.(body) ?? defaultResolveUrl(body);
                resolve(resolvedUrl ?? null);
              };

              xhr.send(formData);
            });
          };

          const uploadByCustom = async (): Promise<string | null> => {
            if (!onUpload) {
              throw new Error('未提供 onUpload 或 action');
            }
            const uploadedUrl = await onUpload(file);
            if (uploadedUrl?.trim()) {
              onSuccess?.({ url: uploadedUrl.trim() }, file);
            }
            return uploadedUrl;
          };

          const shouldUseAction = Boolean(action?.trim());
          void (shouldUseAction ? uploadByAction : uploadByCustom)()
            .then((uploadedUrl) => {
              if (!uploadedUrl?.trim()) {
                throw new Error('上传成功但未返回文件地址');
              }
              onChange(uploadedUrl.trim());
              setUploadError(null);
              setFailedPreviewUrl(null);
              setUploadPercent(100);
            })
            .catch((error) => {
              setUploadError(normalizeErrorMessage(error));
              if (!errorReported) {
                onError?.(error);
              }
            })
            .finally(() => {
              xhrRef.current = null;
              setUploading(false);
            });
        }}
      />

      {state === 'success' && normalizedValue ? (
        <>
          <Image
            src={normalizedValue}
            alt={alt}
            fill
            unoptimized
            className={cn('h-full w-full object-cover', imageClassName)}
            onError={() => {
              setFailedPreviewUrl(normalizedValue);
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover/upload-tile:bg-black/45" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover/upload-tile:opacity-100">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full"
              onClick={(event) => {
                event.stopPropagation();
                handlePreview();
              }}
            >
              <Eye />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full"
              onClick={(event) => {
                event.stopPropagation();
                handleRemove();
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </>
      ) : null}

      {state === 'uploading' ? (
        <div className="flex w-full max-w-[80%] flex-col items-center gap-3 px-3 text-center text-sm">
          <div className="inline-flex items-center gap-2 text-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{uploadingLabel}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={
                {
                  width: `${Math.max(8, Math.round(uploadPercent || 8))}%`,
                } as CSSProperties
              }
            />
          </div>
        </div>
      ) : null}

      {state === 'error' ? (
        <div className="flex w-full flex-col items-center justify-center gap-2 px-4 text-center">
          <ImageIcon className="h-8 w-8" />
          <p className="max-w-full truncate text-base font-medium">{errorLabel}</p>
          <p className="max-w-full truncate text-xs text-destructive/80">
            {errorMessage ?? fileName ?? lastFileName}
          </p>
        </div>
      ) : null}

      {state === 'empty' ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground text-xs">
          <Plus className="h-6 w-6" />
          <span className="font-medium leading-none">{emptyLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
