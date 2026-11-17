// Each sandbox is a self-contained demo that keeps its data in the visitor's browser.
// Listed here = shown on the home page, /sandbox and the sitemap. A demo's route still works if it's left out.
export type Sandbox = { slug: string; title: string; summary: string };

export const sandboxes: Sandbox[] = [
  // {
  //   slug: "staffing-budget",
  //   title: "Staffing budget planner",
  //   summary:
  //     "A small version of a tool I build often: plan positions, salaries and funding sources, and watch the totals move. Fictional school, fictional numbers.",
  // },
];
