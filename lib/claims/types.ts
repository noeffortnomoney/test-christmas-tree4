export type ClaimRecord = {
  id: string;
  giftId: number;
  giftName: string;
  device: string;
  userAgent: string;
  claimedAt: string;
  telegramSent: boolean;
};

export type ClaimFilter = {
  from?: string;
  to?: string;
  giftId?: number;
  device?: string;
};

export type ClaimStats = {
  total: number;
  byGift: Record<string, number>;
  byDevice: Record<string, number>;
};

export type ClaimsResponse = {
  rows: ClaimRecord[];
  total: number;
  page: number;
  pageSize: number;
  stats: ClaimStats;
  devices: string[];
};

export interface ClaimRepo {
  insert(record: ClaimRecord): Promise<boolean>;
  markTelegramSent(id: string): Promise<void>;
  list(filter: ClaimFilter, page: number, pageSize: number): Promise<{ rows: ClaimRecord[]; total: number }>;
  listAll(filter: ClaimFilter, limit: number): Promise<ClaimRecord[]>;
  stats(filter: ClaimFilter): Promise<ClaimStats>;
  devices(): Promise<string[]>;
}
