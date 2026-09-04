import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/app-shell";
import { DecisionBadge, NoticeBadge } from "@/components/playbook/marks";
import { usePlaybook } from "@/lib/playbook/store";
import { STAGE_LABEL, type Opportunity, type Stage } from "@/lib/playbook/types";
import { formatCurrency, formatDue } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({ component: Pipeline });

const COLS: Stage[] = ["triage", "gonogo", "capture", "proposal", "submitted", "awarded"];

export function Pipeline() {
  const opportunities = usePlaybook((s) => s.opportunities);
  const setStage = usePlaybook((s) => s.setStage);
  const nobid = opportunities.filter((o) => o.stage === "no-bid" || o.stage === "lost");

  return (
    <div>
      <PageHeader
        kicker="Friday ritual"
        title="Pipeline"
        dek="Kill rotting CONDITIONAL. Count concurrent GOs against the cap. Awarded and lost both belong on the board — they are how the factory learns."
      />
      <div className="px-4 py-6 sm:px-8">
        <div className="flex gap-3 overflow-x-auto pb-4 desk-scroll">
          {COLS.map((col) => {
            const items = opportunities.filter((o) => o.stage === col);
            return (
              <section
                key={col}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-surface"
              >
                <header className="flex items-baseline justify-between border-b border-border px-3 py-3">
                  <h2 className="text-sm font-medium text-fg">{STAGE_LABEL[col]}</h2>
                  <span className="font-mono text-xs tabular text-subtle">{items.length}</span>
                </header>
                <div className="flex flex-col gap-2 p-2 min-h-40">
                  {items.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-subtle">Empty</p>
                  ) : (
                    items.map((o) => <PipeCard key={o.id} opp={o} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>
        {nobid.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-sm font-medium text-muted">No-bid / lost — keep the reasons</h2>
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
              {nobid.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <Link to="/opportunity/$id" params={{ id: o.id }} className="text-sm text-fg hover:text-accent">
                    {o.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-subtle">{STAGE_LABEL[o.stage]}</span>
                    {o.go ? <DecisionBadge value={o.go.decision} /> : null}
                    <button
                      type="button"
                      className="h-11 px-2 text-xs text-muted hover:text-fg"
                      onClick={() => setStage(o.id, "triage")}
                    >
                      Restore
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function PipeCard({ opp }: { opp: Opportunity }) {
  return (
    <Link
      to="/opportunity/$id"
      params={{ id: opp.id }}
      className="rounded-md border border-border bg-elevated/50 p-3 hover:border-border-strong"
    >
      <div className="flex flex-wrap gap-1.5">
        <NoticeBadge type={opp.noticeType} />
        {opp.go ? <DecisionBadge value={opp.go.decision} /> : null}
      </div>
      <p className="mt-2 text-sm font-medium leading-snug text-fg">{opp.title}</p>
      <p className="mt-2 flex justify-between text-xs text-subtle">
        <span className="tabular">{formatCurrency(opp.estValue)}</span>
        <span>{formatDue(opp.dueAt)}</span>
      </p>
    </Link>
  );
}
