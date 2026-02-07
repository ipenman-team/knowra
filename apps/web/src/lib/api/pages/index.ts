import { apiClient } from '../client';
import type { CreatePageInput, PageDto, SavePageInput } from './types';
import _ from 'lodash';

export const pagesApi = {
  async list(
    spaceId: string,
    params?: { skip?: number; take?: number; q?: string },
  ) {
    const res = await apiClient.get<PageDto[]>(
      `/spaces/${encodeURIComponent(spaceId)}/pages`,
      { params },
    );
    return res.data;
  },

  async listForTree(
    spaceId: string,
    params?: {
      cursor?: string | null;
      take?: number;
      query?: string;
      parentId?: string | null;
      onlyRoots?: boolean;
    },
  ) {
    const res = await apiClient.get<{
      items: PageDto[];
      nextCursor?: string | null;
      hasMore?: boolean;
    }>(`/spaces/${encodeURIComponent(spaceId)}/pages/tree`, { params });
    return res.data;
  },

  async get(...args: [string] | [string, string]) {
    if (args.length === 2) {
      const spaceId = args[0];
      const id = args[1];
      const res = await apiClient.get<PageDto>(
        `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(id)}`,
      );
      return res.data;
    }

    const id = args[0];
    const res = await apiClient.get<PageDto>(
      `/pages/${encodeURIComponent(id)}`,
    );
    return res.data;
  },

  async create(input: CreatePageInput) {
    const res = await apiClient.post<PageDto>(
      `/spaces/${input.spaceId}/pages`,
      _.omit(input, 'spaceId'),
    );
    return res.data;
  },

  async createWithOptions(
    input: CreatePageInput,
    options?: { signal?: AbortSignal },
  ) {
    const res = await apiClient.post<PageDto>('/pages', input, {
      signal: options?.signal,
    });
    return res.data;
  },

  async rename(id: string, input: { spaceId: string; title: string }) {
    const res = await apiClient.post<PageDto>(
      `/spaces/${input.spaceId}/pages/${encodeURIComponent(id)}/rename`,
      input,
    );
    return res.data;
  },

  async save(spaceId: string, pageId: string, input: SavePageInput) {
    const res = await apiClient.put<PageDto>(
      `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(pageId)}`,
      input,
    );
    return res.data;
  },

  async publish(spaceId: string, pageId: string) {
    const res = await apiClient.post<{ ok: true; versionId: string }>(
      `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(pageId)}/publish`,
    );
    return res.data;
  },

  async remove(spaceId: string, pageId: string) {
    const res = await apiClient.delete<{ ok: true }>(
      `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(pageId)}`,
    );
    return res.data;
  },

  async listTrash(
    spaceId: string,
    params?: { skip?: number; take?: number; q?: string },
  ) {
    const res = await apiClient.get<PageDto[]>(
      `/spaces/${encodeURIComponent(spaceId)}/pages/trash`,
      { params },
    );
    return res.data;
  },

  async restore(spaceId: string, pageId: string) {
    const res = await apiClient.post<{ ok: true }>(
      `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(pageId)}/restore`,
    );
    return res.data;
  },

  async permanentRemove(spaceId: string, pageId: string) {
    const res = await apiClient.delete<{ ok: true }>(
      `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(pageId)}/permanent`,
    );
    return res.data;
  },
};

export type { CreatePageInput, PageDto, SavePageInput };
