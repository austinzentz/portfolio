// Entirely fictional. Not based on any real organization's data.
export const FUNDS = ["General", "Title I", "IDEA", "Grant"] as const;
export type Fund = (typeof FUNDS)[number];

export type Position = {
  id: string;
  title: string;
  site: string;
  fte: number;
  salary: number;
  fund: Fund;
};

export type Plan = {
  version: 1;
  benefitsRate: number;
  available: Record<Fund, number>;
  positions: Position[];
};

let n = 0;
const p = (title: string, site: string, fte: number, salary: number, fund: Fund): Position => ({
  id: `seed-${++n}`,
  title,
  site,
  fte,
  salary,
  fund,
});

export const SEED: Plan = {
  version: 1,
  benefitsRate: 0.28,
  available: { General: 1_000_000, "Title I": 240_000, IDEA: 160_000, Grant: 90_000 },
  positions: [
    p("Principal", "Maple Elementary", 1, 138_000, "General"),
    p("Assistant Principal", "Maple Elementary", 1, 112_000, "General"),
    p("Kindergarten Teacher", "Maple Elementary", 2, 68_500, "General"),
    p("Grade 1 Teacher", "Maple Elementary", 2, 70_200, "General"),
    p("Grade 2 Teacher", "Maple Elementary", 2, 71_800, "General"),
    p("Reading Interventionist", "Maple Elementary", 1, 74_000, "Title I"),
    p("Math Interventionist", "Maple Elementary", 0.5, 74_000, "Title I"),
    p("Special Education Teacher", "Maple Elementary", 1, 76_400, "IDEA"),
    p("Paraprofessional", "Maple Elementary", 2, 38_500, "IDEA"),
    p("Family Engagement Coordinator", "Maple Elementary", 1, 58_000, "Grant"),
    p("Office Manager", "Maple Elementary", 1, 54_000, "General"),
  ],
};

export function isPlan(v: unknown): v is Plan {
  const x = v as Plan;
  return !!x && x.version === 1 && Array.isArray(x.positions) && typeof x.benefitsRate === "number" && !!x.available;
}

export const cost = (pos: Position, benefitsRate: number) => pos.fte * pos.salary * (1 + benefitsRate);
