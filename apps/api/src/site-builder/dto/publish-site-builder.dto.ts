import type { ShareVisibility } from '@contexta/domain';

export type PublishSiteBuilderDto = {
  visibility?: ShareVisibility;
  password?: string | null;
  expiresAt?: string | Date | null;
  tokenEnabled?: boolean | null;
};

