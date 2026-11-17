// Each sandbox is a self-contained demo that keeps its data in the visitor's browser.
// Listed here = shown on the home page, /sandbox and the sitemap. A demo's route still works if it's left out.
export type Sandbox = { slug: string; title: string; summary: string };

export const sandboxes: Sandbox[] = [
  {
    slug: "staffing-plan",
    title: "Next-year staffing plan",
    summary:
      "School leaders can drag this year's school staff into next year's budget to plan for vacancies and growth, ensuring principals and central office are on the same page. ",
  },
];
