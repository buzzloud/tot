import type { AnalysisResult, TechnicalCheckStatus } from "../types";
import { escapeHtml } from "../utils/text";

function renderStatusPill(status: TechnicalCheckStatus): string {
  if (status === "pass") {
    return '<span class="pill ok">Pass</span>';
  }
  if (status === "fail") {
    return '<span class="pill no">Fail</span>';
  }
  return '<span class="pill warn">Warn</span>';
}

export function renderTechnicalChecksTable(analysis: AnalysisResult): string {
  const myResult = analysis.results.find((result) => result.type === "my-site");
  const checks =
    myResult && myResult.fetchStatus === "success" ? myResult.technicalChecks : [];

  const rows =
    checks.length > 0
      ? checks
          .map(
            (check) => `
        <tr>
          <td>${escapeHtml(check.label)}</td>
          <td>${renderStatusPill(check.status)}</td>
          <td>${escapeHtml(check.summary)}</td>
          <td>${escapeHtml(check.details)}</td>
        </tr>
      `
          )
          .join("")
      : `
        <tr>
          <td colspan="4" class="hint">No technical checks available.</td>
        </tr>
      `;

  return `
    <div class="panel summary-panel">
      <h3>My URL Technical Checks</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Summary</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
