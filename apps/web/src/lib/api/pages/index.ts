import { apiClient } from '../client';
import type {
  CreatePageInput,
  PageDto,
  PageVersionDto,
  PageVersionDetailDto,
  PublishedPageDto,
  SavePageInput,
} from './types';
import _ from 'lodash';

const inflightPublished = new Map<string, Promise<PublishedPageDto>>();
const inflightVersions = new Map<string, Promise<PageVersionDto[]>>();
const inflightVersionDetail = new Map<string, Promise<PageVersionDetailDto>>();

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

  async get(id: string) {
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

  async save(id: string, input: SavePageInput) {
    const res = await apiClient.put<PageDto>(
      `/pages/${encodeURIComponent(id)}`,
      input,
    );
    return res.data;
  },

  async publish(id: string) {
    const res = await apiClient.post<{ ok: true; versionId: string }>(
      `/pages/${encodeURIComponent(id)}/publish`,
    );
    return res.data;
  },

  async listVersions(id: string) {
    const existing = inflightVersions.get(id);
    if (existing) return existing;

    const req = apiClient
      .get<PageVersionDto[]>(`/pages/${encodeURIComponent(id)}/versions`)
      .then((res) => res.data)
      .finally(() => {
        inflightVersions.delete(id);
      });

    inflightVersions.set(id, req);
    return req;
  },

  async getVersion(pageId: string, versionId: string) {
    const key = `${pageId}:${versionId}`;
    const existing = inflightVersionDetail.get(key);
    if (existing) return existing;

    const req = apiClient
      .get<PageVersionDetailDto>(
        `/pages/${encodeURIComponent(pageId)}/versions/${encodeURIComponent(versionId)}`,
      )
      .then((res) => res.data)
      .finally(() => {
        inflightVersionDetail.delete(key);
      });

    inflightVersionDetail.set(key, req);
    return req;
  },

  async getLatestPublished(id: string) {
    const existing = inflightPublished.get(id);
    if (existing) return existing;

    const req = apiClient
      .get<PublishedPageDto>(`/pages/${encodeURIComponent(id)}/published`)
      .then((res) => res.data)
      .finally(() => {
        inflightPublished.delete(id);
      });

    inflightPublished.set(id, req);
    return req;
  },

  async remove(id: string) {
    const res = await apiClient.delete<{ ok: true }>(
      `/pages/${encodeURIComponent(id)}`,
    );
    return res.data;
  },
};

export type { CreatePageInput, PageDto, SavePageInput };
