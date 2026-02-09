import { apiClient } from '../client';
import type {
  PageVersionDto,
  PageVersionDetailDto,
  PublishedPageDto,
} from '../pages/types';

const inflightVersions = new Map<string, Promise<PageVersionDto[]>>();
const inflightVersionDetail = new Map<string, Promise<PageVersionDetailDto>>();

export const pageVersionsApi = {
  async listVersions(pageId: string) {
    const existing = inflightVersions.get(pageId);
    console.log(123, existing);
    if (existing) return existing;

    const req = apiClient
      .get<PageVersionDto[]>(`/pages/${encodeURIComponent(pageId)}/versions`)
      .then((res) => res.data)
      .finally(() => {
        inflightVersions.delete(pageId);
      });

    inflightVersions.set(pageId, req);
    return req;
  },

  async getVersion(pageId: string, versionId: string) {
    const inflightKey = `${pageId}:${versionId}`;
    const existing = inflightVersionDetail.get(inflightKey);
    if (existing) return existing;

    const req = apiClient
      .get<PageVersionDetailDto>(
        `/pages/${encodeURIComponent(pageId)}/versions/${encodeURIComponent(versionId)}`,
      )
      .then((res) => res.data)
      .finally(() => {
        inflightVersionDetail.delete(inflightKey);
      });

    inflightVersionDetail.set(inflightKey, req);
    return req;
  },
};

export type { PageVersionDto, PageVersionDetailDto, PublishedPageDto };
