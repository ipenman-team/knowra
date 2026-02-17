import axios, { AxiosError, AxiosHeaders } from 'axios';

import { ApiError, handleUnauthorized } from '../client';
import { getCurrentLocale } from '@/lib/i18n/locale';

export function getContextaAiBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_CONTEXTA_AI_BASE_URL ??
    process.env.CONTEXTA_AI_BASE_URL;
  return (
    base && base.trim().length > 0 ? base : 'http://localhost:3002'
  ).replace(/\/$/, '');
}

export const contextaAiClient = axios.create({
  baseURL: getContextaAiBaseUrl(),
  withCredentials: true,
});

contextaAiClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getCurrentLocale());
  }
  config.headers = headers;
  return config;
});

function hasMessage(x: unknown): x is { message: unknown } {
  return typeof x === 'object' && x !== null && 'message' in x;
}

contextaAiClient.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError: AxiosError = error;
      const status = axiosError.response?.status;

      if (status === 401) {
        void handleUnauthorized();
      }

      const payload = axiosError.response?.data;
      const message = hasMessage(payload)
        ? String(payload.message)
        : axiosError.message;
      throw new ApiError(message, status, payload);
    }

    throw error;
  },
);
