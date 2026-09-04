export const NOTICE_TYPES = [
  "sources-sought",
  "rfi",
  "presolicitation",
  "solicitation",
  "award",
  "justification",
  "special",
] as const;
export type NoticeType = (typeof NOTICE_TYPES)[number];

export const SET_ASIDES = [
  "unrestricted",
  "total-sb",
  "8a",
  "hubzone",
  "sdvosb",
  "wosb",
  "edwosb",
  "partial-sb",
] as const;
export type SetAside = (typeof SET_ASIDES)[number];

export const BUCKETS = [
  "inbox",
  "respond",
  "shape",
  "score",
  "intel",
  "pass",
] as const;
export type Bucket = (typeof BUCKETS)[number];

export const STAGES = [
  "triage",
  "gonogo",
  "capture",
  "proposal",
  "submitted",
  "awarded",
  "lost",
  "no-bid",
] as const;
export type Stage = (typeof STAGES)[number];

export const CERTS = [
  "small-business",
  "8a",
  "hubzone",
  "sdvosb",
  "wosb",
  "edwosb",
  "vosb",
] as const;
export type Cert = (typeof CERTS)[number];

export const VEHICLES = [
  "GSA MAS",
  "OASIS+",
  "SEWP",
  "CIO-SP4",
  "8(a) STARS III",
  "Alliant 3",
  "HCaTS",
  "VETS 2",
  "POLARIS",
  "ASTRO",
  "Agency BPA",
  "Agency IDIQ",
] as const;

export const GO_CRITERIA = [
  {
    id: "fit",
    label: "Capability & NAICS fit",
    weight: 0.2,
    hint: "Can you perform the PWS with current staff, tools, and past work?",
  },
  {
    id: "eligibility",
    label: "Set-aside & size eligibility",
    weight: 0.12,
    hint: "Are you eligible as-is, or can you team to eligibility in 72 hours?",
  },
  {
    id: "customer",
    label: "Customer intimacy",
    weight: 0.12,
    hint: "Have you talked to the KO, COR, or program before this notice?",
  },
  {
    id: "pastperf",
    label: "Past performance relevance",
    weight: 0.14,
    hint: "Do you have recent, same-scope, same-complexity work to cite?",
  },
  {
    id: "position",
    label: "Competitive position",
    weight: 0.12,
    hint: "Incumbent strength, likely bidders, and your discriminator.",
  },
  {
    id: "economics",
    label: "Bid cost vs. expected value",
    weight: 0.12,
    hint: "Is expected value at least 3× fully loaded proposal cost?",
  },
  {
    id: "capacity",
    label: "Capacity & key people",
    weight: 0.1,
    hint: "Can the named PM / key personnel actually do this work?",
  },
  {
    id: "clock",
    label: "Clock realism",
    weight: 0.08,
    hint: "Enough calendar to capture, write, pink/red team, and submit clean?",
  },
] as const;

export type CriterionId = (typeof GO_CRITERIA)[number]["id"];

export type GoDecision = "pending" | "go" | "conditional" | "no-go" | "team-only";

export interface GoNoGo {
  scores: Record<CriterionId, number>;
  decision: GoDecision;
  rationale: string;
  decidedAt?: string;
}

export interface CapturePlan {
  winThemes: string[];
  discriminators: string[];
  customerMap: string;
  competitorNotes: string;
  teaming: string;
  gaps: string;
  questions: string;
  checks: Record<string, boolean>;
}

export interface ProposalProgress {
  checks: Record<string, boolean>;
  pinkTeam: boolean;
  redTeam: boolean;
  goldTeam: boolean;
  submitted: boolean;
  submittedAt?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  noticeId: string;
  agency: string;
  office?: string;
  naics: string;
  psc?: string;
  noticeType: NoticeType;
  setAside: SetAside;
  postedAt: string;
  dueAt: string;
  estValue?: number;
  place?: string;
  incumbent?: string;
  bucket: Bucket;
  stage: Stage;
  notes: string;
  sample?: boolean;
  go?: GoNoGo;
  capture?: CapturePlan;
  proposal?: ProposalProgress;
}

export interface Company {
  name: string;
  uei: string;
  cage: string;
  naics: string[];
  certs: Cert[];
  vehicles: string[];
  footprint: string;
  typicalBidCost: number;
  targetPwin: number;
  minContract: number;
  maxConcurrentBids: number;
  setupComplete: boolean;
}

export interface PlaybookChecks {
  [key: string]: boolean;
}

export type Block =
  | { type: "p"; text: string }
  | { type: "steps"; items: string[] }
  | { type: "rule"; title: string; text: string }
  | { type: "watch"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "checks"; id: string; items: { id: string; text: string }[] }
  | { type: "quote"; text: string };

export interface Chapter {
  slug: string;
  number: string;
  title: string;
  dek: string;
  minutes: number;
  stageLabel: string;
  blocks: Block[];
}

export const NOTICE_LABEL: Record<NoticeType, string> = {
  "sources-sought": "Sources Sought",
  rfi: "RFI",
  presolicitation: "Pre-Solicitation",
  solicitation: "Solicitation",
  award: "Award Notice",
  justification: "Justification",
  special: "Special Notice",
};

export const SET_ASIDE_LABEL: Record<SetAside, string> = {
  unrestricted: "Unrestricted",
  "total-sb": "Total Small Business",
  "8a": "8(a)",
  hubzone: "HUBZone",
  sdvosb: "SDVOSB",
  wosb: "WOSB",
  edwosb: "EDWOSB",
  "partial-sb": "Partial SB",
};

export const BUCKET_LABEL: Record<Bucket, string> = {
  inbox: "Inbox",
  respond: "Respond",
  shape: "Shape",
  score: "Score",
  intel: "Intel",
  pass: "Pass",
};

export const STAGE_LABEL: Record<Stage, string> = {
  triage: "Triage",
  gonogo: "Go / No-Go",
  capture: "Capture",
  proposal: "Proposal",
  submitted: "Submitted",
  awarded: "Awarded",
  lost: "Lost",
  "no-bid": "No-Bid",
};

export const CERT_LABEL: Record<Cert, string> = {
  "small-business": "Small Business",
  "8a": "8(a)",
  hubzone: "HUBZone",
  sdvosb: "SDVOSB",
  wosb: "WOSB",
  edwosb: "EDWOSB",
  vosb: "VOSB",
};

export const CAPTURE_CHECKS = [
  { id: "pws", text: "PWS / SOW decomposed into tasks, labor, and risks" },
  { id: "customer", text: "Customer map: KO, specialist, COR, program, end user" },
  { id: "incumbent", text: "Incumbent and last award pulled from USAspending / FPDS" },
  { id: "themes", text: "Three win themes written as evaluator-facing claims" },
  { id: "gaps", text: "Gap list with a teaming or hire path for each gap" },
  { id: "ptw", text: "Price-to-win range from historical awards, not hope" },
  { id: "qa", text: "Questions for the Q&A period drafted before the deadline" },
  { id: "call", text: "Call plan executed or documented why contact is barred" },
];

export const PROPOSAL_CHECKS = [
  { id: "l", text: "Section L (instructions) parsed into a compliance matrix" },
  { id: "m", text: "Section M (evaluation) mapped to every volume and theme" },
  { id: "shall", text: "Every shall / must / will in the PWS has an owner" },
  { id: "storyboard", text: "Storyboards complete before drafting prose" },
  { id: "pp", text: "Past performance citations are recent, relevant, and annotated" },
  { id: "staff", text: "Resumes / key personnel match the stated qualifications" },
  { id: "price", text: "Price volume reconcilable to the technical approach" },
  { id: "admin", text: "SAM, reps & certs, OCI, amendments, page/font limits" },
  { id: "pink", text: "Pink team held (strategy, not copy-edit)" },
  { id: "red", text: "Red team scored against Section M as evaluators" },
  { id: "gold", text: "Gold team / orals dry-run if required" },
  { id: "submit", text: "Submission path tested (portal, email, PIEE) 48h early" },
];
