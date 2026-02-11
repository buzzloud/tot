import { escapeHtml } from "../utils/text";

function getFullUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function renderPageCell(label: string, url: string): string {
  return `
    <div class="page-cell">
      <div class="page-label">${escapeHtml(label)}</div>
      <div class="page-path">${escapeHtml(getFullUrl(url))}</div>
    </div>
  `;
}
