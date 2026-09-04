import { create } from "zustand";
import { toast } from "sonner";
import { seedOpportunities } from "./demo";
import { emptyScores, recommendBucket, withRolledDecision } from "./gonogo";
import {
  addWatchlistItem as addWatchlistItemFn,
  claimFirstSeed,
  deleteOpportunity as deleteOpportunityFn,
  deleteSampleOpportunities,
  fetchCompany,
  fetchOpportunities,
  fetchWatchlist,
  patchOpportunity,
  removeWatchlistItem as removeWatchlistItemFn,
  requestSync as requestSyncFn,
  saveCompany as saveCompanyFn,
  savePlaybookChecks,
  upsertOpportunities,
} from "./server-store";
import type {
  Bucket,
  CapturePlan,
  Company,
  GoNoGo,
  Opportunity,
  PlaybookChecks,
  ProposalProgress,
  Stage,
} from "./types";
import { uid } from "../utils";

const defaultCompany = (): Company => ({
  name: "",
  uei: "",
  cage: "",
  naics: ["541512", "541511", "541611"],
  certs: ["small-business"],
  vehicles: ["GSA MAS"],
  footprint: "CONUS, remote-capable",
  typicalBidCost: 18000,
  targetPwin: 0.3,
  minContract: 250000,
  maxConcurrentBids: 4,
  setupComplete: false,
});

const defaultCapture = (): CapturePlan => ({
  winThemes: ["", "", ""],
  discriminators: ["", ""],
  customerMap: "",
  competitorNotes: "",
  teaming: "",
  gaps: "",
  questions: "",
  checks: {},
});

const defaultProposal = (): ProposalProgress => ({
  checks: {},
  pinkTeam: false,
  redTeam: false,
  goldTeam: false,
  submitted: false,
});

const defaultGo = (): GoNoGo => ({
  scores: emptyScores(),
  decision: "pending",
  rationale: "",
});

export interface WatchlistItem {
  id: string;
  type: "naics" | "keyword";
  value: string;
  label: string | null;
}

interface State {
  company: Company;
  opportunities: Opportunity[];
  checks: PlaybookChecks;
  keywords: WatchlistItem[];
  ready: boolean;
  hydrateFromServer: () => Promise<void>;
  setCompany: (patch: Partial<Company>) => void;
  toggleCert: (id: Company["certs"][number]) => void;
  toggleVehicle: (name: string) => void;
  toggleNaics: (code: string) => void;
  addKeyword: (value: string) => void;
  removeKeyword: (id: string) => void;
  requestSync: () => void;
  addOpportunity: (draft: Omit<Opportunity, "id" | "bucket" | "stage" | "notes"> & { notes?: string }) => string;
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void;
  setBucket: (id: string, bucket: Bucket) => void;
  setStage: (id: string, stage: Stage) => void;
  setGo: (id: string, patch: Partial<GoNoGo>) => void;
  setGoScore: (id: string, criterion: keyof GoNoGo["scores"], value: number) => void;
  setCapture: (id: string, patch: Partial<CapturePlan>) => void;
  toggleCaptureCheck: (id: string, checkId: string) => void;
  setProposal: (id: string, patch: Partial<ProposalProgress>) => void;
  toggleProposalCheck: (id: string, checkId: string) => void;
  togglePlaybookCheck: (id: string) => void;
  removeOpportunity: (id: string) => void;
  clearSamples: () => void;
  restoreSamples: () => void;
}

function applyBucket(opp: Opportunity, bucket: Bucket): Opportunity {
  let stage = opp.stage;
  if (bucket === "pass") stage = "no-bid";
  else if (bucket === "score" && (stage === "triage" || stage === "no-bid")) stage = "gonogo";
  else if (bucket === "respond" || bucket === "shape") stage = stage === "no-bid" ? "triage" : stage;
  else if (bucket === "intel") stage = "triage";
  return { ...opp, bucket, stage };
}

/** Fire the server write; on failure, roll the optimistic local change back
 * to whatever the server actually last confirmed by re-hydrating, and tell
 * the user — silent data loss on a flaky connection is worse than a toast. */
function persist(action: Promise<unknown>, label: string) {
  action.catch((err: unknown) => {
    console.error(`[contract-radar] ${label} failed:`, err);
    toast.error(`Couldn't save (${label}) — reload to check you're not out of sync.`);
  });
}

export const usePlaybook = create<State>()((set, get) => ({
  company: defaultCompany(),
  opportunities: [],
  checks: {},
  keywords: [],
  ready: false,

  hydrateFromServer: async () => {
    const [opportunities, { company, playbookChecks }, watchlist] = await Promise.all([
      fetchOpportunities(),
      fetchCompany(),
      fetchWatchlist(),
    ]);

    let finalOpportunities = opportunities;
    if (opportunities.length === 0) {
      const claimed = await claimFirstSeed();
      if (claimed) {
        finalOpportunities = seedOpportunities();
        persist(upsertOpportunities({ data: finalOpportunities }), "seed samples");
      }
    }

    set({
      company,
      checks: playbookChecks,
      opportunities: finalOpportunities,
      keywords: watchlist.filter((w) => w.type === "keyword"),
      ready: true,
    });
  },

  setCompany: (patch) => {
    const company = { ...get().company, ...patch, setupComplete: true };
    set({ company });
    persist(saveCompanyFn({ data: patch }), "company posture");
  },
  toggleCert: (id) => {
    const certs = get().company.certs.includes(id)
      ? get().company.certs.filter((c) => c !== id)
      : [...get().company.certs, id];
    set({ company: { ...get().company, certs, setupComplete: true } });
    persist(saveCompanyFn({ data: { certs } }), "certification");
  },
  toggleVehicle: (name) => {
    const vehicles = get().company.vehicles.includes(name)
      ? get().company.vehicles.filter((v) => v !== name)
      : [...get().company.vehicles, name];
    set({ company: { ...get().company, vehicles, setupComplete: true } });
    persist(saveCompanyFn({ data: { vehicles } }), "vehicle");
  },
  toggleNaics: (code) => {
    const current = get().company.naics;
    const naics = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    set({ company: { ...get().company, naics, setupComplete: true } });
    persist(saveCompanyFn({ data: { naics } }), "NAICS cluster");
  },

  addKeyword: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const item: WatchlistItem = { id: uid("kw"), type: "keyword", value: trimmed, label: null };
    set({ keywords: [...get().keywords, item] });
    persist(addWatchlistItemFn({ data: { id: item.id, type: "keyword", value: trimmed } }), "keyword");
  },
  removeKeyword: (id) => {
    set({ keywords: get().keywords.filter((k) => k.id !== id) });
    persist(removeWatchlistItemFn({ data: { id } }), "remove keyword");
  },
  requestSync: () => {
    persist(requestSyncFn(), "sync request");
    toast.success("Sync requested — the daily job will pick it up shortly.");
  },

  addOpportunity: (draft) => {
    const id = uid("opp");
    const bucket = recommendBucket(draft.noticeType);
    const opp: Opportunity = {
      ...draft,
      id,
      notes: draft.notes ?? "",
      bucket,
      stage: bucket === "score" ? "gonogo" : "triage",
    };
    set({ opportunities: [opp, ...get().opportunities] });
    persist(upsertOpportunities({ data: [opp] }), "new notice");
    return id;
  },
  updateOpportunity: (id, patch) => {
    set({
      opportunities: get().opportunities.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
    persist(patchOpportunity({ data: { id, patch } }), "notice");
  },
  setBucket: (id, bucket) => {
    set({
      opportunities: get().opportunities.map((o) => (o.id === id ? applyBucket(o, bucket) : o)),
    });
    const updated = get().opportunities.find((o) => o.id === id);
    if (updated) {
      persist(
        patchOpportunity({ data: { id, patch: { bucket: updated.bucket, stage: updated.stage } } }),
        "bucket",
      );
    }
  },
  setStage: (id, stage) => {
    set({
      opportunities: get().opportunities.map((o) => (o.id === id ? { ...o, stage } : o)),
    });
    persist(patchOpportunity({ data: { id, patch: { stage } } }), "stage");
  },
  setGo: (id, patch) => {
    let nextGo: GoNoGo | undefined;
    let nextStage: Stage | undefined;
    let nextBucket: Bucket | undefined;
    set({
      opportunities: get().opportunities.map((o) => {
        if (o.id !== id) return o;
        const merged = { ...(o.go ?? defaultGo()), ...patch };
        // Only re-roll the decision from scores when the patch itself
        // didn't set one (e.g. a slider move via setGoScore). A patch
        // that names a decision is a manual call (GO / Conditional /
        // Team only / No-Go) and must stick, not get silently
        // overwritten by the score-derived suggestion.
        const go = patch.decision === undefined ? withRolledDecision(merged) : merged;
        let stage = o.stage;
        if (go.decision === "go" || go.decision === "conditional") stage = "capture";
        if (go.decision === "no-go") stage = "no-bid";
        if (go.decision === "team-only") stage = "capture";
        const bucket = go.decision === "no-go" ? "pass" : o.bucket;
        nextGo = go;
        nextStage = stage;
        nextBucket = bucket;
        return { ...o, go, stage, bucket };
      }),
    });
    if (nextGo) {
      persist(
        patchOpportunity({ data: { id, patch: { go: nextGo, stage: nextStage, bucket: nextBucket } } }),
        "Go/No-Go",
      );
    }
  },
  setGoScore: (id, criterion, value) => {
    const o = get().opportunities.find((x) => x.id === id);
    const base = o?.go ?? defaultGo();
    get().setGo(id, { scores: { ...base.scores, [criterion]: value } });
  },
  setCapture: (id, patch) => {
    let nextCapture: CapturePlan | undefined;
    set({
      opportunities: get().opportunities.map((o) => {
        if (o.id !== id) return o;
        nextCapture = { ...(o.capture ?? defaultCapture()), ...patch };
        return { ...o, capture: nextCapture };
      }),
    });
    if (nextCapture) persist(patchOpportunity({ data: { id, patch: { capture: nextCapture } } }), "capture plan");
  },
  toggleCaptureCheck: (id, checkId) => {
    let nextCapture: CapturePlan | undefined;
    set({
      opportunities: get().opportunities.map((o) => {
        if (o.id !== id) return o;
        const capture = o.capture ?? defaultCapture();
        nextCapture = { ...capture, checks: { ...capture.checks, [checkId]: !capture.checks[checkId] } };
        return { ...o, capture: nextCapture };
      }),
    });
    if (nextCapture) persist(patchOpportunity({ data: { id, patch: { capture: nextCapture } } }), "capture checklist");
  },
  setProposal: (id, patch) => {
    let nextProposal: ProposalProgress | undefined;
    let nextStage: Stage | undefined;
    set({
      opportunities: get().opportunities.map((o) => {
        if (o.id !== id) return o;
        nextProposal = { ...(o.proposal ?? defaultProposal()), ...patch };
        let stage = o.stage;
        if (nextProposal.submitted) stage = "submitted";
        nextStage = stage;
        return { ...o, proposal: nextProposal, stage };
      }),
    });
    if (nextProposal) {
      persist(
        patchOpportunity({ data: { id, patch: { proposal: nextProposal, stage: nextStage } } }),
        "proposal",
      );
    }
  },
  toggleProposalCheck: (id, checkId) => {
    let nextProposal: ProposalProgress | undefined;
    set({
      opportunities: get().opportunities.map((o) => {
        if (o.id !== id) return o;
        const proposal = o.proposal ?? defaultProposal();
        nextProposal = { ...proposal, checks: { ...proposal.checks, [checkId]: !proposal.checks[checkId] } };
        return { ...o, proposal: nextProposal };
      }),
    });
    if (nextProposal) persist(patchOpportunity({ data: { id, patch: { proposal: nextProposal } } }), "proposal checklist");
  },
  togglePlaybookCheck: (id) => {
    const checks = { ...get().checks, [id]: !get().checks[id] };
    set({ checks });
    persist(savePlaybookChecks({ data: checks }), "playbook progress");
  },
  removeOpportunity: (id) => {
    set({ opportunities: get().opportunities.filter((o) => o.id !== id) });
    persist(deleteOpportunityFn({ data: { id } }), "remove notice");
  },
  clearSamples: () => {
    set({ opportunities: get().opportunities.filter((o) => !o.sample) });
    persist(deleteSampleOpportunities(), "clear samples");
  },
  restoreSamples: () => {
    const seeded = seedOpportunities();
    set({ opportunities: [...seeded, ...get().opportunities.filter((o) => !o.sample)] });
    persist(upsertOpportunities({ data: seeded }), "restore samples");
  },
}));

export function getCapture(opp: Opportunity): CapturePlan {
  return opp.capture ?? defaultCapture();
}

export function getProposal(opp: Opportunity): ProposalProgress {
  return opp.proposal ?? defaultProposal();
}

export function getGo(opp: Opportunity): GoNoGo {
  return opp.go ?? defaultGo();
}
