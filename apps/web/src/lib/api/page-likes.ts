import { apiClient } from './client';

export type PageLikeSummaryDto = {
  liked: boolean;
  likeCount: number;
};

export const pageLikesApi = {
  async getSummary(input: { spaceId: string; pageId: string }) {
    const res = await apiClient.get<PageLikeSummaryDto>(
      `/spaces/${encodeURIComponent(input.spaceId)}/pages/${encodeURIComponent(input.pageId)}/like`,
    );
    return res.data;
  },

  async setLike(input: { spaceId: string; pageId: string; liked: boolean }) {
    const res = await apiClient.put<PageLikeSummaryDto>(
      `/spaces/${encodeURIComponent(input.spaceId)}/pages/${encodeURIComponent(input.pageId)}/like`,
      { liked: input.liked },
    );
    return res.data;
  },
};
