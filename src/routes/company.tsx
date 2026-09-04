import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { adjacentTo, NAICS, naicsSize } from "@/lib/playbook/naics";
import { usePlaybook } from "@/lib/playbook/store";
import { CERT_LABEL, CERTS, VEHICLES } from "@/lib/playbook/types";
import { cn, formatFullCurrency } from "@/lib/utils";

export const Route = createFileRoute("/company")({ component: CompanyPage });

function CompanyPage() {
  const company = usePlaybook((s) => s.company);
  const setCompany = usePlaybook((s) => s.setCompany);
  const toggleCert = usePlaybook((s) => s.toggleCert);
  const toggleVehicle = usePlaybook((s) => s.toggleVehicle);
  const toggleNaics = usePlaybook((s) => s.toggleNaics);
  const adj = adjacentTo(company.naics);

  return (
    <div>
      <PageHeader
        kicker="Posture"
        title="Company"
        dek="Eligibility, NAICS cluster, and bid economics. The Daily Desk reads this file before it recommends a bucket. Size standards are a working copy — recertify against the solicitation."
      />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" htmlFor="name">
            <Input
              id="name"
              value={company.name}
              placeholder="Registered legal name"
              onChange={(e) => setCompany({ name: e.target.value })}
            />
          </Field>
          <Field label="UEI" htmlFor="uei">
            <Input
              id="uei"
              className="font-mono"
              value={company.uei}
              placeholder="12-character UEI"
              onChange={(e) => setCompany({ uei: e.target.value })}
            />
          </Field>
          <Field label="CAGE" htmlFor="cage">
            <Input
              id="cage"
              className="font-mono"
              value={company.cage}
              placeholder="CAGE"
              onChange={(e) => setCompany({ cage: e.target.value })}
            />
          </Field>
          <Field label="Footprint" htmlFor="foot">
            <Input
              id="foot"
              value={company.footprint}
              placeholder="CONUS, remote-capable"
              onChange={(e) => setCompany({ footprint: e.target.value })}
            />
          </Field>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">Set-asides you can hold</h2>
          <p className="mt-1 text-sm text-muted">
            Total small business is assumed if any small-program cert is on. Do not self-certify a status you have not been awarded.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CERTS.map((c) => {
              const on = company.certs.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCert(c)}
                  className={cn(
                    "h-11 rounded-full border px-4 text-sm",
                    on ? "border-go/40 bg-go/15 text-go" : "border-border text-muted hover:text-fg",
                  )}
                >
                  {CERT_LABEL[c]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">Vehicles</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {VEHICLES.map((v) => {
              const on = company.vehicles.includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVehicle(v)}
                  className={cn(
                    "h-11 rounded-full border px-4 text-sm",
                    on ? "border-accent/40 bg-accent/15 text-accent" : "border-border text-muted hover:text-fg",
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">NAICS cluster</h2>
          <p className="mt-1 text-sm text-muted">
            Primary codes you perform. Adjacent codes are auto-suggested for Layer B searches. Current SBA receipts/employee caps shown — verify on sba.gov before a size certification. A 2026 SBA proposal would raise many of these dramatically; the solicitation still controls.
          </p>
          <div className="mt-4 grid gap-2">
            {NAICS.map((n) => {
              const on = company.naics.includes(n.code);
              const isAdj = adj.includes(n.code);
              return (
                <button
                  key={n.code}
                  type="button"
                  onClick={() => toggleNaics(n.code)}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 text-left",
                    on
                      ? "border-go/40 bg-go/10"
                      : isAdj
                        ? "border-hold/25 bg-hold/10"
                        : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="w-16 shrink-0 font-mono text-sm text-accent">{n.code}</span>
                  <span className="min-w-0 flex-1 text-sm text-fg">{n.title}</span>
                  <span className="shrink-0 text-xs tabular text-subtle">{naicsSize(n.code)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">Bid economics</h2>
          <p className="mt-1 text-sm text-muted">
            Fully loaded cost of a serious proposal, minimum contract worth that cost, and how many GOs you can run without wrecking delivery.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Typical proposal cost (USD)" htmlFor="bidcost">
              <Input
                id="bidcost"
                inputMode="numeric"
                value={company.typicalBidCost}
                onChange={(e) => setCompany({ typicalBidCost: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Minimum contract value (USD)" htmlFor="minc">
              <Input
                id="minc"
                inputMode="numeric"
                value={company.minContract}
                onChange={(e) => setCompany({ minContract: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Max concurrent GO bids" htmlFor="maxb">
              <Input
                id="maxb"
                inputMode="numeric"
                value={company.maxConcurrentBids}
                onChange={(e) => setCompany({ maxConcurrentBids: Number(e.target.value) || 1 })}
              />
            </Field>
            <Field label="Target Pwin on GOs" htmlFor="pwin">
              <Input
                id="pwin"
                inputMode="decimal"
                value={company.targetPwin}
                onChange={(e) => setCompany({ targetPwin: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>
          <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
            A {formatFullCurrency(company.typicalBidCost)} proposal should be chasing work whose expected value (Pwin × ceiling) clears 3×, about{" "}
            {formatFullCurrency(company.typicalBidCost * 3)}. Below your {formatFullCurrency(company.minContract)} floor, the desk will recommend Pass unless it is a named account.
          </p>
          <Button className="mt-6" onClick={() => setCompany({ setupComplete: true })}>
            Save posture
          </Button>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
