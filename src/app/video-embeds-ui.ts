import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import { renderPageCell } from "./page-cell";

export function renderVideoEmbedsTable(analysis: AnalysisResult): string {
  const rows = analysis.results
    .map((result) => {
      const presentText = result.videoEmbedsPresent ? "Yes" : "No";
      const presentClass = result.videoEmbedsPresent ? "pill ok" : "pill no";

      return `
        <tr>
          <td>${renderPageCell(result.label, result.url)}</td>
          <td><span class="${presentClass}">${presentText}</span></td>
          <td>${result.videoEmbedCount}</td>
          <td>${result.youtubeEmbedCount}</td>
          <td>${result.vimeoEmbedCount}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="panel summary-panel">
      <h3>Video Embed Checks</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Video Embeds Present</th>
            <th>Total Embeds</th>
            <th>YouTube</th>
            <th>Vimeo</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
