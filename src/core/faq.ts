import type { ExtractedContent } from "../types";
import { normalizeText } from "./normalizer";

const FAQ_PHRASES = [
  "Your Questions Answered by us",
  "Commonly Asked Questions",
  "Frequently Asked Questions",
  "FAQs",
  "Common Questions",
  "Common Questions Answered",
  "Questions & Answers",
  "Your Questions Answered",
  "Popular Questions",
  "Top Questions",
  "Most Asked Questions",
  "Questions Homeowners Ask",
  "Questions We’re Often Asked",
  "What Customers Ask Us",
  "What People Ask Us",
  "What You Need to Know",
  "Questions You Might Have",
  "Got Questions?",
  "Answers to Your Questions",
  "Before You Decide",
  "What to Expect",
  "Helpful Answers Before You Buy",
  "Key Things to Know",
  "Important Information",
  "Things to Consider",
  "What You Should Know",
  "Clear Answers to Common Questions",
  "Explained: Common Questions",
  "Your Questions, Explained",
  "Simple Answers to Common Questions",
  "Everything You Need to Know",
  "Quick Answers",
  "learn more about"
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

export function detectFaq(content: ExtractedContent): { present: boolean; matches: string[] } {
  const haystack = normalizeText(`${content.h2} ${content.h3} ${content.body}`);
  const matches: string[] = [];

  FAQ_PHRASES.forEach((phrase) => {
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
