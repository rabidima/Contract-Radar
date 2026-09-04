import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Building2, Inbox, LayoutDashboard, Rows3 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Command", icon: LayoutDashboard },
  { to: "/desk", label: "Daily Desk", icon: Inbox },
  { to: "/pipeline", label: "Pipeline", icon: Rows3 },
  { to: "/playbook", label: "Playbook", icon: BookOpen },
  { to: "/company", label: "Company", icon: Building2 },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-surface md:flex">
        <Link to="/" className="flex items-center gap-3 px-5 py-6">
          <Monogram />
          <div>
            <div className="font-display text-lg leading-none tracking-tight text-fg">
              Contract Radar
            </div>
            <div className="mt-1 text-xs text-subtle">NAICS to award</div>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                  active
                    ? "bg-elevated text-fg"
                    : "text-muted hover:bg-elevated/60 hover:text-fg",
                )}
              >
                <item.icon className={cn("size-4", active ? "text-accent" : "text-subtle")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="px-5 py-4 text-xs leading-relaxed text-subtle">
          Field manual for SAM.gov contractors already on contract.
        </p>
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <Monogram />
        <div className="min-w-0">
          <div className="font-display text-base leading-none">Contract Radar</div>
          <div className="mt-0.5 truncate text-xs text-subtle">From daily NAICS alerts to award</div>
        </div>
      </header>

      <main
        id="main"
        className="md:pl-56 pb-24 md:pb-0"
      >
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active = isActive(pathname, item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                    active ? "text-fg" : "text-subtle",
                  )}
                >
                  <item.icon className={cn("size-5", active ? "text-accent" : "text-subtle")} />
                  {item.label.split(" ")[0]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function Monogram({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-elevated font-display text-sm tracking-tight text-paper",
        className,
      )}
      aria-hidden
    >
      CR
    </span>
  );
}

export function PageHeader({
  kicker,
  title,
  dek,
  actions,
}: {
  kicker?: string;
  title: string;
  dek?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8">
      <div className="max-w-2xl">
        {kicker ? (
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">{kicker}</p>
        ) : null}
        <h1 className="font-display text-3xl leading-tight tracking-tight text-fg sm:text-4xl">
          {title}
        </h1>
        {dek ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{dek}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
