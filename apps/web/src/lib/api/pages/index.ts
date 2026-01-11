import { apiClient } from '../client';
import type { CreatePageInput, PageDto, SavePageInput } from './types';

export const pagesApi = {
  async list() {
    const res = await apiClient.get<PageDto[]>('/pages');
    return res.data;
  },

  async get(id: string) {
    const res = await apiClient.get<PageDto>(`/pages/${encodeURIComponent(id)}`);
    return res.data;
  },

  async create(input: CreatePageInput) {
    const res = await apiClient.post<PageDto>('/pages', input);
    return res.data;
  },

  async save(id: string, input: SavePageInput) {
    const res = await apiClient.put<PageDto>(`/pages/${encodeURIComponent(id)}`, input);
    return res.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<{ ok: true }>(`/pages/${encodeURIComponent(id)}`);
    return res.data;
  },
};

export type { CreatePageInput, PageDto, SavePageInput };
