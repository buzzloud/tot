import type { RankingHistoryEntry } from "../storage/rankings-history";
import { escapeHtml } from "../utils/text";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function getMyTarget(entry: RankingHistoryEntry) {
  return entry.response.targets[0] || null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getEntryDomain(entry: RankingHistoryEntry): string {
  const myTarget = getMyTarget(entry);
  const fromRanked = getDomain(myTarget?.resultUrl || "");
  if (fromRanked) {
    return fromRanked;
  }
  const fromTarget = getDomain(myTarget?.url || "");
  return fromTarget || "-";
}

function renderCopyUrl(url: string): string {
  const value = (url || "").trim();
  if (!value || value === "-") {
    return "-";
  }
  return `
    <span
      class="history-url copy-url-cell"
      data-copy-url="${encodeURIComponent(value)}"
      title="Click to copy URL"
    >${escapeHtml(value)}</span>
  `;
}

function renderTop10(entry: RankingHistoryEntry): string {
  if (!entry.response.topOrganic || entry.response.topOrganic.length === 0) {
    return "<p class=\"hint\">No top 10 data.</p>";
  }

  const myTarget = getMyTarget(entry);
  const myDomain = getDomain(myTarget?.url || myTarget?.resultUrl || "");

  const rows = entry.response.topOrganic
    .map(
      (item) => `
      <tr class="${item.domain === myDomain ? "history-row-myurl" : ""}">
        <td>#${item.position}</td>
        <td>${escapeHtml(item.domain || "-")}</td>
        <td>${escapeHtml(item.title || "-")}</td>
        <td>${renderCopyUrl(item.link || "-")}</td>
      </tr>
    `
    )
    .join("");

  return `
    <table class="results-table history-inner-table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Domain</th>
          <th>Title</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderRankingsEntries(entries: RankingHistoryEntry[], archived: boolean): string {
  if (entries.length === 0) {
    return archived
      ? "<p class=\"hint\">Archive is empty.</p>"
      : "<p class=\"hint\">No saved ranking checks yet.</p>";
  }

  const blocks = entries
    .map((entry) => {
      const myTarget = getMyTarget(entry);
      const rank =
        myTarget && typeof myTarget.position === "number" ? `#${myTarget.position}` : "Not found";
      const rankUrl = myTarget?.resultUrl || myTarget?.url || "-";
      const location = entry.response.params.location || "-";
      const meta = `${location} | ${entry.response.params.google_domain} | gl=${entry.response.params.gl}`;

      return `
        <div class="history-entry">
          <div class="history-entry-header">
            <div class="history-entry-title">${escapeHtml(entry.keyword)}</div>
            ${
              archived
                ? ""
                : `<button class="btn secondary history-archive-btn" type="button" data-entry-id="${escapeHtml(entry.id)}">Archive</button>`
            }
          </div>
          <div class="history-meta">
            <div class="history-meta-item">
              <div class="history-meta-label">Date</div>
              <div>${escapeHtml(formatDate(entry.createdAt))}</div>
            </div>
            <div class="history-meta-item">
              <div class="history-meta-label">Keyword</div>
              <div>${escapeHtml(entry.keyword)}</div>
            </div>
            <div class="history-meta-item">
              <div class="history-meta-label">SERP Params</div>
              <div>${escapeHtml(meta)}</div>
            </div>
            <div class="history-meta-item">
              <div class="history-meta-label">Your Rank</div>
              <div>${escapeHtml(rank)}</div>
            </div>
            <div class="history-meta-item">
              <div class="history-meta-label">Ranked URL</div>
              <div>${renderCopyUrl(rankUrl)}</div>
            </div>
          </div>
          <details class="history-toggle">
            <summary class="btn secondary history-toggle-btn">
              ${escapeHtml(formatDate(entry.createdAt))} | ${escapeHtml(entry.keyword)} | ${escapeHtml(getEntryDomain(entry))}
            </summary>
            <div class="history-top-title">Saved Top 10</div>
            ${renderTop10(entry)}
          </details>
        </div>
      `;
    })
    .join("");

  return `<div class="history-list">${blocks}</div>`;
}

export function renderRankingsHistoryTable(entries: RankingHistoryEntry[]): string {
  return renderRankingsEntries(entries, false);
}

export function renderRankingsArchiveTable(entries: RankingHistoryEntry[]): string {
  return renderRankingsEntries(entries, true);
}
