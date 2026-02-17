import axios, { AxiosError, AxiosHeaders } from 'axios';
import { useMeStore } from '@/stores';
import { getCurrentLocale } from '@/lib/i18n/locale';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipErrorToast?: boolean;
    skipErrorToastForStatuses?: number[];
  }
}

export class ApiError extends Error {
  readonly status?: number;
  readonly payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;
  return (
    base && base.trim().length > 0 ? base : 'http://localhost:3001'
  ).replace(/\/$/, '');
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getCurrentLocale());
  }
  config.headers = headers;
  return config;
});

let unauthorizedHandling = false;

export async function handleUnauthorized(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (unauthorizedHandling) return;
  unauthorizedHandling = true;

  try {
    await apiClient.post('/auth/logout').catch(() => null);
  } finally {
    useMeStore.setState({
      user: null,
      profile: null,
      tenant: null,
      memberships: [],
      loaded: false,
      loading: false,
    });

    if (window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }
}

function hasMessage(x: unknown): x is { message: unknown } {
  return typeof x === 'object' && x !== null && 'message' in x;
}

function notifyApiError(message: string, status?: number, code?: string): void {
  if (typeof window === 'undefined') return;
  if (status === 401) return;
  if (code === 'ERR_CANCELED') return;

  void import('sonner').then(({ toast }) => {
    toast.error(message);
  });
}

apiClient.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body && typeof body === 'object' && 'data' in body) {
      // Check if it is a ListResponse with meta
      const { data, meta, references } = body;
      if (Array.isArray(data) && meta) {
        res.data = { items: data, ...meta, references };
      } else {
        // Unwrap data
        res.data = data;
        // Attach references if present and data is an object
        if (
          references &&
          typeof res.data === 'object' &&
          res.data !== null &&
          !Array.isArray(res.data)
        ) {
          (res.data as Record<string, unknown>).references = references;
        }
      }
    }
    return res;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError: AxiosError = error;
      const status = axiosError.response?.status;
      const skipByStatus =
        typeof status === 'number' &&
        Array.isArray(axiosError.config?.skipErrorToastForStatuses) &&
        axiosError.config.skipErrorToastForStatuses.includes(status);
      const skipErrorToastFlag =
        axiosError.config &&
        typeof axiosError.config === 'object' &&
        'skipErrorToast' in axiosError.config
          ? Boolean(axiosError.config.skipErrorToast)
          : false;
      const skipErrorToast = skipErrorToastFlag || skipByStatus;

      if (status === 401) {
        void handleUnauthorized();
      }

      const payload = axiosError.response?.data;
      const message = hasMessage(payload)
        ? String(payload.message)
        : axiosError.message;
      if (!skipErrorToast) {
        notifyApiError(message, status, axiosError.code);
      }
      throw new ApiError(message, status, payload);
    }

    throw error;
  },
);
