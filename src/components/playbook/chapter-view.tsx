import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { CHAPTERS } from "@/lib/playbook/content";
import { usePlaybook } from "@/lib/playbook/store";
import type { Block, Chapter } from "@/lib/playbook/types";
import { cn } from "@/lib/utils";

export function ChapterView({ chapter }: { chapter: Chapter }) {
  const idx = CHAPTERS.findIndex((c) => c.slug === chapter.slug);
  const prev = idx > 0 ? CHAPTERS[idx - 1] : undefined;
  const next = idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : undefined;

  return (
    <article className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-12">
      <Link
        to="/playbook"
        className="inline-flex h-11 items-center gap-2 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        All chapters
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-widest text-accent">
        Chapter {chapter.number} · {chapter.stageLabel}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight text-fg sm:text-5xl">
        {chapter.title}
      </h1>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted">
        <Clock className="size-3.5" />
        {chapter.minutes} min read
      </p>
      <p className="mt-4 text-lg leading-relaxed text-muted">{chapter.dek}</p>
      <div className="mt-10 space-y-8">
        {chapter.blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
      </div>
      <nav className="mt-14 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            to="/playbook/$slug"
            params={{ slug: prev.slug }}
            className="rounded-lg border border-border bg-surface p-4 hover:border-border-strong"
          >
            <p className="text-xs uppercase tracking-wider text-subtle">Previous</p>
            <p className="mt-1 flex items-center gap-2 font-display text-lg text-fg">
              <ArrowLeft className="size-4 text-subtle" />
              {prev.title}
            </p>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            to="/playbook/$slug"
            params={{ slug: next.slug }}
            className="rounded-lg border border-border bg-surface p-4 text-right hover:border-border-strong"
          >
            <p className="text-xs uppercase tracking-wider text-subtle">Next</p>
            <p className="mt-1 flex items-center justify-end gap-2 font-display text-lg text-fg">
              {next.title}
              <ArrowRight className="size-4 text-subtle" />
            </p>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return <p className="text-base leading-relaxed text-fg/90">{block.text}</p>;
    case "quote":
      return (
        <blockquote className="border-l-2 border-accent/50 pl-5 font-display text-xl leading-snug tracking-tight text-paper">
          {block.text}
        </blockquote>
      );
    case "rule":
      return (
        <aside className="rounded-lg border border-accent/25 bg-accent/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Standing rule</p>
          <p className="mt-1 font-display text-lg text-fg">{block.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{block.text}</p>
        </aside>
      );
    case "watch":
      return (
        <aside className="rounded-lg border border-hold/30 bg-hold/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-hold">Watch</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{block.text}</p>
        </aside>
      );
    case "steps":
      return (
        <ol className="space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm bg-elevated font-mono text-xs text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-relaxed text-fg/90">{item}</span>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-elevated text-xs uppercase tracking-wider text-subtle">
              <tr>
                {block.headers.map((h) => (
                  <th key={h} className="px-3 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2.5 align-top text-muted">
                      <span className={j === 0 ? "text-fg" : undefined}>{cell}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "checks":
      return <CheckList id={block.id} items={block.items} />;
    default:
      return null;
  }
}

function CheckList({
  id,
  items,
}: {
  id: string;
  items: { id: string; text: string }[];
}) {
  const checks = usePlaybook((s) => s.checks);
  const toggle = usePlaybook((s) => s.togglePlaybookCheck);
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {items.map((item) => {
        const key = `${id}:${item.id}`;
        const on = !!checks[key];
        return (
          <li key={item.id}>
            <label className="flex min-h-12 cursor-pointer items-start gap-3 px-3 py-3">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-accent"
                checked={on}
                onChange={() => toggle(key)}
              />
              <span className={cn("text-sm leading-snug", on ? "text-muted" : "text-fg")}>
                {item.text}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
