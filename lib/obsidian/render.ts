// Renders Supabase rows into wikilinked Obsidian markdown. This is the vault
// PROJECTION: Supabase is the source of truth; the sync job (and the in-app Vault
// browser) materialize markdown from these. Vercel functions never write the FS.

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function renderMeetingMarkdown(opts: {
  title: string;
  date: string;
  companyName?: string | null;
  companyId?: string | null;
  summary?: string | null;
  participants?: string[];
  decisions?: { title: string; context?: string }[];
  commitments?: { description: string }[];
}): string {
  const fm = ["---", "type: meeting"];
  if (opts.companyId) fm.push(`company: ${opts.companyId}`);
  fm.push(`date: ${opts.date}`, "---");

  const parts = (opts.participants ?? []).map((p) => `[[${p}]]`).join(", ");
  const decisions = (opts.decisions ?? [])
    .map((d) => `- **${d.title}** — ${d.context ?? ""}`)
    .join("\n");
  const commits = (opts.commitments ?? [])
    .map((c) => `- [ ] ${c.description}`)
    .join("\n");

  return `${fm.join("\n")}

# ${opts.title}
${opts.companyName ? `Company:: [[${opts.companyName}]]` : ""}
Participants:: ${parts || "—"}

## Summary
${opts.summary ?? "—"}

## Decisions
${decisions || "—"}

## Commitments
${commits || "—"}
`;
}
