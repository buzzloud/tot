import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import { renderPageCell } from "./page-cell";

export function renderFirst100Table(analysis: AnalysisResult): string {
  const rows = analysis.results
    .map((result) => {
      const presentText = result.first100Present ? "Yes" : "No";
      const presentClass = result.first100Present ? "pill ok" : "pill no";
      const matches =
        result.first100Matches.length > 0
          ? escapeHtml(result.first100Matches.join(", "))
          : "-";

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
      <h3>First 100 Words After H1</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Keyword Found</th>
            <th>Matched Keywords</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
