import { Button } from "@/components/ui/button";
import { getProposal, usePlaybook } from "@/lib/playbook/store";
import { PROPOSAL_CHECKS, type Opportunity } from "@/lib/playbook/types";
import { cn } from "@/lib/utils";

export function ProposalPanel({ opp }: { opp: Opportunity }) {
  const toggle = usePlaybook((s) => s.toggleProposalCheck);
  const setProposal = usePlaybook((s) => s.setProposal);
  const setStage = usePlaybook((s) => s.setStage);
  const p = getProposal(opp);
  const done = PROPOSAL_CHECKS.filter((c) => p.checks[c.id]).length;
  const pct = Math.round((done / PROPOSAL_CHECKS.length) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Section L is how you build it. Section M is how they score it. Storyboard before prose.
          Color teams exist to kill strategy errors, not commas.
        </p>
        <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface">
          {PROPOSAL_CHECKS.map((c) => (
            <li key={c.id}>
              <label className="flex min-h-14 cursor-pointer items-start gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-accent"
                  checked={!!p.checks[c.id]}
                  onChange={() => toggle(opp.id, c.id)}
                />
                <span className={cn("text-sm leading-snug", p.checks[c.id] ? "text-muted line-through" : "text-fg")}>
                  {c.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Toggle
            on={p.pinkTeam}
            label="Pink team held"
            onClick={() => setProposal(opp.id, { pinkTeam: !p.pinkTeam })}
          />
          <Toggle
            on={p.redTeam}
            label="Red team held"
            onClick={() => setProposal(opp.id, { redTeam: !p.redTeam })}
          />
          <Toggle
            on={p.goldTeam}
            label="Gold / production"
            onClick={() => setProposal(opp.id, { goldTeam: !p.goldTeam })}
          />
        </div>
      </div>
      <aside className="h-fit rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Factory</p>
        <p className="mt-2 font-display text-4xl tabular text-fg">{pct}%</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Submit 24 hours early in the channel the RFP named. Then log the confirmation.
        </p>
        {!p.submitted ? (
          <Button
            className="mt-5 w-full"
            onClick={() => {
              setProposal(opp.id, { submitted: true, submittedAt: new Date().toISOString() });
            }}
          >
            Mark submitted
          </Button>
        ) : (
          <div className="mt-5 space-y-2">
            <p className="text-sm text-go">Submitted. Prepare the debrief letter now, not after the notice.</p>
            <Button variant="go" className="w-full" onClick={() => setStage(opp.id, "awarded")}>
              Awarded
            </Button>
            <Button variant="nogo" className="w-full" onClick={() => setStage(opp.id, "lost")}>
              Lost — request debrief
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-full border px-4 text-sm",
        on ? "border-go/40 bg-go/15 text-go" : "border-border text-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}
