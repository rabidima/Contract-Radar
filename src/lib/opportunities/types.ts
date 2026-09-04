export type OpportunityStatus = "open" | "awarded";

export interface Opportunity {
  id: string;
  title: string;
  naics: string | null;
  noticeType: string;
  solicitationNumber: string | null;
  dept: string | null;
  office: string | null;
  publishDate: string;
  responseDate: string | null;
  setAside: string | null;
  status: OpportunityStatus;
  link: string;
  awardee: string | null;
  matchedKeyword: string | null;
}

export type WatchlistType = "naics" | "keyword";

export interface WatchlistItem {
  id: string;
  type: WatchlistType;
  value: string;
  label: string | null;
}

export interface SyncMeta {
  lastSyncedAt: string | null;
  source: string | null;
  openCount: number | null;
  awardedCount: number | null;
  runRequested: boolean;
  runRequestedAt: string | null;
}
