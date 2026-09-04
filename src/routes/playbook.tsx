import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/app-shell";
import { CHAPTERS, RULES } from "@/lib/playbook/content";
import { usePlaybook } from "@/lib/playbook/store";

export const Route = createFileRoute("/playbook")({ component: PlaybookIndex });

function PlaybookIndex() {
  const checks = usePlaybook((s) => s.checks);
  const done = Object.values(checks).filter(Boolean).length;

  return (
    <div>
      <PageHeader
        kicker="Field manual"
        title="Playbook"
        dek="Ten chapters from sensor net to CPARS. Written for a SAM.gov-registered firm that already runs daily NAICS searches and needs a conversion system, not another alert."
      />
      <div className="px-4 py-6 sm:px-8">
        <p className="text-sm text-muted">
          {done} checklist items marked across the manual. They live in this browser.
        </p>
        <ol className="mt-6 grid gap-3">
          {CHAPTERS.map((c) => (
            <li key={c.slug}>
              <Link
                to="/playbook/$slug"
                params={{ slug: c.slug }}
                className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:gap-6"
              >
                <span className="font-mono text-sm text-accent">{c.number}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl tracking-tight text-fg">{c.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{c.dek}</p>
                </div>
                <div className="text-xs uppercase tracking-wider text-subtle sm:text-right">
                  <div>{c.stageLabel}</div>
                  <div className="mt-1">{c.minutes} min</div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">Seven standing rules</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {RULES.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-surface p-4">
                <p className="font-mono text-xs text-accent">{r.id}</p>
                <p className="mt-1 font-display text-lg text-fg">{r.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{r.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
