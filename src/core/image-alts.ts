import { normalizeText } from "./normalizer";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPattern(normalizedKeyword: string): string {
  const parts = normalizedKeyword.split(" ").filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  const escaped = parts.map(escapeRegExp);
  const inner = parts.length > 1 ? escaped.join("\\s+") : escaped[0];
  return `\\b${inner}\\b`;
}

export interface ImageAltCheckResult {
  fulfilled: boolean;
  phrases: string[];
  keywordMatches: string[];
}

export function detectImageAlts(
  altTexts: string[],
  keywords: string[],
  totalImages: number,
  missingAlt: number
): ImageAltCheckResult {
  const phrases = Array.from(new Set(altTexts.map((item) => item.trim()).filter(Boolean)));
  const keywordMatches: string[] = [];
  const normalizedAlts = normalizeText(phrases.join(" "));

  keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    const pattern = buildPattern(normalizedKeyword);
    if (!pattern || !normalizedAlts) {
      return;
    }
    const regex = new RegExp(pattern, "g");
    if (regex.test(normalizedAlts)) {
      keywordMatches.push(keyword);
    }
  });

  return {
    fulfilled: totalImages === 0 ? true : missingAlt === 0,
    phrases,
    keywordMatches
  };
}
