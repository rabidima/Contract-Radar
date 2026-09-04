import { recommendBucket } from "./gonogo";
import type { NoticeType, Opportunity, SetAside } from "./types";

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
  classificationCode: string | null;
  typeOfSetAsideDescription: string | null;
  active: "Yes" | "No";
  postedDate: string | null; // "YYYY-MM-DD"
  responseDeadLine: string | null; // ISO datetime, or null
  fullParentPathName: string | null; // "DEPT.SUBTIER.OFFICE"
  uiLink: string | null;
  placeOfPerformance?: {
    city?: { name?: string };
    state?: { code?: string };
  } | null;
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

function mapNoticeType(raw: string): NoticeType {
  switch (raw) {
    case "Solicitation":
    case "Combined Synopsis/Solicitation":
      return "solicitation";
    case "Sources Sought":
      return "sources-sought";
    case "Presolicitation":
      return "presolicitation";
    case "Award Notice":
      return "award";
    case "Justification":
      return "justification";
    default:
      // Special Notice, Sale of Surplus Property, Intent to Bundle, and
      // anything SAM.gov adds later all land here rather than crashing the
      // sync on an unrecognized type.
      return "special";
  }
}

/** Match on the human-readable description — the codes vary and this is the
 * same text we already show in SET_ASIDE_LABEL. */
function mapSetAside(desc: string | null): SetAside {
  if (!desc) return "unrestricted";
  const d = desc.toLowerCase();
  if (d.includes("8(a)") || d.includes("8a")) return "8a";
  if (d.includes("hubzone")) return "hubzone";
  if (d.includes("service-disabled") || d.includes("sdvosb")) return "sdvosb";
  if (d.includes("economically disadvantaged women") || d.includes("edwosb")) return "edwosb";
  if (d.includes("women-owned") || d.includes("wosb")) return "wosb";
  if (d.includes("partial")) return "partial-sb";
  if (d.includes("total small business") || d.includes("small business set-aside")) return "total-sb";
  return "unrestricted";
}

function agencyAndOffice(fullParentPathName: string | null): { agency: string; office?: string } {
  if (!fullParentPathName) return { agency: "Unknown agency" };
  const parts = fullParentPathName.split(".").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { agency: "Unknown agency" };
  return { agency: parts[0], office: parts.length > 1 ? parts[parts.length - 1] : undefined };
}

function placeText(pop: SamRawOpportunity["placeOfPerformance"]): string | undefined {
  if (!pop) return undefined;
  // SAM.gov occasionally sends a numeric placeholder ("0") as the city name
  // instead of omitting it — treat that as missing rather than showing it.
  const rawCity = pop.city?.name;
  const city = rawCity && !/^\d+$/.test(rawCity) ? rawCity : undefined;
  const state = pop.state?.code;
  if (city && state) return `${city}, ${state}`;
  return city ?? state ?? undefined;
}

/** Map one api.sam.gov record into this app's Opportunity shape, ready to
 * hand to the store (or a server-side upsert) — bucket/stage/notes filled
 * in the same way `addOpportunity` and the demo seed do. */
export function mapSamOpportunity(raw: SamRawOpportunity): Opportunity {
  const noticeType = mapNoticeType(raw.type);
  const { agency, office } = agencyAndOffice(raw.fullParentPathName);
  const bucket = recommendBucket(noticeType);
  const postedAt = raw.postedDate ? `${raw.postedDate}T12:00:00Z` : new Date().toISOString();
  const dueAt =
    raw.responseDeadLine ?? new Date(Date.now() + 14 * 86_400_000).toISOString();

  return {
    id: raw.noticeId,
    title: raw.title,
    noticeId: raw.solicitationNumber ?? raw.noticeId,
    agency,
    office,
    naics: raw.naicsCode ?? "",
    psc: raw.classificationCode ?? undefined,
    noticeType,
    setAside: mapSetAside(raw.typeOfSetAsideDescription),
    postedAt,
    dueAt,
    estValue: raw.award?.amount ? Number(raw.award.amount) : undefined,
    place: placeText(raw.placeOfPerformance),
    incumbent: raw.award?.awardee?.name ?? undefined,
    bucket,
    stage: bucket === "score" ? "gonogo" : "triage",
    notes: "",
    sample: false,
  };
}

export interface FetchSamOptions {
  apiKey: string;
  naicsCodes: string[];
  keywords?: string[];
  /** MM/dd/yyyy — api.sam.gov requires both, max ~1 year apart. */
  postedFrom: string;
  postedTo: string;
  limit?: number;
}

/** One call per NAICS code + one per keyword (api.sam.gov's `ncode` and
 * `title` params are single-value), merged and de-duplicated by noticeId —
 * a notice can legitimately match more than one of our filters. */
export async function fetchSamOpportunities(opts: FetchSamOptions): Promise<Opportunity[]> {
  const { apiKey, naicsCodes, keywords = [], postedFrom, postedTo, limit = 100 } = opts;
  const seen = new Map<string, Opportunity>();

  async function runQuery(extra: Record<string, string>) {
    const params = new URLSearchParams({
      api_key: apiKey,
      postedFrom,
      postedTo,
      status: "Active",
      limit: String(limit),
      ...extra,
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

  for (const ncode of naicsCodes) {
    await runQuery({ ncode });
  }
  for (const title of keywords) {
    await runQuery({ title });
  }

  return [...seen.values()];
}
