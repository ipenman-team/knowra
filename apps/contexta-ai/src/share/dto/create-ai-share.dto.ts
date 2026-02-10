import { ShareVisibility } from '@contexta/domain';

export type CreateAiShareDto = {
  targetId: string;
  visibility: ShareVisibility;
  expiresAt?: string | Date | null;
  password?: string | null;
  tokenEnabled?: boolean | null;
  extraData?: unknown | null;
};
