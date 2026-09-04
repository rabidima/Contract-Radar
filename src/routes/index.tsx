import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Inbox, Scale } from "lucide-react";
import { useMemo } from "react";
import { AddNoticeButton } from "@/components/playbook/add-notice";
import { PageHeader } from "@/components/layout/app-shell";
import { OppCard } from "@/components/playbook/opp-card";
import { CHAPTERS, RULES } from "@/lib/playbook/content";
import { usePlaybook } from "@/lib/playbook/store";
import { daysUntil, formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Command });

function Command() {
  const opportunities = usePlaybook((s) => s.opportunities);
  const company = usePlaybook((s) => s.company);
  const day = new Date().getDate();
  const rule = RULES[day % RULES.length];

  const stats = useMemo(() => {
    const inbox = opportunities.filter((o) => o.bucket === "inbox").length;
    const respond = opportunities.filter((o) => o.bucket === "respond").length;
    const score = opportunities.filter((o) => o.bucket === "score" || o.stage === "gonogo").length;
    const capture = opportunities.filter((o) => o.stage === "capture").length;
    const proposal = opportunities.filter((o) => o.stage === "proposal").length;
    const submitted = opportunities.filter((o) => o.stage === "submitted").length;
    const gos = opportunities.filter((o) => o.go?.decision === "go" || o.stage === "capture" || o.stage === "proposal" || o.stage === "submitted");
    const concurrent = gos.filter((o) => o.stage !== "submitted" && o.stage !== "awarded" && o.stage !== "lost" && o.stage !== "no-bid").length;
    const hot = opportunities
      .filter((o) => o.bucket !== "pass" && o.noticeType !== "award" && o.noticeType !== "justification")
      .filter((o) => daysUntil(o.dueAt) <= 10)
      .sort((a, b) => daysUntil(a.dueAt) - daysUntil(b.dueAt));
    const pipelineValue = opportunities
      .filter((o) => ["capture", "proposal", "submitted"].includes(o.stage) && o.estValue)
      .reduce((s, o) => s + (o.estValue ?? 0), 0);
    return { inbox, respond, score, capture, proposal, submitted, concurrent, hot, pipelineValue };
  }, [opportunities]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <PageHeader
        kicker={today}
        title="Command"
        dek="A daily NAICS search is a sensor. Contract Radar is the decision system that turns those pings into captures, compliant proposals, and debriefs — not a bigger inbox."
        actions={<AddNoticeButton />}
      />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        {!company.name ? (
          <Link
            to="/company"
            className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-accent/30 bg-accent/10 px-4 py-4 hover:bg-accent/15"
          >
            <div>
              <p className="font-display text-lg text-fg">Set company posture</p>
              <p className="mt-1 text-sm text-muted">
                NAICS, set-asides, bid cost, and concurrent-bid cap drive every recommendation on the desk.
              </p>
            </div>
            <ArrowRight className="size-5 shrink-0 text-accent" />
          </Link>
        ) : null}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <Stat k="Inbox" v={stats.inbox} hint="Unbucketed" />
          <Stat k="Respond" v={stats.respond} hint="SS / RFI" />
          <Stat k="Score" v={stats.score} hint="Go / No-Go due" />
          <Stat k="Capture" v={stats.capture} hint="Live pursuits" />
          <Stat k="Factory" v={stats.proposal + stats.submitted} hint="Write / wait" />
          <Stat k="Concurrent GO" v={`${stats.concurrent}/${company.maxConcurrentBids}`} hint="Cap" warn={stats.concurrent >= company.maxConcurrentBids} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Standing rule {rule.id}</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight text-fg">{rule.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{rule.text}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">In capture</p>
            <p className="mt-2 font-display text-3xl tabular text-fg">{formatCurrency(stats.pipelineValue)}</p>
            <p className="mt-1 text-sm text-muted">Value on GO work only. Passes do not count.</p>
            <p className="mt-4 text-xs text-subtle">
              Bid cost {formatCurrency(company.typicalBidCost)} · min contract {formatCurrency(company.minContract)}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl tracking-tight">Today on the desk</h2>
            <Link to="/desk" className="inline-flex h-11 items-center text-sm text-accent hover:text-fg">
              Open Daily Desk
            </Link>
          </div>
          {stats.hot.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface px-4 py-8 text-sm text-muted">
              Nothing due in the next 10 days. Run the desk anyway — Sources Sought do not wait for a crisis.
            </p>
          ) : (
            <div className="grid gap-3">
              {stats.hot.slice(0, 4).map((o) => (
                <OppCard key={o.id} opp={o} company={company} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">The path</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Seven links. Skip one and the rest is theater.
          </p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                { n: "01", t: "Sensor net", d: "Exact, adjacent, and keyword searches — plus forecasts.", slug: "sensor-net" },
                { n: "02", t: "90-second desk", d: "Bucket every notice before it earns a meeting.", href: "/desk" as const },
                { n: "03", t: "Go / No-Go", d: "Eight factors. 3.8 to bid. Write the no-bid reason.", slug: "go-no-go" },
                { n: "04", t: "Capture", d: "Three themes, a customer map, a price-to-win band.", slug: "capture" },
                { n: "05", t: "Factory", d: "Compliance matrix, pink / red / gold, 24-hour-early submit.", slug: "proposal-factory" },
                { n: "06", t: "Silence", d: "Portal confirmation. No freelance emails to the KO.", slug: "submit-silence" },
                { n: "07", t: "Debrief", d: "Written request within three days. Repair the factory.", slug: "award-debrief" },
                { n: "08", t: "Cadence", d: "Daily desk. Friday pipeline. Monthly search audit.", slug: "cadence" },
              ] as const
            ).map((s) =>
              "slug" in s ? (
                <Link
                  key={s.n}
                  to="/playbook/$slug"
                  params={{ slug: s.slug }}
                  className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-elevated/50"
                >
                  <p className="font-mono text-xs text-accent">{s.n}</p>
                  <p className="mt-2 font-display text-lg text-fg">{s.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
                </Link>
              ) : (
                <Link
                  key={s.n}
                  to={s.href}
                  className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-elevated/50"
                >
                  <p className="font-mono text-xs text-accent">{s.n}</p>
                  <p className="mt-2 font-display text-lg text-fg">{s.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
                </Link>
              ),
            )}
          </ol>
        </section>

        <section className="mt-10 grid gap-3 md:grid-cols-3">
          <Quick to="/desk" icon={Inbox} t="Run the morning desk" d="90-second sort on every new NAICS ping." />
          <Quick to="/playbook" icon={BookOpen} t="Read the field manual" d={`${CHAPTERS.length} chapters. Checklists that persist.`} />
          <Quick to="/pipeline" icon={Scale} t="Review the board" d="Kill rotting CONDITIONAL. Enforce the bid cap." />
        </section>
      </div>
    </div>
  );
}

function Stat({
  k,
  v,
  hint,
  warn,
}: {
  k: string;
  v: number | string;
  hint: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4">
      <p className="text-xs uppercase tracking-wider text-subtle">{k}</p>
      <p className={`mt-1 font-display text-3xl tabular ${warn ? "text-hold" : "text-fg"}`}>{v}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Quick({
  to,
  icon: Icon,
  t,
  d,
}: {
  to: "/desk" | "/playbook" | "/pipeline";
  icon: typeof Inbox;
  t: string;
  d: string;
}) {
  return (
    <Link
      to={to}
      className="flex gap-3 rounded-xl border border-border bg-surface p-4 hover:border-border-strong"
    >
      <Icon className="mt-0.5 size-5 text-accent" />
      <div>
        <p className="font-medium text-fg">{t}</p>
        <p className="mt-1 text-sm text-muted">{d}</p>
      </div>
    </Link>
  );
}
