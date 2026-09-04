import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { AddNoticeButton } from "@/components/playbook/add-notice";
import { OppCard } from "@/components/playbook/opp-card";
import { Button } from "@/components/ui/button";
import { usePlaybook } from "@/lib/playbook/store";
import { BUCKET_LABEL, type Bucket } from "@/lib/playbook/types";
import { cn, daysUntil } from "@/lib/utils";

export const Route = createFileRoute("/desk")({ component: Desk });

const FILTERS: Array<{ id: "all" | Bucket; label: string }> = [
  { id: "all", label: "All" },
  { id: "inbox", label: "Inbox" },
  { id: "respond", label: "Respond" },
  { id: "shape", label: "Shape" },
  { id: "score", label: "Score" },
  { id: "intel", label: "Intel" },
  { id: "pass", label: "Pass" },
];

function Desk() {
  const opportunities = usePlaybook((s) => s.opportunities);
  const company = usePlaybook((s) => s.company);
  const clearSamples = usePlaybook((s) => s.clearSamples);
  const restoreSamples = usePlaybook((s) => s.restoreSamples);
  const hasSamples = opportunities.some((o) => o.sample);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: opportunities.length };
    for (const o of opportunities) c[o.bucket] = (c[o.bucket] ?? 0) + 1;
    return c;
  }, [opportunities]);

  const list = useMemo(() => {
    const base = filter === "all" ? opportunities : opportunities.filter((o) => o.bucket === filter);
    return [...base].sort((a, b) => {
      const ad = a.noticeType === "award" || a.noticeType === "justification" ? 99 : daysUntil(a.dueAt);
      const bd = b.noticeType === "award" || b.noticeType === "justification" ? 99 : daysUntil(b.dueAt);
      return ad - bd;
    });
  }, [opportunities, filter]);

  const staleInbox = opportunities.filter((o) => o.bucket === "inbox" && daysUntil(o.postedAt) < 0).length;

  return (
    <div>
      <PageHeader
        kicker="Protocol 03"
        title="Daily Desk"
        dek="Ninety seconds per notice. Type, set-aside, clock, place, NAICS vs. title, value vs. bid cost. Write the bucket. Nothing stays in Inbox overnight."
        actions={<AddNoticeButton />}
      />
      <div className="px-4 py-6 sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {staleInbox > 0
              ? `${staleInbox} inbox item(s) broke the 24-hour rule.`
              : "24-hour rule: empty the inbox before close of business."}
          </p>
          {hasSamples ? (
            <Button variant="ghost" size="sm" onClick={clearSamples}>
              Clear sample desk
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={restoreSamples}>
              Load sample desk
            </Button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-11 shrink-0 rounded-full border px-4 text-sm",
                filter === f.id
                  ? "border-fg bg-fg text-bg"
                  : "border-border text-muted hover:text-fg",
              )}
            >
              {f.label}
              <span className="ml-2 font-mono text-xs tabular opacity-70">{counts[f.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3">
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong px-4 py-16 text-center">
              <p className="font-display text-xl text-fg">Desk is clear</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Paste the morning SAM.gov digest with Add SAM notice. {filter !== "all" ? `Nothing in ${BUCKET_LABEL[filter as Bucket]}.` : ""}
              </p>
            </div>
          ) : (
            list.map((o) => <OppCard key={o.id} opp={o} company={company} />)
          )}
        </div>
      </div>
    </div>
  );
}
