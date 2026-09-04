import type { Opportunity } from "./types";

/**
 * Shape of one record in api.sam.gov's `opportunitiesData` array (Get
 * Opportunities Public API v2). Only the fields we actually read — the real
 * response carries more (pointOfContact, resourceLinks, links, ...).
 */
export interface SamRawOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string | null;
  type: string;
  naicsCode: string | null;
  typeOfSetAsideDescription: string | null;
  active: "Yes" | "No";
  postedDate: string | null; // "YYYY-MM-DD"
  responseDeadLine: string | null; // ISO datetime, or null
  fullParentPathName: string | null; // "DEPT.SUBTIER.OFFICE"
  uiLink: string | null;
  award?: {
    amount?: string | null;
    awardee?: { name?: string | null } | null;
  } | null;
}

export interface SamSearchResponse {
  totalRecords: number;
  limit: number;
  offset: number;
  opportunitiesData: SamRawOpportunity[];
}

/** Award Notice / Justification are informational (already decided);
 * everything else (Solicitation, Sources Sought, Presolicitation, Special
 * Notice, ...) is still open to respond to. */
function statusFor(noticeType: string): Opportunity["status"] {
  return noticeType === "Award Notice" || noticeType === "Justification" ? "awarded" : "open";
}

function deptAndOffice(fullParentPathName: string | null): { dept: string | null; office: string | null } {
  if (!fullParentPathName) return { dept: null, office: null };
  const parts = fullParentPathName.split(".").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { dept: null, office: null };
  return { dept: parts[0], office: parts.length > 1 ? parts[parts.length - 1] : null };
}

/** Map one api.sam.gov record into this app's Opportunity shape. */
export function mapSamOpportunity(raw: SamRawOpportunity): Opportunity {
  const { dept, office } = deptAndOffice(raw.fullParentPathName);
  return {
    id: raw.noticeId,
    title: raw.title,
    naics: raw.naicsCode,
    noticeType: raw.type,
    solicitationNumber: raw.solicitationNumber,
    dept,
    office,
    publishDate: raw.postedDate ? `${raw.postedDate}T12:00:00Z` : new Date().toISOString(),
    responseDate: raw.responseDeadLine,
    setAside: raw.typeOfSetAsideDescription,
    status: statusFor(raw.type),
    link: raw.uiLink ?? `https://sam.gov/workspace/contract/opp/${raw.noticeId}/view`,
    awardee: raw.award?.awardee?.name ?? null,
  };
}

export interface FetchSamOptions {
  apiKey: string;
  naicsCodes: string[];
  /** MM/dd/yyyy — api.sam.gov requires both, max ~1 year apart. */
  postedFrom: string;
  postedTo: string;
  limit?: number;
}

/** One call per NAICS code (api.sam.gov's `ncode` param is single-value),
 * merged and de-duplicated by noticeId. */
export async function fetchSamOpportunities(opts: FetchSamOptions): Promise<Opportunity[]> {
  const { apiKey, naicsCodes, postedFrom, postedTo, limit = 100 } = opts;
  const seen = new Map<string, Opportunity>();

  for (const ncode of naicsCodes) {
    const params = new URLSearchParams({
      api_key: apiKey,
      postedFrom,
      postedTo,
      status: "Active",
      limit: String(limit),
      ncode,
    });
    const res = await fetch(`https://api.sam.gov/opportunities/v2/search?${params.toString()}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`api.sam.gov ${res.status} ${res.statusText}: ${body.slice(0, 500)}`);
    }
    const data = (await res.json()) as SamSearchResponse;
    for (const raw of data.opportunitiesData) {
      if (!seen.has(raw.noticeId)) seen.set(raw.noticeId, mapSamOpportunity(raw));
    }
  }

  return [...seen.values()];
}
