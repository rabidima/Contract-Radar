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
}

export interface WatchlistItem {
  id: string;
  value: string;
  label: string | null;
  /** Default NAICS codes can't be removed from the watchlist. */
  locked: boolean;
}

export interface SyncMeta {
  lastSyncedAt: string | null;
  source: string | null;
  openCount: number | null;
  awardedCount: number | null;
  runRequested: boolean;
  runRequestedAt: string | null;
}
