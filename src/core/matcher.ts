import type { Bucket, ExtractedContent, KeywordMatch } from "../types";
import { normalizeText } from "./normalizer";

const BUCKETS: Bucket[] = ["title", "meta", "h1", "h2", "h3", "body"];

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

function countMatches(pattern: string, text: string): number {
  if (!pattern || !text) {
    return 0;
  }

  const regex = new RegExp(pattern, "g");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function buildEmptyMatches(keywords: string[]): KeywordMatch[] {
  return keywords.map((keyword) => ({
    keyword,
    found: false,
    occurrencesTotal: 0,
    occurrencesByBucket: { title: 0, meta: 0, h1: 0, h2: 0, h3: 0, body: 0 },
    bucketsFound: []
  }));
}

export function matchKeywords(
  keywords: string[],
  content: ExtractedContent
): KeywordMatch[] {
  const normalizedBuckets = {
    title: normalizeText(content.title),
    meta: normalizeText(content.metaDescription),
    h1: normalizeText(content.h1),
    h2: normalizeText(content.h2),
    h3: normalizeText(content.h3),
    body: normalizeText(content.body)
  };

  return keywords.map((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    const pattern = buildPattern(normalizedKeyword);

    const occurrencesByBucket = {
      title: countMatches(pattern, normalizedBuckets.title),
      meta: countMatches(pattern, normalizedBuckets.meta),
      h1: countMatches(pattern, normalizedBuckets.h1),
      h2: countMatches(pattern, normalizedBuckets.h2),
      h3: countMatches(pattern, normalizedBuckets.h3),
      body: countMatches(pattern, normalizedBuckets.body)
    };

    const occurrencesTotal =
      occurrencesByBucket.title +
      occurrencesByBucket.meta +
      occurrencesByBucket.h1 +
      occurrencesByBucket.h2 +
      occurrencesByBucket.h3 +
      occurrencesByBucket.body;

    const bucketsFound = BUCKETS.filter(
      (bucket) => occurrencesByBucket[bucket] > 0
    );

    return {
      keyword,
      found: occurrencesTotal > 0,
      occurrencesTotal,
      occurrencesByBucket,
      bucketsFound
    };
  });
}
