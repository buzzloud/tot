import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import { renderPageCell } from "./page-cell";

export function renderReviewsTable(analysis: AnalysisResult): string {
  const rows = analysis.results
    .map((result) => {
      const presentText = result.reviewsPresent ? "Yes" : "No";
      const presentClass = result.reviewsPresent ? "pill ok" : "pill no";
      const matches =
        result.reviewsMatches.length > 0 ? escapeHtml(result.reviewsMatches.join(", ")) : "-";

      return `
        <tr>
          <td>${renderPageCell(result.label, result.url)}</td>
          <td><span class="${presentClass}">${presentText}</span></td>
          <td>${matches}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="panel summary-panel">
      <h3>Reviews Presence</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Reviews Present</th>
            <th>Matched Phrases</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
