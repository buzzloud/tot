import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import { buildSummaryRows } from "../core/summary";

export function renderSummaryTable(analysis: AnalysisResult): string {
  const rows = buildSummaryRows(analysis)
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.label)}</td>
        <td class="summary-url">${escapeHtml(row.url)}</td>
        <td>${row.titleHtml || "-"}</td>
        <td>${row.metaHtml || "-"}</td>
        <td>${row.h1Html || "-"}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div class="panel summary-panel">
      <h3>Title / Meta / H1 Summary</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>URL</th>
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
