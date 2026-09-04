import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedOpportunities } from "./demo";
import { emptyScores, recommendBucket, withRolledDecision } from "./gonogo";
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

interface State {
  company: Company;
  opportunities: Opportunity[];
  checks: PlaybookChecks;
  dismissedSample: boolean;
  ready: boolean;
  markReady: () => void;
  hydrateIfEmpty: () => void;
  setCompany: (patch: Partial<Company>) => void;
  toggleCert: (id: Company["certs"][number]) => void;
  toggleVehicle: (name: string) => void;
  toggleNaics: (code: string) => void;
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

export const usePlaybook = create<State>()(
  persist(
    (set, get) => ({
      company: defaultCompany(),
      opportunities: [],
      checks: {},
      dismissedSample: false,
      ready: false,
      markReady: () => set({ ready: true }),
      hydrateIfEmpty: () => {
        if (get().opportunities.length === 0 && !get().dismissedSample) {
          set({ opportunities: seedOpportunities() });
        }
      },
      setCompany: (patch) =>
        set({ company: { ...get().company, ...patch, setupComplete: true } }),
      toggleCert: (id) => {
        const certs = get().company.certs.includes(id)
          ? get().company.certs.filter((c) => c !== id)
          : [...get().company.certs, id];
        set({ company: { ...get().company, certs, setupComplete: true } });
      },
      toggleVehicle: (name) => {
        const vehicles = get().company.vehicles.includes(name)
          ? get().company.vehicles.filter((v) => v !== name)
          : [...get().company.vehicles, name];
        set({ company: { ...get().company, vehicles, setupComplete: true } });
      },
      toggleNaics: (code) => {
        const current = get().company.naics;
        const naics = current.includes(code)
          ? current.filter((c) => c !== code)
          : [...current, code];
        set({ company: { ...get().company, naics, setupComplete: true } });
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
        return id;
      },
      updateOpportunity: (id, patch) =>
        set({
          opportunities: get().opportunities.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        }),
      setBucket: (id, bucket) =>
        set({
          opportunities: get().opportunities.map((o) => (o.id === id ? applyBucket(o, bucket) : o)),
        }),
      setStage: (id, stage) =>
        set({
          opportunities: get().opportunities.map((o) => (o.id === id ? { ...o, stage } : o)),
        }),
      setGo: (id, patch) =>
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
            return { ...o, go, stage, bucket: go.decision === "no-go" ? "pass" : o.bucket };
          }),
        }),
      setGoScore: (id, criterion, value) => {
        const o = get().opportunities.find((x) => x.id === id);
        const base = o?.go ?? defaultGo();
        get().setGo(id, { scores: { ...base.scores, [criterion]: value } });
      },
      setCapture: (id, patch) =>
        set({
          opportunities: get().opportunities.map((o) =>
            o.id === id ? { ...o, capture: { ...(o.capture ?? defaultCapture()), ...patch } } : o,
          ),
        }),
      toggleCaptureCheck: (id, checkId) =>
        set({
          opportunities: get().opportunities.map((o) => {
            if (o.id !== id) return o;
            const capture = o.capture ?? defaultCapture();
            return {
              ...o,
              capture: {
                ...capture,
                checks: { ...capture.checks, [checkId]: !capture.checks[checkId] },
              },
            };
          }),
        }),
      setProposal: (id, patch) =>
        set({
          opportunities: get().opportunities.map((o) => {
            if (o.id !== id) return o;
            const proposal = { ...(o.proposal ?? defaultProposal()), ...patch };
            let stage = o.stage;
            if (proposal.submitted) stage = "submitted";
            return { ...o, proposal, stage };
          }),
        }),
      toggleProposalCheck: (id, checkId) =>
        set({
          opportunities: get().opportunities.map((o) => {
            if (o.id !== id) return o;
            const proposal = o.proposal ?? defaultProposal();
            return {
              ...o,
              proposal: {
                ...proposal,
                checks: { ...proposal.checks, [checkId]: !proposal.checks[checkId] },
              },
            };
          }),
        }),
      togglePlaybookCheck: (id) =>
        set({ checks: { ...get().checks, [id]: !get().checks[id] } }),
      removeOpportunity: (id) =>
        set({ opportunities: get().opportunities.filter((o) => o.id !== id) }),
      clearSamples: () =>
        set({
          opportunities: get().opportunities.filter((o) => !o.sample),
          dismissedSample: true,
        }),
      restoreSamples: () =>
        set({
          dismissedSample: false,
          opportunities: [
            ...seedOpportunities(),
            ...get().opportunities.filter((o) => !o.sample),
          ],
        }),
    }),
    {
      name: "contract-radar-v1",
      partialize: (s) => ({
        company: s.company,
        opportunities: s.opportunities,
        checks: s.checks,
        dismissedSample: s.dismissedSample,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          usePlaybook.setState({
            opportunities: seedOpportunities(),
            ready: true,
          });
          return;
        }
        if (state.opportunities.length === 0 && !state.dismissedSample) {
          state.opportunities = seedOpportunities();
        }
        state.ready = true;
      },
    },
  ),
);

export function getCapture(opp: Opportunity): CapturePlan {
  return opp.capture ?? defaultCapture();
}

export function getProposal(opp: Opportunity): ProposalProgress {
  return opp.proposal ?? defaultProposal();
}

export function getGo(opp: Opportunity): GoNoGo {
  return opp.go ?? defaultGo();
}
