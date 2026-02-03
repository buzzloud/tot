import type { AnalysisResult, PageResult } from "../types";
import { escapeHtml } from "../utils/text";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHighlightRegex(keyword: string): RegExp | null {
  const normalized = keyword.trim();
  if (!normalized) {
    return null;
  }
  const parts = normalized.split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (parts.length === 0) {
    return null;
  }
  const inner = parts.length > 1 ? parts.join("\\s+") : parts[0];
  const pattern = `\\b${inner}\\b`;
  return new RegExp(pattern, "gi");
}

function highlightText(text: string, keywords: string[]): string {
  if (!text) {
    return "";
  }

  const regexes = keywords
    .map((keyword) => buildHighlightRegex(keyword))
    .filter((regex): regex is RegExp => regex !== null);

  if (regexes.length === 0) {
    return escapeHtml(text);
  }

  const matches: Array<{ start: number; end: number }> = [];
  regexes.forEach((regex) => {
    regex.lastIndex = 0;
    let match = regex.exec(text);
    while (match) {
      matches.push({ start: match.index, end: match.index + match[0].length });
      match = regex.exec(text);
    }
  });

  if (matches.length === 0) {
    return escapeHtml(text);
  }

  matches.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: Array<{ start: number; end: number }> = [];
  matches.forEach((range) => {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) {
      merged.push({ ...range });
      return;
    }
    last.end = Math.max(last.end, range.end);
  });

  let output = "";
  let cursor = 0;
  merged.forEach((range) => {
    if (cursor < range.start) {
      output += escapeHtml(text.slice(cursor, range.start));
    }
    output += `<mark class="kw-hit">${escapeHtml(text.slice(range.start, range.end))}</mark>`;
    cursor = range.end;
  });
  if (cursor < text.length) {
    output += escapeHtml(text.slice(cursor));
  }

  return output;
}

export interface SummaryRow {
  label: string;
  url: string;
  titleHtml: string;
  metaHtml: string;
  h1Html: string;
}

export function buildSummaryRows(analysis: AnalysisResult): SummaryRow[] {
  return analysis.results.map((result: PageResult) => {
    const titleKeywords = result.matches
      .filter((match) => match.occurrencesByBucket.title > 0)
      .map((match) => match.keyword);
    const metaKeywords = result.matches
      .filter((match) => match.occurrencesByBucket.meta > 0)
      .map((match) => match.keyword);
    const h1Keywords = result.matches
      .filter((match) => match.occurrencesByBucket.h1 > 0)
      .map((match) => match.keyword);
    return {
      label: result.label,
      url: result.url,
      titleHtml: highlightText(result.title, titleKeywords),
      metaHtml: highlightText(result.metaDescription, metaKeywords),
      h1Html: highlightText(result.h1Text, h1Keywords)
    };
  });
}
