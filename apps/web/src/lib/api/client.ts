import axios, { AxiosError } from 'axios';
import { useMeStore } from '@/stores';

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

apiClient.interceptors.response.use(
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
