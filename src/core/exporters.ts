import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";

export function generateHtmlReport(analysis: AnalysisResult): string {
  const date = new Date(analysis.timestamp).toLocaleString();

  const sections = analysis.results
    .map((result) => {
      const rows = analysis.keywords
        .map((keyword) => {
          const match = result.matches.find((item) => item.keyword === keyword);
          if (!match) {
            return "";
          }
          if (result.type === "competitor" && !match.found) {
            return "";
          }

          return `
            <tr>
              <td>${escapeHtml(keyword)}</td>
              <td>${match.found ? "Yes" : "No"}</td>
              <td>${match.occurrencesTotal}</td>
              <td>${match.occurrencesByBucket.title}</td>
              <td>${match.occurrencesByBucket.meta}</td>
              <td>${match.occurrencesByBucket.h1}</td>
              <td>${match.occurrencesByBucket.h2}</td>
              <td>${match.occurrencesByBucket.h3}</td>
              <td>${match.occurrencesByBucket.body}</td>
            </tr>
          `;
        })
        .join("");

      const tableBody =
        rows.trim().length > 0
          ? rows
          : "<tr><td colspan=\"8\">No matching keywords found.</td></tr>";

      return `
        <h2>${escapeHtml(result.label)}</h2>
        <p><strong>URL:</strong> ${escapeHtml(result.url)}</p>
        <table>
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Found</th>
              <th>Total</th>
              <th>Title</th>
              <th>Meta</th>
              <th>H1</th>
              <th>H2</th>
              <th>H3</th>
              <th>Body</th>
            </tr>
          </thead>
          <tbody>
            ${tableBody}
          </tbody>
        </table>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Keyword Analysis Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; }
      h1, h2 { color: #1f6feb; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      th, td { border: 1px solid #d8dde2; padding: 8px; text-align: left; }
      th { background: #f4f6fa; }
    </style>
  </head>
  <body>
    <h1>Keyword Analysis Report</h1>
    <p><strong>Date:</strong> ${escapeHtml(date)}</p>
    <p><strong>Group:</strong> ${escapeHtml(analysis.groupName)}</p>
    ${sections}
  </body>
</html>
  `;
}

export function downloadHtmlReport(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
