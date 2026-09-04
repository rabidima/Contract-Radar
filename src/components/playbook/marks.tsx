import {
  BUCKET_LABEL,
  NOTICE_LABEL,
  SET_ASIDE_LABEL,
  STAGE_LABEL,
  type Bucket,
  type GoDecision,
  type NoticeType,
  type SetAside,
  type Stage,
} from "@/lib/playbook/types";
import { Badge } from "@/components/ui/badge";

export function NoticeBadge({ type }: { type: NoticeType }) {
  const tone =
    type === "solicitation"
      ? "accent"
      : type === "sources-sought" || type === "rfi"
        ? "go"
        : type === "award" || type === "justification"
          ? "hold"
          : "mute";
  return <Badge tone={tone}>{NOTICE_LABEL[type]}</Badge>;
}

export function SetAsideBadge({ value }: { value: SetAside }) {
  return (
    <Badge tone={value === "unrestricted" ? "mute" : "paper"}>{SET_ASIDE_LABEL[value]}</Badge>
  );
}

export function BucketBadge({ value }: { value: Bucket }) {
  const tone =
    value === "pass" ? "nogo" : value === "score" ? "accent" : value === "respond" ? "go" : "mute";
  return <Badge tone={tone}>{BUCKET_LABEL[value]}</Badge>;
}

export function StageBadge({ value }: { value: Stage }) {
  const tone =
    value === "awarded"
      ? "go"
      : value === "lost" || value === "no-bid"
        ? "nogo"
        : value === "proposal" || value === "submitted"
          ? "accent"
          : "mute";
  return <Badge tone={tone}>{STAGE_LABEL[value]}</Badge>;
}

export function DecisionBadge({ value }: { value: GoDecision }) {
  if (value === "go") return <Badge tone="go">GO</Badge>;
  if (value === "conditional" || value === "team-only") return <Badge tone="hold">{value === "team-only" ? "TEAM ONLY" : "CONDITIONAL"}</Badge>;
  if (value === "no-go") return <Badge tone="nogo">NO-GO</Badge>;
  return <Badge>PENDING</Badge>;
}

export function FitDot({ fit }: { fit: "exact" | "adjacent" | "none" }) {
  const label = fit === "exact" ? "Exact NAICS" : fit === "adjacent" ? "Adjacent NAICS" : "Off-NAICS";
  const tone = fit === "exact" ? "go" : fit === "adjacent" ? "hold" : "mute";
  return <Badge tone={tone}>{label}</Badge>;
}
