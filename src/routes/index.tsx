import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  addWatchlistItem,
  fetchOpportunities,
  fetchSyncMeta,
  fetchWatchlist,
  removeWatchlistItem,
  runSyncNow,
} from "@/lib/opportunities/server-store";
import { NAICS_CODES } from "@/lib/opportunities/naics-codes";
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

function naicsTitle(code: string, watchlist: WatchlistItem[]): string {
  const found = watchlist.find((w) => w.value === code);
  return found?.label || code;
}

function matchesCategory(o: Opportunity, filter: string): boolean {
  if (filter === "all") return true;
  return o.naics === filter;
}

/** Soonest deadline first; no-deadline notices last. Past-deadline notices
 * never reach this — they're filtered out before rendering. */
function openSortKey(o: Opportunity): number {
  const days = daysUntil(o.responseDate);
  return days === null ? Infinity : days;
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
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const addMutation = useMutation({
    mutationFn: (value: string) => addWatchlistItem({ data: { value } }),
    onSuccess: () => {
      setPickerOpen(false);
      invalidateAll();
    },
    onError: () => toast.error("Couldn't add that NAICS code."),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeWatchlistItem({ data: { id } }),
    onSuccess: invalidateAll,
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't remove that."),
  });

  const syncMutation = useMutation({
    mutationFn: () => runSyncNow(),
    onSuccess: (result) => {
      invalidateAll();
      toast.success(`Synced — ${result.matched} matched, ${result.open} open, ${result.awarded} awarded.`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Sync failed."),
  });

  // Drop open notices whose deadline already passed — SAM.gov's "Active"
  // flag doesn't mean the response window is still open, and a stale
  // "Closed" card isn't useful on a bid list.
  const opportunities = (opportunitiesQuery.data ?? []).filter((o) => {
    if (o.status !== "open") return true;
    const days = daysUntil(o.responseDate);
    return days === null || days >= 0;
  });
  const watchlist = watchlistQuery.data ?? [];
  const watchedCodes = new Set(watchlist.map((w) => w.value));
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
          <div>
            <h2 className="font-display text-lg text-fg">Watching</h2>
            <p className="mt-0.5 text-xs text-muted">NAICS codes currently searched, and what each one covers.</p>
          </div>
          <Button size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? "Running…" : "Run search now"}
          </Button>
        </div>

        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {watchlist.length === 0 ? (
            <li className="px-3 py-4 text-sm italic text-subtle">No NAICS codes yet</li>
          ) : (
            watchlist.map((w) => (
              <li key={w.id} className="flex items-center gap-3 bg-elevated/40 px-3 py-2.5">
                <span className="shrink-0 font-mono text-xs tabular text-accent">{w.value}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{w.label ?? w.value}</span>
                {w.locked ? (
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-subtle">Default</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(w.id)}
                    aria-label={`Remove ${w.value}`}
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-subtle hover:bg-nogo/15 hover:text-nogo"
                  >
                    ×
                  </button>
                )}
              </li>
            ))
          )}
        </ul>

        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mt-3">
              + Add NAICS code
            </Button>
          </DialogTrigger>
          <DialogContent title="Add a NAICS code" className="max-h-[80dvh] overflow-hidden p-0">
            <NaicsPicker watchedCodes={watchedCodes} onSelect={(code) => addMutation.mutate(code)} />
          </DialogContent>
        </Dialog>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="Open to bid" value={statOpen} active={activeStat === "open"} onClick={() => setActiveStat(activeStat === "open" ? null : "open")} />
        <StatTile label="Due ≤ 3 days" value={statDue3} tone="nogo" active={activeStat === "due3"} onClick={() => setActiveStat(activeStat === "due3" ? null : "due3")} />
        <StatTile label="Due this week" value={statDue7} tone="hold" active={activeStat === "due7"} onClick={() => setActiveStat(activeStat === "due7" ? null : "due7")} />
        <StatTile label="Recently awarded" value={statAwarded} active={activeStat === "awarded"} onClick={() => setActiveStat(activeStat === "awarded" ? null : "awarded")} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip label="All categories" active={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
        {watchlist.map((w) => (
          <FilterChip key={w.id} label={w.label || w.value} active={activeFilter === w.value} onClick={() => setActiveFilter(w.value)} />
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

function NaicsPicker({
  watchedCodes,
  onSelect,
}: {
  watchedCodes: Set<string>;
  onSelect: (code: string) => void;
}) {
  return (
    <CommandPrimitive className="flex max-h-[70dvh] flex-col" label="NAICS codes">
      <CommandPrimitive.Input
        autoFocus
        placeholder="Search by code or title…"
        className="h-12 w-full border-b border-border bg-transparent px-4 text-sm text-fg outline-none placeholder:text-subtle"
      />
      <CommandPrimitive.List className="flex-1 overflow-y-auto p-2 desk-scroll">
        <CommandPrimitive.Empty className="px-3 py-6 text-center text-sm text-subtle">
          No matching NAICS code.
        </CommandPrimitive.Empty>
        {NAICS_CODES.map((n) => {
          const already = watchedCodes.has(n.code);
          return (
            <CommandPrimitive.Item
              key={n.code}
              value={`${n.code} ${n.title}`}
              disabled={already}
              onSelect={() => !already && onSelect(n.code)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm",
                "data-[selected=true]:bg-elevated",
                already && "cursor-default opacity-40",
              )}
            >
              <span className="shrink-0 font-mono text-xs tabular text-accent">{n.code}</span>
              <span className="min-w-0 flex-1 truncate text-fg">{n.title}</span>
              {already ? <span className="shrink-0 text-[10px] uppercase text-subtle">Added</span> : null}
            </CommandPrimitive.Item>
          );
        })}
      </CommandPrimitive.List>
    </CommandPrimitive>
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
  const categoryLabel = o.naics ? naicsTitle(o.naics, watchlist) : "General";

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
          <Badge tone="accent">{categoryLabel}</Badge>
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
