import type { AnalysisResult, GapKeyword } from "../types";

export function computeGaps(analysis: AnalysisResult): GapKeyword[] {
  const myResult = analysis.results.find((result) => result.type === "my-site");
  if (!myResult) {
    return [];
  }

  const gapKeywords: GapKeyword[] = [];

  analysis.keywords.forEach((keyword) => {
    const myMatch = myResult.matches.find((match) => match.keyword === keyword);
    if (!myMatch || myMatch.found) {
      return;
    }

    const competitors = analysis.results
      .filter((result) => result.type === "competitor")
      .map((result) => {
        const match = result.matches.find((item) => item.keyword === keyword);
        if (!match || !match.found) {
          return null;
        }

        return {
          label: result.label,
          url: result.url,
          occurrences: match.occurrencesTotal,
          buckets: match.bucketsFound
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (competitors.length > 0) {
      gapKeywords.push({ keyword, competitors });
    }
  });

  return gapKeywords;
}
