import { GO_CRITERIA, type Company, type CriterionId, type GoDecision, type GoNoGo, type NoticeType, type Opportunity, type SetAside } from "./types";

export function emptyScores(): Record<CriterionId, number> {
  return {
    fit: 3,
    eligibility: 3,
    customer: 2,
    pastperf: 3,
    position: 2,
    economics: 3,
    capacity: 3,
    clock: 3,
  };
}

export function weightedScore(scores: Record<CriterionId, number>): number {
  return GO_CRITERIA.reduce((sum, c) => sum + scores[c.id] * c.weight, 0);
}

export function pwinFromScore(score: number): number {
  const t = Math.min(5, Math.max(1, score));
  return Math.min(0.58, Math.max(0.04, (t / 5) ** 1.4 * 0.55));
}

export function expectedValue(score: number, estValue?: number): number | null {
  if (!estValue) return null;
  return pwinFromScore(score) * estValue;
}

export function decisionFromScore(score: number): GoDecision {
  if (score >= 3.8) return "go";
  if (score >= 3.2) return "conditional";
  return "no-go";
}

export function economicsPass(score: number, estValue: number | undefined, bidCost: number): boolean {
  const ev = expectedValue(score, estValue);
  if (ev == null) return score >= 3.5;
  return ev >= bidCost * 3;
}

export function recommendBucket(noticeType: NoticeType): Opportunity["bucket"] {
  switch (noticeType) {
    case "sources-sought":
    case "rfi":
      return "respond";
    case "presolicitation":
    case "special":
      return "shape";
    case "solicitation":
      return "score";
    case "award":
    case "justification":
      return "intel";
    default:
      return "inbox";
  }
}

export function eligibleFor(setAside: SetAside, certs: Company["certs"]): boolean {
  if (setAside === "unrestricted" || setAside === "partial-sb" || setAside === "total-sb") {
    return setAside !== "total-sb" || certs.includes("small-business") || certs.length > 0;
  }
  if (setAside === "8a") return certs.includes("8a");
  if (setAside === "hubzone") return certs.includes("hubzone");
  if (setAside === "sdvosb") return certs.includes("sdvosb");
  if (setAside === "wosb") return certs.includes("wosb") || certs.includes("edwosb");
  if (setAside === "edwosb") return certs.includes("edwosb");
  return false;
}

export function naicsFit(oppNaics: string, companyNaics: string[]): "exact" | "adjacent" | "none" {
  if (companyNaics.includes(oppNaics)) return "exact";
  const adj: Record<string, string[]> = {
    "541511": ["541512", "541519", "541513", "518210"],
    "541512": ["541511", "541519", "541513", "518210", "541611"],
    "541513": ["541512", "541519", "561210"],
    "541519": ["541511", "541512", "541513"],
    "541330": ["541310", "541370", "541380", "541690"],
    "541611": ["541612", "541618", "541690", "541990", "541512"],
    "561210": ["561720", "561612", "541513"],
    "236220": ["238210", "238220", "238160", "237310"],
    "518210": ["541512", "541513", "541519"],
  };
  for (const c of companyNaics) {
    if ((adj[c] ?? []).includes(oppNaics) || (adj[oppNaics] ?? []).includes(c)) return "adjacent";
  }
  return "none";
}

export function suggestedAction(opp: Opportunity, company: Company): string {
  const bucket = recommendBucket(opp.noticeType);
  const fit = naicsFit(opp.naics, company.naics);
  const elig = eligibleFor(opp.setAside, company.certs);

  if (opp.noticeType === "sources-sought" || opp.noticeType === "rfi") {
    if (fit === "none") return "Pass unless the PWS is clearly your work under a miscoded NAICS.";
    return "Respond this week. Sources Sought is cheap positioning — skip it and you never see the RFP as a known vendor.";
  }
  if (opp.noticeType === "award" || opp.noticeType === "justification") {
    return "Log the awardee, value, and NAICS. This is competitor intel, not a bid.";
  }
  if (!elig && opp.setAside !== "unrestricted") {
    return "You are not eligible as-is. Team within 72 hours or Pass.";
  }
  if (fit === "none") {
    return "NAICS is not in your cluster. Read the title once; Pass unless the PWS is unmistakably yours.";
  }
  if (opp.estValue && opp.estValue < company.minContract) {
    return "Below your minimum contract size. Pass unless it is a foot-in-the-door at a target account.";
  }
  if (bucket === "score") {
    return "Run the Go/No-Go the same day. Do not start writing.";
  }
  if (bucket === "shape") {
    return "This is a capture problem, not a proposal problem. Map the customer and shape the draft.";
  }
  return "Bucket it in 90 seconds and move on.";
}

export function describeDecision(d: GoDecision): { label: string; detail: string } {
  switch (d) {
    case "go":
      return { label: "GO", detail: "Commit capture resources. Open a capture plan the same day." };
    case "conditional":
      return { label: "CONDITIONAL", detail: "Go only with a named teammate, a narrowed scope, or a written assumption that closes the gap." };
    case "no-go":
      return { label: "NO-GO", detail: "Write the reason. File it. Do not revisit unless the solicitation materially changes." };
    case "team-only":
      return { label: "TEAM ONLY", detail: "You are not prime. Offer a discrete workshare to a better-positioned prime." };
    default:
      return { label: "PENDING", detail: "Score it before anyone drafts a sentence." };
  }
}

export function withRolledDecision(go: GoNoGo): GoNoGo {
  const score = weightedScore(go.scores);
  return { ...go, decision: decisionFromScore(score) };
}
