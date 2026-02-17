import axios, { AxiosError, AxiosHeaders } from 'axios';
import { ApiError, getApiBaseUrl } from './client';
import { getCurrentLocale } from '@/lib/i18n/locale';

function hasMessage(x: unknown): x is { message: unknown } {
  return typeof x === 'object' && x !== null && 'message' in x;
}

export const publicApiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

publicApiClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getCurrentLocale());
  }
  config.headers = headers;
  return config;
});

publicApiClient.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body && typeof body === 'object' && 'data' in body) {
      const { data, meta, references } = body as {
        data: unknown;
        meta?: unknown;
        references?: unknown;
      };
      if (Array.isArray(data) && meta) {
        res.data = { items: data, ...((meta ?? {}) as Record<string, unknown>), references };
      } else {
        res.data = data;
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
      const payload = axiosError.response?.data;
      const message = hasMessage(payload)
        ? String(payload.message)
        : axiosError.message;
      throw new ApiError(message, status, payload);
    }

    throw error;
  },
);
