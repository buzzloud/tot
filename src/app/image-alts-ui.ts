import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import { renderPageCell } from "./page-cell";

function formatPhraseList(values: string[]): string {
  if (values.length === 0) {
    return "-";
  }
  return escapeHtml(values.join(", "));
}

export function renderImageAltsTable(analysis: AnalysisResult): string {
  const rows = analysis.results
    .map((result) => {
      const fulfilledText = result.imageAltFulfilled ? "Yes" : "No";
      const fulfilledClass = result.imageAltFulfilled ? "pill ok" : "pill no";
      const coverage = `${result.imageAltWithValue}/${result.imageAltTotal}`;
      const phrases = formatPhraseList(result.imageAltPhrases);
      const keywordMatches = formatPhraseList(result.imageAltKeywordMatches);

      return `
        <tr>
          <td>${renderPageCell(result.label, result.url)}</td>
          <td><span class="${fulfilledClass}">${fulfilledText}</span></td>
          <td>${coverage}</td>
          <td>${result.imageAltMissing}</td>
          <td>${phrases}</td>
          <td>${keywordMatches}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="panel summary-panel">
      <h3>Image ALT Check (Page Content)</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>ALT Fulfilled</th>
            <th>ALT Coverage</th>
            <th>Missing ALTs</th>
            <th>ALT Phrases Used</th>
            <th>Matched Group Keywords</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
