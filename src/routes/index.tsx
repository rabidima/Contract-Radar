import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  addWatchlistItem,
  fetchOpportunities,
  fetchSyncMeta,
  fetchWatchlist,
  removeWatchlistItem,
  runSyncNow,
} from "@/lib/opportunities/server-store";
import type { Opportunity, WatchlistItem } from "@/lib/opportunities/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: ContractRadar });

const STAT_FILTERS = ["open", "due3", "due7", "awarded"] as const;
type StatFilter = (typeof STAT_FILTERS)[number];

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function naicsLabel(code: string, watchlist: WatchlistItem[]): string {
  const found = watchlist.find((w) => w.type === "naics" && w.value === code);
  return found?.label || code;
}

function categoryLabel(o: Opportunity, watchlist: WatchlistItem[]): string {
  if (o.naics) return naicsLabel(o.naics, watchlist);
  if (o.matchedKeyword) return `"${o.matchedKeyword}"`;
  return "General";
}

function matchesCategory(o: Opportunity, filter: string): boolean {
  if (filter === "all") return true;
  if (filter.startsWith("naics:")) return o.naics === filter.slice(6);
  if (filter.startsWith("kw:")) return o.matchedKeyword === filter.slice(3);
  return true;
}

/** Sorts still-actionable notices soonest-deadline-first at the top; a
 * notice whose deadline already passed (SAM.gov's "Active" flag doesn't
 * mean the response window is still open) sinks below all of those, most
 * recently closed first, with no-deadline notices last of all. */
function openSortKey(o: Opportunity): number {
  const days = daysUntil(o.responseDate);
  if (days === null) return Infinity;
  // Same calendar-day rounding as the "Due today" / "Closed" label below,
  // so a card never sorts into the closed bucket while still reading as
  // due today (or vice versa).
  return days >= 0 ? days : 1e6 - days;
}

function matchesStat(o: Opportunity, stat: StatFilter | null): boolean {
  if (!stat) return true;
  if (stat === "open") return o.status === "open";
  if (stat === "awarded") return o.status === "awarded";
  if (o.status !== "open") return false;
  const days = daysUntil(o.responseDate);
  if (days === null) return false;
  if (stat === "due3") return days >= 0 && days <= 3;
  if (stat === "due7") return days > 3 && days <= 7;
  return true;
}

function ContractRadar() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeStat, setActiveStat] = useState<StatFilter | null>(null);
  const [naicsCode, setNaicsCode] = useState("");
  const [naicsLabelInput, setNaicsLabelInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const opportunitiesQuery = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => fetchOpportunities(),
  });
  const watchlistQuery = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => fetchWatchlist(),
  });
  const syncMetaQuery = useQuery({
    queryKey: ["syncMeta"],
    queryFn: () => fetchSyncMeta(),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    void queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    void queryClient.invalidateQueries({ queryKey: ["syncMeta"] });
  };

  const addNaicsMutation = useMutation({
    mutationFn: () =>
      addWatchlistItem({ data: { type: "naics", value: naicsCode.trim(), label: naicsLabelInput.trim() || undefined } }),
    onSuccess: () => {
      setNaicsCode("");
      setNaicsLabelInput("");
      invalidateAll();
    },
    onError: () => toast.error("Couldn't add that NAICS code."),
  });

  const addKeywordMutation = useMutation({
    mutationFn: () => addWatchlistItem({ data: { type: "keyword", value: keywordInput.trim() } }),
    onSuccess: () => {
      setKeywordInput("");
      invalidateAll();
    },
    onError: () => toast.error("Couldn't add that keyword."),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeWatchlistItem({ data: { id } }),
    onSuccess: invalidateAll,
    onError: () => toast.error("Couldn't remove that."),
  });

  const syncMutation = useMutation({
    mutationFn: () => runSyncNow(),
    onSuccess: (result) => {
      invalidateAll();
      toast.success(`Synced — ${result.matched} matched, ${result.open} open, ${result.awarded} awarded.`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Sync failed."),
  });

  function submitNaics(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{2,6}$/.test(naicsCode.trim())) {
      toast.error("NAICS code should be 2-6 digits.");
      return;
    }
    addNaicsMutation.mutate();
  }

  function submitKeyword(e: FormEvent) {
    e.preventDefault();
    if (!keywordInput.trim()) return;
    addKeywordMutation.mutate();
  }

  const opportunities = opportunitiesQuery.data ?? [];
  const watchlist = watchlistQuery.data ?? [];
  const naicsItems = watchlist.filter((w) => w.type === "naics");
  const keywordItems = watchlist.filter((w) => w.type === "keyword");
  const syncMeta = syncMetaQuery.data;

  const naicsFiltered = opportunities.filter((o) => matchesCategory(o, activeFilter));
  const filtered = naicsFiltered.filter((o) => matchesStat(o, activeStat));
  const open = filtered
    .filter((o) => o.status === "open")
    .sort((a, b) => openSortKey(a) - openSortKey(b));
  const awarded = filtered
    .filter((o) => o.status === "awarded")
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  const allOpen = naicsFiltered.filter((o) => o.status === "open");
  const statOpen = allOpen.length;
  const statDue3 = allOpen.filter((o) => {
    const d = daysUntil(o.responseDate);
    return d !== null && d >= 0 && d <= 3;
  }).length;
  const statDue7 = allOpen.filter((o) => {
    const d = daysUntil(o.responseDate);
    return d !== null && d > 3 && d <= 7;
  }).length;
  const statAwarded = naicsFiltered.filter((o) => o.status === "awarded").length;

  const showOpenSection = activeStat !== "awarded";
  const showAwardedSection = activeStat !== "open" && activeStat !== "due3" && activeStat !== "due7";

  const lastSynced = syncMeta?.lastSyncedAt ? new Date(syncMeta.lastSyncedAt) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl tracking-tight text-fg">Contract Radar</h1>
        <span className="font-mono text-xs tabular text-subtle">
          {syncMutation.isPending
            ? "syncing…"
            : lastSynced
              ? `last synced ${lastSynced.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${lastSynced.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
              : "never synced"}
        </span>
      </header>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">
        48HourDigital&apos;s watch list of federal contract opportunities on{" "}
        <a href="https://sam.gov/search/?index=opp" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          SAM.gov
        </a>
        .
      </p>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg text-fg">Watching</h2>
          <Button size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? "Running…" : "Run search now"}
          </Button>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">NAICS codes</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {naicsItems.length === 0 ? (
              <span className="text-sm italic text-subtle">No NAICS codes yet</span>
            ) : (
              naicsItems.map((n) => (
                <WatchTag key={n.id} text={n.label ? `${n.label} (${n.value})` : n.value} onRemove={() => removeMutation.mutate(n.id)} />
              ))
            )}
          </div>
          <form onSubmit={submitNaics} className="mt-2.5 flex flex-wrap gap-2">
            <Input
              value={naicsCode}
              onChange={(e) => setNaicsCode(e.target.value)}
              placeholder="Code, e.g. 541511"
              className="w-40"
              inputMode="numeric"
              maxLength={6}
            />
            <Input
              value={naicsLabelInput}
              onChange={(e) => setNaicsLabelInput(e.target.value)}
              placeholder="Label (optional)"
              className="w-48"
            />
            <Button type="submit" variant="outline" size="sm" disabled={addNaicsMutation.isPending}>
              Add code
            </Button>
          </form>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Keywords</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {keywordItems.length === 0 ? (
              <span className="text-sm italic text-subtle">No keywords yet</span>
            ) : (
              keywordItems.map((k) => (
                <WatchTag key={k.id} text={k.value} onRemove={() => removeMutation.mutate(k.id)} />
              ))
            )}
          </div>
          <form onSubmit={submitKeyword} className="mt-2.5 flex flex-wrap gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="e.g. website redesign"
              className="w-64"
            />
            <Button type="submit" variant="outline" size="sm" disabled={addKeywordMutation.isPending}>
              Add keyword
            </Button>
          </form>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="Open to bid" value={statOpen} active={activeStat === "open"} onClick={() => setActiveStat(activeStat === "open" ? null : "open")} />
        <StatTile label="Due ≤ 3 days" value={statDue3} tone="nogo" active={activeStat === "due3"} onClick={() => setActiveStat(activeStat === "due3" ? null : "due3")} />
        <StatTile label="Due this week" value={statDue7} tone="hold" active={activeStat === "due7"} onClick={() => setActiveStat(activeStat === "due7" ? null : "due7")} />
        <StatTile label="Recently awarded" value={statAwarded} active={activeStat === "awarded"} onClick={() => setActiveStat(activeStat === "awarded" ? null : "awarded")} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip label="All categories" active={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
        {naicsItems.map((n) => (
          <FilterChip key={n.id} label={n.label || n.value} active={activeFilter === `naics:${n.value}`} onClick={() => setActiveFilter(`naics:${n.value}`)} />
        ))}
        {keywordItems.map((k) => (
          <FilterChip key={k.id} label={`"${k.value}"`} active={activeFilter === `kw:${k.value}`} onClick={() => setActiveFilter(`kw:${k.value}`)} />
        ))}
      </div>

      {opportunitiesQuery.isLoading ? (
        <p className="mt-8 text-sm text-subtle">Loading…</p>
      ) : (
        <>
          {showOpenSection && (
            <section className="mt-8">
              <h2 className="font-display text-lg text-fg">Open — respond by</h2>
              <p className="mt-1 text-xs text-muted">Live solicitations you can still bid on, soonest deadline first.</p>
              <div className="mt-3 flex flex-col gap-2.5">
                {open.length === 0 ? (
                  <EmptyState text="No open opportunities match this filter." />
                ) : (
                  open.map((o) => <OpportunityCard key={o.id} o={o} watchlist={watchlist} />)
                )}
              </div>
            </section>
          )}

          {showAwardedSection && (
            <section className="mt-8">
              <h2 className="font-display text-lg text-fg">Recently awarded</h2>
              <p className="mt-1 text-xs text-muted">Market intel — who&apos;s winning similar work.</p>
              <div className="mt-3 flex flex-col gap-2.5">
                {awarded.length === 0 ? (
                  <EmptyState text="No recent awards match this filter." />
                ) : (
                  awarded.map((o) => <OpportunityCard key={o.id} o={o} watchlist={watchlist} />)
                )}
              </div>
            </section>
          )}
        </>
      )}

      <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-border pt-4 text-xs text-subtle">
        <span>Contract Radar · SAM.gov</span>
        <span>{filtered.length} of {opportunities.length} tracked notices</span>
      </footer>
    </div>
  );
}

function WatchTag({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-elevated py-1 pl-3 pr-1 text-xs text-fg">
      {text}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="rounded-full px-1.5 py-0.5 text-subtle hover:bg-nogo/15 hover:text-nogo"
      >
        ×
      </button>
    </span>
  );
}

function StatTile({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "nogo" | "hold";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-surface p-3.5 text-left transition-colors",
        active ? "border-accent bg-accent/10" : "border-border hover:border-border-strong",
      )}
    >
      <div className={cn("font-mono text-xl tabular", tone === "nogo" ? "text-nogo" : tone === "hold" ? "text-hold" : "text-fg")}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-subtle">{label}</div>
    </button>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-accent bg-accent/15 text-accent" : "border-border text-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong px-4 py-10 text-center text-sm text-subtle">
      {text}
    </div>
  );
}

function OpportunityCard({ o, watchlist }: { o: Opportunity; watchlist: WatchlistItem[] }) {
  const days = o.status === "open" ? daysUntil(o.responseDate) : null;
  let stripe: "nogo" | "hold" | "mute" = "mute";
  let deadlineLabel = "No deadline listed";
  let deadlineSub = "";

  if (o.status === "open") {
    if (days === null) {
      deadlineLabel = "See notice";
      deadlineSub = "no deadline listed";
    } else if (days < 0) {
      stripe = "nogo";
      deadlineLabel = "Closed";
      deadlineSub = fmtDate(o.responseDate) ?? "";
    } else if (days === 0) {
      stripe = "nogo";
      deadlineLabel = "Due today";
      deadlineSub = fmtDate(o.responseDate) ?? "";
    } else if (days <= 3) {
      stripe = "nogo";
      deadlineLabel = `Due in ${days}d`;
      deadlineSub = fmtDate(o.responseDate) ?? "";
    } else if (days <= 7) {
      stripe = "hold";
      deadlineLabel = `Due in ${days}d`;
      deadlineSub = fmtDate(o.responseDate) ?? "";
    } else {
      deadlineLabel = fmtDate(o.responseDate) ?? "";
      deadlineSub = `${days}d left`;
    }
  } else {
    deadlineLabel = fmtDate(o.publishDate) ?? "";
    deadlineSub = "awarded";
  }

  const stripeColor = stripe === "nogo" ? "bg-nogo" : stripe === "hold" ? "bg-hold" : "bg-border-strong";

  return (
    <a
      href={o.link}
      target="_blank"
      rel="noopener noreferrer"
      className="grid grid-cols-[4px_1fr_auto] overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <div className={stripeColor} />
      <div className="min-w-0 p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="accent">{categoryLabel(o, watchlist)}</Badge>
          <Badge>{o.noticeType}</Badge>
          {o.setAside ? <Badge tone="go">{o.setAside}</Badge> : null}
        </div>
        <p className="mt-2 font-medium leading-snug text-fg">{o.title}</p>
        <p className="mt-1 text-xs text-muted">
          {[o.dept, o.office, o.awardee ? `awarded to ${o.awardee}` : null].filter(Boolean).join(" · ")}
          {o.solicitationNumber ? <span className="ml-1.5 font-mono text-[11px]">{o.solicitationNumber}</span> : null}
        </p>
      </div>
      <div className="flex flex-col items-end justify-center gap-0.5 p-3.5 font-mono">
        <span className={cn("text-sm", stripe === "nogo" ? "text-nogo" : stripe === "hold" ? "text-hold" : "text-fg")}>
          {deadlineLabel}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-subtle">{deadlineSub}</span>
      </div>
    </a>
  );
}
