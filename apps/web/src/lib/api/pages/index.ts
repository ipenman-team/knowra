import { apiClient } from '../client';
import type {
  CreatePageInput,
  PageDto,
  PageVersionDto,
  PageVersionDetailDto,
  PublishedPageDto,
  SavePageInput,
} from './types';

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

  async publish(id: string) {
    const res = await apiClient.post<{ ok: true; versionId: string }>(
      `/pages/${encodeURIComponent(id)}/publish`,
    );
    return res.data;
  },

  async listVersions(id: string) {
    const res = await apiClient.get<PageVersionDto[]>(
      `/pages/${encodeURIComponent(id)}/versions`,
    );
    return res.data;
  },

  async getVersion(pageId: string, versionId: string) {
    const res = await apiClient.get<PageVersionDetailDto>(
      `/pages/${encodeURIComponent(pageId)}/versions/${encodeURIComponent(versionId)}`,
    );
    return res.data;
  },

  async getLatestPublished(id: string) {
    const res = await apiClient.get<PublishedPageDto>(
      `/pages/${encodeURIComponent(id)}/published`,
    );
    return res.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<{ ok: true }>(`/pages/${encodeURIComponent(id)}`);
    return res.data;
  },
};

export type { CreatePageInput, PageDto, SavePageInput };
