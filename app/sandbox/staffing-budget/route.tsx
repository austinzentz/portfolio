import { useMemo } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/route";
import type { RouteHandle } from "~/root";
import { title } from "~/lib/site";
import { useLocalState } from "../use-local-state";
import { cost, FUNDS, isPlan, SEED, type Fund, type Position } from "./data";

export const meta: Route.MetaFunction = () => [
  { title: title("Staffing budget planner", "Sandbox") },
  { name: "description", content: "A small demo: plan school positions and funding sources, with fictional data." },
];

export const handle = { layout: "wide" } satisfies RouteHandle;

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const cell =
  "w-full rounded border border-transparent bg-transparent px-1.5 py-1 hover:border-rule focus:border-accent focus:bg-bg focus:outline-none";

export default function StaffingBudget() {
  const [plan, setPlan, reset] = useLocalState("sandbox:staffing-budget:v1", SEED, isPlan);

  const totals = useMemo(() => {
    const byFund = Object.fromEntries(FUNDS.map((f) => [f, 0])) as Record<Fund, number>;
    let fte = 0;
    for (const pos of plan.positions) {
      byFund[pos.fund] += cost(pos, plan.benefitsRate);
      fte += pos.fte;
    }
    const total = Object.values(byFund).reduce((a, b) => a + b, 0);
    const available = Object.values(plan.available).reduce((a, b) => a + b, 0);
    return { byFund, fte, total, available };
  }, [plan]);

  const update = (id: string, patch: Partial<Position>) =>
    setPlan((p) => ({ ...p, positions: p.positions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const remove = (id: string) => setPlan((p) => ({ ...p, positions: p.positions.filter((x) => x.id !== id) }));
  const add = () =>
    setPlan((p) => ({
      ...p,
      positions: [
        ...p.positions,
        { id: crypto.randomUUID(), title: "New position", site: "Maple Elementary", fte: 1, salary: 60_000, fund: "General" },
      ],
    }));

  const remaining = totals.available - totals.total;

  return (
    <div className="font-sans">
      <p className="text-sm">
        <Link to="/sandbox" className="text-muted hover:text-fg">
          ← Sandbox
        </Link>
      </p>
      <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight">Staffing budget planner</h1>
      <p className="mt-3 max-w-[42rem] text-muted">
        Next year's positions at a made-up elementary school. Edit any cell, add or remove positions, and the funding picture
        updates. Your changes are saved in this browser only.
      </p>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
      {/* Summary: above the table on small screens, a sticky side panel on wide ones. */}
      <aside className="lg:sticky lg:top-6 lg:order-last lg:self-start">
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-rule bg-rule lg:grid-cols-1">
        {[
          ["Total cost", usd(totals.total)],
          ["Staff FTE", totals.fte.toLocaleString("en-US", { maximumFractionDigits: 1 })],
          [remaining < 0 ? "Over budget" : "Remaining", usd(Math.abs(remaining))],
        ].map(([label, value], i) => (
          <div key={label} className="bg-bg px-3 py-3 sm:px-4">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className={`mt-1 text-base font-medium tabular-nums sm:text-lg ${i === 2 && remaining < 0 ? "text-[#b3261e] dark:text-[#f2b8b5]" : ""}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-8 lg:mt-6" aria-label="Funding sources">
        <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted">By funding source</h2>
        <ul className="mt-3 space-y-3">
          {FUNDS.map((f) => {
            const used = totals.byFund[f];
            const avail = plan.available[f];
            const pct = avail > 0 ? used / avail : used > 0 ? 2 : 0;
            const over = used > avail;
            return (
              <li key={f} className="text-sm">
                <div className="flex justify-between gap-3 tabular-nums">
                  <span>{f}</span>
                  <span className={over ? "text-[#b3261e] dark:text-[#f2b8b5]" : "text-muted"}>
                    {usd(used)} of {usd(avail)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full ${over ? "bg-[#b3261e] dark:bg-[#f2b8b5]" : "bg-accent"}`}
                    style={{ width: `${Math.min(pct, 1) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <label className="mt-4 flex items-center gap-2 text-sm text-muted">
          Benefits rate
          <input
            type="number"
            min={0}
            max={60}
            step={1}
            value={Math.round(plan.benefitsRate * 100)}
            onChange={(e) => setPlan((p) => ({ ...p, benefitsRate: Math.max(0, Number(e.target.value) || 0) / 100 }))}
            className="w-16 rounded border border-rule bg-bg px-2 py-1 text-fg tabular-nums"
          />
          % of salary
        </label>
      </section>
      </aside>

      <section aria-label="Positions">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted">Positions</h2>
          <button type="button" onClick={reset} className="text-sm text-muted hover:text-fg">
            Reset demo
          </button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-md border border-rule">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Position</th>
                <th className="w-40 px-3 py-2 font-medium">Site</th>
                <th className="w-16 px-3 py-2 font-medium">FTE</th>
                <th className="w-28 px-3 py-2 font-medium">Salary</th>
                <th className="w-28 px-3 py-2 font-medium">Fund</th>
                <th className="w-24 px-3 py-2 text-right font-medium">Cost</th>
                <th className="w-8" aria-label="Remove" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {plan.positions.map((pos) => (
                <tr key={pos.id}>
                  <td className="px-1.5 py-1">
                    <input aria-label="Position title" className={cell} value={pos.title} onChange={(e) => update(pos.id, { title: e.target.value })} />
                  </td>
                  <td className="px-1.5 py-1">
                    <input aria-label="Site" className={cell} value={pos.site} onChange={(e) => update(pos.id, { site: e.target.value })} />
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      aria-label="FTE"
                      type="number"
                      min={0}
                      step={0.1}
                      className={`${cell} tabular-nums`}
                      value={pos.fte}
                      onChange={(e) => update(pos.id, { fte: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      aria-label="Salary"
                      type="number"
                      min={0}
                      step={500}
                      className={`${cell} tabular-nums`}
                      value={pos.salary}
                      onChange={(e) => update(pos.id, { salary: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <select aria-label="Fund" className={cell} value={pos.fund} onChange={(e) => update(pos.id, { fund: e.target.value as Fund })}>
                      {FUNDS.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums">{usd(cost(pos, plan.benefitsRate))}</td>
                  <td className="px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => remove(pos.id)}
                      aria-label={`Remove ${pos.title}`}
                      className="rounded px-1.5 text-muted hover:text-fg"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={add} className="mt-3 text-sm text-accent hover:underline">
          + Add position
        </button>
      </section>
      </div>
    </div>
  );
}
