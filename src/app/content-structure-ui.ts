import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import { renderPageCell } from "./page-cell";

export function renderContentStructureTable(analysis: AnalysisResult): string {
  const rows = analysis.results
    .map((result) => {
      const tocText = result.tocPresent ? "Yes" : "No";
      const tocClass = result.tocPresent ? "pill ok" : "pill no";
      const tableText = result.tableUsagePresent ? "Yes" : "No";
      const tableClass = result.tableUsagePresent ? "pill ok" : "pill no";
      const tocDetails = `jump links=${result.tocJumpLinks}, matched sections=${result.tocMatchedSections}`;
      const tableDetails = `data tables=${result.dataTableCount}, total tables=${result.totalTableCount}`;

      return `
        <tr>
          <td>${renderPageCell(result.label, result.url)}</td>
          <td><span class="${tocClass}">${tocText}</span></td>
          <td>${escapeHtml(tocDetails)}</td>
          <td><span class="${tableClass}">${tableText}</span></td>
          <td>${escapeHtml(tableDetails)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="panel summary-panel">
      <h3>Content Structure Checks</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>TOC Present</th>
            <th>TOC Details</th>
            <th>Data Tables Present</th>
            <th>Table Details</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
