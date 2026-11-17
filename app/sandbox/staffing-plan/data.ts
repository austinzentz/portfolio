// Entirely fictional. Not based on any real organization's people or data.

export const PERFORMANCE = ["Excelling", "Successful", "Growing", "Struggling"] as const;
export type Performance = (typeof PERFORMANCE)[number];

export const CATEGORIES = [
  "School Leadership",
  "General Education Teachers",
  "Special Education Teachers",
  "Student Support",
  "Administrative Support",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Staff = { id: string; name: string; title: string; performance: Performance };
export type Position = { id: string; category: Category; title: string };

export type Plan = {
  version: 1;
  positions: Position[];
  /** positionId -> staffId. One person per position. */
  assignments: Record<string, string>;
  /** staffIds leaving at the end of this year. */
  notReturning: string[];
};

let s = 0;
const st = (name: string, title: string, performance: Performance): Staff => ({
  id: `s${++s}`,
  name,
  title,
  performance,
});

export const STAFF: Staff[] = [
  st("Dana Whitfield", "Principal", "Excelling"),
  st("Marcus Ilunga", "Assistant Principal", "Successful"),
  st("Priya Raman", "Dean of Students", "Growing"),
  st("Elena Ortiz", "Kindergarten Teacher", "Excelling"),
  st("Tom Brezinski", "Kindergarten Teacher", "Successful"),
  st("Aisha Coleman", "Grade 1 Teacher", "Successful"),
  st("Jun Takahashi", "Grade 1 Teacher", "Struggling"),
  st("Rosa Delgado", "Grade 2 Teacher", "Excelling"),
  st("Liam Foster", "Grade 2 Teacher", "Growing"),
  st("Hannah Lindqvist", "Grade 3 Teacher", "Successful"),
  st("Darnell Hayes", "Grade 3 Teacher", "Successful"),
  st("Mei Chen", "Grade 4 Teacher", "Excelling"),
  st("Ryan O'Connell", "Grade 4 Teacher", "Struggling"),
  st("Fatima Haddad", "Grade 5 Teacher", "Successful"),
  st("Caleb Nguyen", "Grade 5 Teacher", "Growing"),
  st("Grace Okafor", "Special Education Teacher", "Excelling"),
  st("Sam Patel", "Special Education Teacher", "Growing"),
  st("Lucia Romero", "Paraprofessional", "Successful"),
  st("Owen Mitchell", "Paraprofessional", "Struggling"),
  st("Naomi Brooks", "School Counselor", "Successful"),
  st("Victor Alvarez", "Social Worker", "Excelling"),
  st("Ingrid Sorensen", "Reading Interventionist", "Successful"),
  st("Kofi Mensah", "Speech-Language Pathologist", "Growing"),
  st("Beth Kowalski", "Office Manager", "Excelling"),
  st("Andre Simmons", "Front Desk Clerk", "Successful"),
  st("Yusuf Karimi", "Operations Coordinator", "Growing"),
];

let p = 0;
const pos = (category: Category, title: string): Position => ({ id: `p${++p}`, category, title });

const SEED_POSITIONS: Position[] = [
  pos("School Leadership", "Principal"),
  pos("School Leadership", "Assistant Principal"),
  pos("School Leadership", "Dean of Students"),
  ...["Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"].flatMap((g) => [
    pos("General Education Teachers", `${g} Teacher`),
    pos("General Education Teachers", `${g} Teacher`),
  ]),
  pos("Special Education Teachers", "Special Education Teacher (K–2)"),
  pos("Special Education Teachers", "Special Education Teacher (3–5)"),
  pos("Special Education Teachers", "Paraprofessional"),
  pos("Special Education Teachers", "Paraprofessional"),
  pos("Student Support", "School Counselor"),
  pos("Student Support", "Social Worker"),
  pos("Student Support", "Reading Interventionist"),
  pos("Student Support", "Speech-Language Pathologist"),
  pos("Administrative Support", "Office Manager"),
  pos("Administrative Support", "Front Desk Clerk"),
  pos("Administrative Support", "Operations Coordinator"),
];

export const SEED: Plan = { version: 1, positions: SEED_POSITIONS, assignments: {}, notReturning: [] };

export function isPlan(v: unknown): v is Plan {
  const x = v as Plan;
  return (
    !!x &&
    x.version === 1 &&
    Array.isArray(x.positions) &&
    Array.isArray(x.notReturning) &&
    typeof x.assignments === "object" &&
    x.assignments !== null
  );
}

/** Light and dark pill colors, readable on the site's warm neutrals. */
export const PILL: Record<Performance, string> = {
  Excelling: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Successful: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300",
  Growing: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Struggling: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300",
};
