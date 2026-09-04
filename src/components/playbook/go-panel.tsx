import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import {
  decisionFromScore,
  describeDecision,
  economicsPass,
  expectedValue,
  pwinFromScore,
  weightedScore,
} from "@/lib/playbook/gonogo";
import { getGo, usePlaybook } from "@/lib/playbook/store";
import { GO_CRITERIA, type Opportunity } from "@/lib/playbook/types";
import { cn, formatCurrency, formatFullCurrency } from "@/lib/utils";

export function GoPanel({ opp }: { opp: Opportunity }) {
  const company = usePlaybook((s) => s.company);
  const setGo = usePlaybook((s) => s.setGo);
  const setGoScore = usePlaybook((s) => s.setGoScore);
  const setStage = usePlaybook((s) => s.setStage);
  const go = getGo(opp);
  const score = weightedScore(go.scores);
  const pwin = pwinFromScore(score);
  const ev = expectedValue(score, opp.estValue);
  const econ = economicsPass(score, opp.estValue, company.typicalBidCost);
  const rolled = decisionFromScore(score);
  const meta = describeDecision(go.decision === "pending" ? rolled : go.decision);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        {GO_CRITERIA.map((c) => {
          const value = go.scores[c.id];
          return (
            <div key={c.id} className="rounded-lg border border-border bg-elevated/40 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-fg">{c.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{c.hint}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg tabular text-fg">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-subtle">
                    {Math.round(c.weight * 100)}%
                  </p>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={value}
                onChange={(e) => setGoScore(opp.id, c.id, Number(e.target.value))}
                className="mt-3 h-11 w-full accent-accent"
                aria-label={c.label}
              />
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-subtle">
                <span>Hostile</span>
                <span>Known</span>
                <span>Should write</span>
              </div>
            </div>
          );
        })}
        <div className="grid gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Decision rationale</p>
          <Textarea
            value={go.rationale}
            onChange={(e) => setGo(opp.id, { rationale: e.target.value })}
            placeholder="One paragraph. Evidence, not hope. If conditional, name the teammate and the Friday expiry."
          />
        </div>
      </div>

      <aside className="h-fit rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Weighted score</p>
        <p className="mt-2 font-display text-5xl tabular tracking-tight text-fg">{score.toFixed(2)}</p>
        <p className="mt-1 text-sm text-muted">
          Suggested {rolled.toUpperCase()} · Pwin ~{Math.round(pwin * 100)}%
        </p>
        <dl className="mt-5 space-y-2 text-sm">
          <Row k="Est. value" v={formatCurrency(opp.estValue)} />
          <Row k="Bid cost" v={formatFullCurrency(company.typicalBidCost)} />
          <Row k="Expected value" v={ev == null ? "Set a value" : formatCurrency(ev)} />
          <Row
            k="EV / bid cost"
            v={
              ev == null
                ? "—"
                : `${(ev / company.typicalBidCost).toFixed(1)}× ${econ ? "clears 3×" : "below 3×"}`
            }
          />
        </dl>
        <p className={cn("mt-4 text-sm leading-relaxed", econ ? "text-muted" : "text-hold")}>
          {meta.detail}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            variant="go"
            size="sm"
            onClick={() =>
              setGo(opp.id, { decision: "go", decidedAt: new Date().toISOString() })
            }
          >
            GO
          </Button>
          <Button
            variant="hold"
            size="sm"
            onClick={() =>
              setGo(opp.id, { decision: "conditional", decidedAt: new Date().toISOString() })
            }
          >
            Conditional
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setGo(opp.id, { decision: "team-only", decidedAt: new Date().toISOString() })
            }
          >
            Team only
          </Button>
          <Button
            variant="nogo"
            size="sm"
            onClick={() =>
              setGo(opp.id, { decision: "no-go", decidedAt: new Date().toISOString() })
            }
          >
            No-Go
          </Button>
        </div>
        {(go.decision === "go" || go.decision === "conditional" || go.decision === "team-only") && (
          <Button
            className="mt-3 w-full"
            variant="outline"
            size="sm"
            onClick={() => setStage(opp.id, "proposal")}
          >
            Open the factory
          </Button>
        )}
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-subtle">{k}</dt>
      <dd className="tabular text-fg">{v}</dd>
    </div>
  );
}
