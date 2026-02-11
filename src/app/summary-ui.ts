import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import { buildSummaryRows } from "../core/summary";
import { renderPageCell } from "./page-cell";

export function renderSummaryTable(analysis: AnalysisResult): string {
  const competitorTitles = analysis.results
    .filter((result) => result.type === "competitor")
    .map((result) => result.title.trim())
    .filter((text) => text.length > 0)
    .join("\n");
  const competitorMetas = analysis.results
    .filter((result) => result.type === "competitor")
    .map((result) => result.metaDescription.trim())
    .filter((text) => text.length > 0)
    .join("\n");

  const rows = buildSummaryRows(analysis)
    .map(
      (row) => `
      <tr>
        <td>${renderPageCell(row.label, row.url)}</td>
        <td>${row.titleHtml || "-"}</td>
        <td>${row.metaHtml || "-"}</td>
        <td>${row.h1Html || "-"}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div class="panel summary-panel">
      <div class="summary-header">
        <h3>Title / Meta / H1 Summary</h3>
        <div class="actions">
          <button class="btn secondary copy-summary" data-copy-type="title" data-copy-text="${encodeURIComponent(competitorTitles)}">
            Copy competitor titles
          </button>
          <button class="btn secondary copy-summary" data-copy-type="meta" data-copy-text="${encodeURIComponent(competitorMetas)}">
            Copy competitor meta
          </button>
        </div>
      </div>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Title</th>
            <th>Meta Description</th>
            <th>H1</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
