import type { ShareVisibility } from '@knowra/domain';

export type PublishSiteBuilderDto = {
  visibility?: ShareVisibility;
  password?: string | null;
  expiresAt?: string | Date | null;
  tokenEnabled?: boolean | null;
};

