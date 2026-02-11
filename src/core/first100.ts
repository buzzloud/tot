import { normalizeText } from "./normalizer";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPattern(normalizedKeyword: string): string {
  const parts = normalizedKeyword.split(" ").filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  const escapedParts = parts.map(escapeRegExp);
  const inner = parts.length > 1 ? escapedParts.join("\\s+") : escapedParts[0];
  return `\\b${inner}\\b`;
}

export function detectFirst100Keywords(
  first100AfterH1: string,
  keywords: string[]
): { present: boolean; matches: string[] } {
  const haystack = normalizeText(first100AfterH1);
  if (!haystack) {
    return { present: false, matches: [] };
  }

  const matches: string[] = [];

  keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    const pattern = buildPattern(normalizedKeyword);
    if (!pattern) {
      return;
    }
    const regex = new RegExp(pattern, "g");
    if (regex.test(haystack)) {
      matches.push(keyword);
    }
  });

  return {
    present: matches.length > 0,
    matches
  };
}
