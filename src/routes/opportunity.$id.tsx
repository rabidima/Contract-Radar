import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { CapturePanel } from "@/components/playbook/capture-panel";
import { GoPanel } from "@/components/playbook/go-panel";
import { BucketBadge, FitDot, NoticeBadge, SetAsideBadge, StageBadge } from "@/components/playbook/marks";
import { ProposalPanel } from "@/components/playbook/proposal-panel";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";
import { eligibleFor, naicsFit, recommendBucket, suggestedAction } from "@/lib/playbook/gonogo";
import { naicsSize, naicsTitle } from "@/lib/playbook/naics";
import { usePlaybook } from "@/lib/playbook/store";
import { BUCKETS, BUCKET_LABEL, STAGES, STAGE_LABEL, type Bucket, type Stage } from "@/lib/playbook/types";
import { cn, formatCurrency, formatDate, formatDue } from "@/lib/utils";

export const Route = createFileRoute("/opportunity/$id")({ component: OpportunityPage });

const TABS = [
  { id: "brief", label: "Brief" },
  { id: "gonogo", label: "Go / No-Go" },
  { id: "capture", label: "Capture" },
  { id: "proposal", label: "Factory" },
] as const;

function OpportunityPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const opp = usePlaybook((s) => s.opportunities.find((o) => o.id === id));
  const company = usePlaybook((s) => s.company);
  const setBucket = usePlaybook((s) => s.setBucket);
  const setStage = usePlaybook((s) => s.setStage);
  const update = usePlaybook((s) => s.updateOpportunity);
  const remove = usePlaybook((s) => s.removeOpportunity);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("brief");

  if (!opp) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-display text-2xl">Notice not on the desk</p>
        <Link to="/desk" className="mt-4 inline-flex h-11 items-center text-sm text-accent">
          Return to Daily Desk
        </Link>
      </div>
    );
  }

  const fit = naicsFit(opp.naics, company.naics);
  const elig = eligibleFor(opp.setAside, company.certs);
  const suggested = recommendBucket(opp.noticeType);

  return (
    <div>
      <div className="border-b border-border px-4 py-6 sm:px-8">
        <Link to="/desk" className="inline-flex h-11 items-center gap-2 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" />
          Daily Desk
        </Link>
        <div className="mt-3 flex flex-wrap gap-2">
          <NoticeBadge type={opp.noticeType} />
          <SetAsideBadge value={opp.setAside} />
          <BucketBadge value={opp.bucket} />
          <StageBadge value={opp.stage} />
          <FitDot fit={fit} />
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          {opp.title}
        </h1>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>{opp.agency}{opp.office ? ` · ${opp.office}` : ""}</span>
          <span className="font-mono text-accent">{opp.noticeId}</span>
          <span className="font-mono">{opp.naics}</span>
          <span>{naicsTitle(opp.naics)}</span>
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-border px-4 sm:px-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "h-12 shrink-0 border-b-2 px-3 text-sm",
              tab === t.id
                ? "border-accent text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-6 sm:px-8">
        {tab === "brief" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              <aside className="rounded-xl border border-accent/25 bg-accent/10 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Desk recommendation</p>
                <p className="mt-2 text-sm leading-relaxed text-fg">{suggestedAction(opp, company)}</p>
                {opp.bucket !== suggested ? (
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() => setBucket(opp.id, suggested)}
                  >
                    Apply suggested bucket: {BUCKET_LABEL[suggested]}
                  </Button>
                ) : null}
              </aside>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Fact k="Due" v={formatDue(opp.dueAt)} d={formatDate(opp.dueAt)} />
                <Fact k="Posted" v={formatDate(opp.postedAt)} />
                <Fact k="Est. value" v={formatCurrency(opp.estValue)} />
                <Fact k="Place" v={opp.place ?? "—"} />
                <Fact k="PSC" v={opp.psc ?? "—"} />
                <Fact k="Size std (NAICS)" v={naicsSize(opp.naics)} />
                <Fact k="Incumbent" v={opp.incumbent ?? "Unknown"} />
                <Fact k="Eligibility" v={elig ? "Eligible as-is" : "Gap — team or pass"} />
                <Fact k="NAICS fit" v={fit === "exact" ? "Exact" : fit === "adjacent" ? "Adjacent" : "Off-cluster"} />
              </dl>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Notes</p>
                <Textarea
                  className="mt-2"
                  value={opp.notes}
                  onChange={(e) => update(opp.id, { notes: e.target.value })}
                  placeholder="Incumbent intel, vehicle, who asked us to look…"
                />
              </div>
            </div>
            <aside className="h-fit space-y-3 rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Bucket</p>
              <Select value={opp.bucket} onChange={(e) => setBucket(opp.id, e.target.value as Bucket)}>
                {BUCKETS.map((b) => (
                  <option key={b} value={b}>{BUCKET_LABEL[b]}</option>
                ))}
              </Select>
              <p className="pt-2 text-xs font-medium uppercase tracking-wider text-muted">Stage</p>
              <Select value={opp.stage} onChange={(e) => setStage(opp.id, e.target.value as Stage)}>
                {STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                ))}
              </Select>
              <Button className="w-full" variant="outline" onClick={() => setTab("gonogo")}>
                Run Go / No-Go
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => {
                  remove(opp.id);
                  void navigate({ to: "/desk" });
                }}
              >
                Remove from desk
              </Button>
            </aside>
          </div>
        ) : null}
        {tab === "gonogo" ? <GoPanel opp={opp} /> : null}
        {tab === "capture" ? <CapturePanel opp={opp} /> : null}
        {tab === "proposal" ? <ProposalPanel opp={opp} /> : null}
      </div>
    </div>
  );
}

function Fact({ k, v, d }: { k: string; v: string; d?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-3">
      <dt className="text-[11px] uppercase tracking-wider text-subtle">{k}</dt>
      <dd className="mt-1 text-sm text-fg">{v}</dd>
      {d ? <p className="text-xs text-subtle">{d}</p> : null}
    </div>
  );
}
