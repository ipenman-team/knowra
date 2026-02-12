export type SpaceShareSnapshotPage = {
  id: string;
  title: string;
  parentIds: string[];
  content?: unknown;
  updatedAt?: string;
};

export type SpaceShareSnapshotPayload = {
  space: {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
  };
  pages: SpaceShareSnapshotPage[];
  defaultPageId?: string | null;
};
