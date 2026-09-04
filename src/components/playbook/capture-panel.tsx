import type { ReactNode } from "react";
import { Input, Label, Textarea } from "@/components/ui/field";
import { getCapture, usePlaybook } from "@/lib/playbook/store";
import { CAPTURE_CHECKS, type Opportunity } from "@/lib/playbook/types";
import { cn } from "@/lib/utils";

export function CapturePanel({ opp }: { opp: Opportunity }) {
  const setCapture = usePlaybook((s) => s.setCapture);
  const toggle = usePlaybook((s) => s.toggleCaptureCheck);
  const setStage = usePlaybook((s) => s.setStage);
  const cap = getCapture(opp);
  const done = CAPTURE_CHECKS.filter((c) => cap.checks[c.id]).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <FieldBlock label="Win themes (three, evaluator-facing)">
          {cap.winThemes.map((t, i) => (
            <Input
              key={i}
              value={t}
              placeholder={`Theme ${i + 1} — claim a mission outcome, not 'quality'`}
              onChange={(e) => {
                const next = [...cap.winThemes];
                next[i] = e.target.value;
                setCapture(opp.id, { winThemes: next });
              }}
            />
          ))}
        </FieldBlock>
        <FieldBlock label="Discriminators">
          {cap.discriminators.map((t, i) => (
            <Input
              key={i}
              value={t}
              placeholder={i === 0 ? "What the likely field cannot copy in this timeline" : "Second discriminator"}
              onChange={(e) => {
                const next = [...cap.discriminators];
                next[i] = e.target.value;
                setCapture(opp.id, { discriminators: next });
              }}
            />
          ))}
        </FieldBlock>
        <div className="grid gap-1.5">
          <Label>Customer map</Label>
          <Textarea
            value={cap.customerMap}
            placeholder="KO, specialist, COR, program, end user, OSBP. Who have we actually spoken to?"
            onChange={(e) => setCapture(opp.id, { customerMap: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Incumbent & field</Label>
          <Textarea
            value={cap.competitorNotes}
            placeholder="Last award from USAspending. Incumbent weaknesses. Who must bid."
            onChange={(e) => setCapture(opp.id, { competitorNotes: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Teaming</Label>
          <Textarea
            value={cap.teaming}
            placeholder="Gap → partner → workshare % → volume owner. 72-hour clock if Conditional."
            onChange={(e) => setCapture(opp.id, { teaming: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Gaps</Label>
          <Textarea
            value={cap.gaps}
            placeholder="Every gap gets a teammate, a hire, or a scope no-bid."
            onChange={(e) => setCapture(opp.id, { gaps: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Questions for Q&A</Label>
          <Textarea
            value={cap.questions}
            placeholder="Unstick ambiguities. Do not telegraph price."
            onChange={(e) => setCapture(opp.id, { questions: e.target.value })}
          />
        </div>
      </div>
      <aside className="h-fit rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Capture checks</p>
        <p className="mt-2 font-display text-3xl tabular text-fg">
          {done}
          <span className="text-lg text-subtle">/{CAPTURE_CHECKS.length}</span>
        </p>
        <ul className="mt-4 space-y-2">
          {CAPTURE_CHECKS.map((c) => (
            <li key={c.id}>
              <label className="flex min-h-11 cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-accent"
                  checked={!!cap.checks[c.id]}
                  onChange={() => toggle(opp.id, c.id)}
                />
                <span className={cn("text-sm leading-snug", cap.checks[c.id] ? "text-muted" : "text-fg")}>
                  {c.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setStage(opp.id, "proposal")}
          className="mt-4 h-11 w-full rounded-sm bg-fg text-sm font-medium text-bg hover:bg-paper"
        >
          Move to proposal factory
        </button>
      </aside>
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
