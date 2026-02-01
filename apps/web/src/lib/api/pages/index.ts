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

function makeKey(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(':');
}

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
    const res = await apiClient.get<PageDto>(`/pages/${encodeURIComponent(id)}`);
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

  async save(...args: [string, SavePageInput] | [string, string, SavePageInput]) {
    if (args.length === 3) {
      const spaceId = args[0];
      const id = args[1];
      const input = args[2];
      const res = await apiClient.put<PageDto>(
        `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(id)}`,
        input,
      );
      return res.data;
    }

    const id = args[0];
    const input = args[1];
    const res = await apiClient.put<PageDto>(`/pages/${encodeURIComponent(id)}`, input);
    return res.data;
  },

  async publish(...args: [string] | [string, string]) {
    if (args.length === 2) {
      const spaceId = args[0];
      const id = args[1];
      const res = await apiClient.post<{ ok: true; versionId: string }>(
        `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(id)}/publish`,
      );
      return res.data;
    }

    const id = args[0];
    const res = await apiClient.post<{ ok: true; versionId: string }>(
      `/pages/${encodeURIComponent(id)}/publish`,
    );
    return res.data;
  },

  async listVersions(...args: [string] | [string, string]) {
    const spaceId = args.length === 2 ? args[0] : undefined;
    const id = args.length === 2 ? args[1] : args[0];

    const key = makeKey([spaceId, id]);
    const existing = inflightVersions.get(key);
    if (existing) return existing;

    const url = spaceId
      ? `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(id)}/versions`
      : `/pages/${encodeURIComponent(id)}/versions`;

    const req = apiClient
      .get<PageVersionDto[]>(url)
      .then((res) => res.data)
      .finally(() => {
        inflightVersions.delete(key);
      });

    inflightVersions.set(key, req);
    return req;
  },

  async getVersion(...args: [string, string] | [string, string, string]) {
    const spaceId = args.length === 3 ? args[0] : undefined;
    const pageId = args.length === 3 ? args[1] : args[0];
    const versionId = args.length === 3 ? args[2] : args[1];

    const key = makeKey([spaceId, pageId, versionId]);
    const existing = inflightVersionDetail.get(key);
    if (existing) return existing;

    const url = spaceId
      ? `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(pageId)}/versions/${encodeURIComponent(versionId)}`
      : `/pages/${encodeURIComponent(pageId)}/versions/${encodeURIComponent(versionId)}`;

    const req = apiClient
      .get<PageVersionDetailDto>(url)
      .then((res) => res.data)
      .finally(() => {
        inflightVersionDetail.delete(key);
      });

    inflightVersionDetail.set(key, req);
    return req;
  },

  async getLatestPublished(...args: [string] | [string, string]) {
    const spaceId = args.length === 2 ? args[0] : undefined;
    const id = args.length === 2 ? args[1] : args[0];

    const key = makeKey([spaceId, id]);
    const existing = inflightPublished.get(key);
    if (existing) return existing;

    const url = spaceId
      ? `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(id)}/published`
      : `/pages/${encodeURIComponent(id)}/published`;

    const req = apiClient
      .get<PublishedPageDto>(url)
      .then((res) => res.data)
      .finally(() => {
        inflightPublished.delete(key);
      });

    inflightPublished.set(key, req);
    return req;
  },

  async remove(...args: [string] | [string, string]) {
    if (args.length === 2) {
      const spaceId = args[0];
      const id = args[1];
      const res = await apiClient.delete<{ ok: true }>(
        `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(id)}`,
      );
      return res.data;
    }

    const id = args[0];
    const res = await apiClient.delete<{ ok: true }>(`/pages/${encodeURIComponent(id)}`);
    return res.data;
  },
};

export type { CreatePageInput, PageDto, SavePageInput };
