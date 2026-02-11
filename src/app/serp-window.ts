import type { AnalysisResult } from "../types";
import { escapeHtml } from "../utils/text";
import type { SerpResponse, SerpTargetResponse } from "./serp-types";

interface SerpTargetRequest {
  label: string;
  url: string;
}

const SERP_ENDPOINT = "http://localhost:8787/serp";
const DEFAULT_SERP_LOCATION = "United States";
const SERP_SCAN_DEPTH = 60;

function renderShell(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; font-family: "Trebuchet MS", "Lucida Sans Unicode", sans-serif; background: #f5f8fb; color: #1f2a2f; }
      .wrap { max-width: 1100px; margin: 0 auto; padding: 20px; }
      .panel { background: #ffffff; border: 1px solid #d8dde2; border-radius: 12px; padding: 16px 18px; box-shadow: 0 10px 24px rgba(20, 30, 40, 0.08); }
      h1 { margin: 0 0 8px; font-size: 24px; }
      .hint { color: #54616a; font-size: 13px; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
      th, td { border: 1px solid #d8dde2; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f4f6fa; }
      .ok { color: #0f6a3d; font-weight: 600; }
      .no { color: #a53a3a; font-weight: 600; }
      .url { max-width: 420px; word-break: break-word; }
      .my-rank-row td { background: #fff1d6; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="panel">
        ${content}
      </div>
    </div>
  </body>
</html>
  `;
}

function renderLoading(keyword: string): string {
  return renderShell(
    `SERP Rankings - ${keyword}`,
    `
      <h1>SERP Rankings</h1>
      <div class="hint">Keyword: ${escapeHtml(keyword)}</div>
      <div class="hint">Loading rankings...</div>
    `
  );
}

function renderError(keyword: string, message: string): string {
  return renderShell(
    `SERP Rankings - ${keyword}`,
    `
      <h1>SERP Rankings</h1>
      <div class="hint">Keyword: ${escapeHtml(keyword)}</div>
      <div class="hint no">Error: ${escapeHtml(message)}</div>
      <div class="hint">Tip: run proxy with SERP key, e.g. <code>$env:SERPAPI_KEY="your_key"; npm run proxy</code></div>
    `
  );
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function renderResults(data: SerpResponse): string {
  const scanDepth =
    typeof data.params.scanDepth === "number" && Number.isFinite(data.params.scanDepth)
      ? data.params.scanDepth
      : SERP_SCAN_DEPTH;

  const rows = data.targets
    .map((target) => {
      const hasRank = target.position !== null;
      const rankText = hasRank ? `#${target.position}` : `Not in top ${scanDepth}`;
      const rankClass = hasRank ? "ok" : "no";
      const resultUrl = target.resultUrl ? escapeHtml(target.resultUrl) : "-";
      const resultTitle = target.title ? escapeHtml(target.title) : "-";

      return `
        <tr>
          <td>${escapeHtml(target.label)}</td>
          <td class="${rankClass}">${rankText}</td>
          <td class="url">${escapeHtml(target.url)}</td>
          <td class="url">${resultUrl}</td>
          <td>${resultTitle}</td>
        </tr>
      `;
    })
    .join("");

  const topRows =
    data.topOrganic && data.topOrganic.length > 0
      ? data.topOrganic
          .map(
            (item) => `
        <tr>
          <td>#${item.position}</td>
          <td>${escapeHtml(item.domain || "-")}</td>
          <td>${escapeHtml(item.title || "-")}</td>
          <td class="url">${escapeHtml(item.link || "-")}</td>
        </tr>
      `
          )
          .join("")
      : `
        <tr>
          <td colspan="4" class="hint">No organic results returned.</td>
        </tr>
      `;

  const myTarget = data.targets[0];
  const showMyExtraRow =
    myTarget &&
    typeof myTarget.position === "number" &&
    Number.isFinite(myTarget.position) &&
    myTarget.position > 10;
  const myExtraRow = showMyExtraRow
    ? `
        <tr class="my-rank-row">
          <td>#${myTarget.position}</td>
          <td>${escapeHtml(getDomainFromUrl(myTarget.resultUrl || myTarget.url) || "-")}</td>
          <td>${escapeHtml(myTarget.title || "(Your page position outside top 10)")}</td>
          <td class="url">${escapeHtml(myTarget.resultUrl || myTarget.url || "-")}</td>
        </tr>
      `
    : "";

  const paaRows =
    data.peopleAlsoAsk && data.peopleAlsoAsk.length > 0
      ? data.peopleAlsoAsk
          .map(
            (item) => `
        <tr>
          <td>${escapeHtml(item.question || "-")}</td>
          <td>${escapeHtml(item.snippet || "-")}</td>
          <td class="url">${escapeHtml(item.link || "-")}</td>
        </tr>
      `
          )
          .join("")
      : `
        <tr>
          <td colspan="3" class="hint">No People Also Ask results returned.</td>
        </tr>
      `;

  const pasfRows =
    data.peopleAlsoSearchFor && data.peopleAlsoSearchFor.length > 0
      ? data.peopleAlsoSearchFor
          .map(
            (item) => `
        <tr>
          <td>${escapeHtml(item.query || "-")}</td>
          <td class="url">${escapeHtml(item.link || "-")}</td>
        </tr>
      `
          )
          .join("")
      : `
        <tr>
          <td colspan="2" class="hint">No People Also Search For results returned.</td>
        </tr>
      `;

  const meta = `Location: ${data.params.location} | hl=${data.params.hl} | gl=${data.params.gl} | domain=${data.params.google_domain} | device=${data.params.device || "desktop"} | num=${data.params.num}`;
  const depthInfo = `Requested depth: top ${scanDepth} (page size ${data.params.pageSize || 10})`;

  return renderShell(
    `SERP Rankings - ${data.keyword}`,
    `
      <h1>SERP Rankings</h1>
      <div class="hint">Keyword: ${escapeHtml(data.keyword)}</div>
      <div class="hint">${escapeHtml(meta)}</div>
      <div class="hint">${escapeHtml(depthInfo)}</div>
      <div class="hint">Organic results returned by API: ${data.totalOrganic}</div>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Rank</th>
            <th>Target URL</th>
            <th>Matched Result URL</th>
            <th>Matched Result Title</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <h2 style="margin:18px 0 8px;font-size:20px;">Top 10 Organic Results</h2>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Domain</th>
            <th>Title</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>${topRows}${myExtraRow}</tbody>
      </table>
      <h2 style="margin:18px 0 8px;font-size:20px;">People Also Ask</h2>
      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Snippet</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>${paaRows}</tbody>
      </table>
      <h2 style="margin:18px 0 8px;font-size:20px;">People Also Search For</h2>
      <table>
        <thead>
          <tr>
            <th>Query</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>${pasfRows}</tbody>
      </table>
    `
  );
}

export async function openSerpRankingWindow(
  keyword: string,
  analysis: AnalysisResult,
  location: string = DEFAULT_SERP_LOCATION,
  device: "desktop" | "mobile" = "desktop"
): Promise<SerpResponse | null> {
  const popup = window.open("", "_blank", "width=1200,height=840");
  if (!popup) {
    alert("Popup blocked by browser.");
    return null;
  }

  popup.document.write(renderLoading(keyword));
  popup.document.close();

  const targets: SerpTargetRequest[] = analysis.results.map((result) => ({
    label: result.label,
    url: result.url
  }));

  try {
    const response = await fetch(SERP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword,
        targets,
        location,
        hl: "en",
        gl: "uk",
        googleDomain: "google.co.uk",
        device,
        num: SERP_SCAN_DEPTH,
        scanDepth: SERP_SCAN_DEPTH
      })
    });

    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(bodyText || `SERP request failed with HTTP ${response.status}`);
    }

    const data = JSON.parse(bodyText) as SerpResponse;
    popup.document.open();
    popup.document.write(renderResults(data));
    popup.document.close();
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SERP error";
    popup.document.open();
    popup.document.write(renderError(keyword, message));
    popup.document.close();
    return null;
  }
}
