import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import { renderPageCell } from "./page-cell";

export function renderFaqTable(analysis: AnalysisResult): string {
  const rows = analysis.results
    .map((result) => {
      const presentText = result.faqPresent ? "Yes" : "No";
      const presentClass = result.faqPresent ? "pill ok" : "pill no";
      const matches =
        result.faqMatches.length > 0 ? escapeHtml(result.faqMatches.join(", ")) : "-";

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
      <h3>FAQ Presence</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>FAQ Present</th>
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
