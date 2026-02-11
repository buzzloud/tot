import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import { renderPageCell } from "./page-cell";

export function renderSchemaTable(analysis: AnalysisResult): string {
  const rows = analysis.results
    .map((result) => {
      const presentText = result.schemaPresent ? "Yes" : "No";
      const presentClass = result.schemaPresent ? "pill ok" : "pill no";
      const matches =
        result.schemaMatches.length > 0 ? escapeHtml(result.schemaMatches.join(", ")) : "-";

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
      <h3>Schema Presence</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Schema Present</th>
            <th>Detected Types</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
