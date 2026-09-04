import { Link } from "@tanstack/react-router";
import { Clock, Landmark } from "lucide-react";
import { BucketBadge, FitDot, NoticeBadge, SetAsideBadge } from "@/components/playbook/marks";
import { eligibleFor, naicsFit, suggestedAction } from "@/lib/playbook/gonogo";
import { naicsTitle } from "@/lib/playbook/naics";
import type { Company, Opportunity } from "@/lib/playbook/types";
import { cn, daysUntil, formatCurrency, formatDue } from "@/lib/utils";

export function OppCard({
  opp,
  company,
  compact = false,
}: {
  opp: Opportunity;
  company: Company;
  compact?: boolean;
}) {
  const due = daysUntil(opp.dueAt);
  const urgent = due <= 7 && due >= 0 && opp.bucket !== "pass" && opp.bucket !== "intel";
  const overdue = due < 0 && opp.bucket !== "pass" && opp.noticeType !== "award" && opp.noticeType !== "justification";
  const fit = naicsFit(opp.naics, company.naics);
  const elig = eligibleFor(opp.setAside, company.certs);

  return (
    <Link
      to="/opportunity/$id"
      params={{ id: opp.id }}
      className={cn(
        "block rounded-xl border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-elevated/40",
        urgent ? "border-hold/40" : overdue ? "border-nogo/40" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <NoticeBadge type={opp.noticeType} />
        <SetAsideBadge value={opp.setAside} />
        <BucketBadge value={opp.bucket} />
        {opp.sample ? (
          <span className="font-mono text-[10px] uppercase tracking-wider text-subtle">Sample</span>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-lg leading-snug tracking-tight text-fg">{opp.title}</h3>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Landmark className="size-3.5 text-subtle" />
          {opp.agency}
          {opp.office ? ` · ${opp.office}` : ""}
        </span>
        <span className="font-mono text-accent">{opp.naics}</span>
        <span className="text-subtle">{naicsTitle(opp.naics)}</span>
      </p>
      {!compact ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">{suggestedAction(opp, company)}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium tabular",
            overdue ? "text-nogo" : urgent ? "text-hold" : "text-muted",
          )}
        >
          <Clock className="size-3.5" />
          {opp.noticeType === "award" || opp.noticeType === "justification"
            ? "Posted " + formatDue(opp.postedAt).replace("remaining", "ago").replace("Due ", "")
            : formatDue(opp.dueAt)}
        </span>
        <span className="text-subtle">·</span>
        <span className="tabular text-muted">{formatCurrency(opp.estValue)}</span>
        {opp.place ? (
          <>
            <span className="text-subtle">·</span>
            <span className="text-muted">{opp.place}</span>
          </>
        ) : null}
        <span className="ml-auto flex flex-wrap gap-1.5">
          <FitDot fit={fit} />
          {!elig && opp.setAside !== "unrestricted" ? (
            <span className="rounded-full border border-nogo/30 bg-nogo/15 px-2.5 py-0.5 text-xs text-nogo">
              Eligibility gap
            </span>
          ) : null}
        </span>
      </div>
    </Link>
  );
}
