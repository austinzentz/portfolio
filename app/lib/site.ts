export const site = {
  name: "Austin Zentz",
  url: "https://austinzentz.com",
  email: "austin@austinzentz.com",
  description: "Austin Zentz — software developer in Washington, DC.",
  // Add profiles here (e.g. GitHub, LinkedIn) and they'll show on the home page.
  links: [] as { label: string; href: string }[],
};

/** Formats a YYYY-MM-DD string without timezone drift. */
export function formatDate(day: string, style: "long" | "short" = "long") {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: style === "long" ? "long" : "short",
    day: "numeric",
  });
}

export function title(...parts: string[]) {
  return [...parts, site.name].join(" · ");
}
