import type { ExtractedContent } from "../types";
import { normalizeText } from "./normalizer";

const REVIEW_PHRASES = [
  "Customer Reviews",
  "Customer Testimonials",
  "Reviews",
  "Testimonials",
  "What Our Customers Say",
  "What Customers Say",
  "Real Customer Reviews",
  "Verified Reviews",
  "Independent Reviews",
  "Trustpilot",
  "Trustpilot Reviews",
  "Rated on Trustpilot",
  "TrustScore",
  "Rated X out of 5",
  "Based on X reviews",
  "Read our Trustpilot reviews",
  "Google Reviews",
  "Google Customer Reviews",
  "Rated on Google",
  "Google rating",
  "Reviews on Google",
  "Read our Google reviews",
  "Customer Rating",
  "Star Rating",
  "Overall Rating",
  "Average Rating",
  "Review Score",
  "Rated Excellent",
  "Highly Rated",
  "Trusted by Customers",
  "Trusted by Thousands",
  "Why Customers Choose Us",
  "Why Homeowners Trust Us",
  "Customer Feedback",
  "Feedback & Reviews",
  "Reviews & Ratings"
];

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPhrasePattern(phrase: string): RegExp | null {
  const normalized = normalizeText(phrase);
  if (!normalized) {
    return null;
  }
  const parts = normalized.split(" ").filter(Boolean).map(escapeRegExp);
  if (parts.length === 0) {
    return null;
  }
  const inner = parts.length > 1 ? parts.join("\\s+") : parts[0];
  return new RegExp(`\\b${inner}\\b`, "g");
}

export function detectReviews(
  content: ExtractedContent
): { present: boolean; matches: string[] } {
  const haystack = normalizeText(`${content.h2} ${content.h3} ${content.body}`);
  const matches: string[] = [];

  REVIEW_PHRASES.forEach((phrase) => {
    const regex = buildPhrasePattern(phrase);
    if (!regex) {
      return;
    }
    if (regex.test(haystack)) {
      matches.push(phrase);
    }
  });

  return {
    present: matches.length > 0,
    matches
  };
}
