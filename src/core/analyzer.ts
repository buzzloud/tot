import type {
  AnalysisResult,
  KeywordGroup,
  PageResult,
  PageType,
  ProxySettings
} from "../types";
import { fetchHtml } from "./fetcher";
import { extractContent } from "./extractor";
import { buildEmptyMatches, matchKeywords } from "./matcher";
import { createId } from "../utils/id";
import { getDomainLabel } from "../utils/url";

export interface AnalyzeTarget {
  url: string;
  type: PageType;
  label: string;
}

export interface AnalyzeParams {
  myUrl: string;
  competitorUrls: string[];
  group: KeywordGroup;
  proxySettings: ProxySettings;
  onProgress?: (message: string) => void;
}

export async function analyzePage(
  target: AnalyzeTarget,
  keywords: string[],
  proxySettings: ProxySettings
): Promise<PageResult> {
  try {
    const html = await fetchHtml(target.url, proxySettings);
    const content = extractContent(html);
    const matches = matchKeywords(keywords, content);
    const warningMessage =
      content.wordCount > 0 && content.wordCount < 120
        ? `Low content count (${content.wordCount} words). The page may be blocked or JS-rendered.`
        : content.source === "full"
          ? "Using full-page text fallback (includes header/navigation)."
        : undefined;

    return {
      url: target.url,
      type: target.type,
      label: target.label,
      fetchStatus: "success",
      warningMessage,
      previewText: content.previewText,
      title: content.title,
      metaDescription: content.metaDescription,
      h1Text: content.h1,
      wordCount: content.wordCount,
      matches
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      url: target.url,
      type: target.type,
      label: target.label,
      fetchStatus: "error",
      errorMessage: message,
      wordCount: 0,
      title: "",
      metaDescription: "",
      h1Text: "",
      matches: buildEmptyMatches(keywords)
    };
  }
}

export async function runAnalysis(params: AnalyzeParams): Promise<AnalysisResult> {
  const myDomain = getDomainLabel(params.myUrl);
  const targets: AnalyzeTarget[] = [
    {
      url: params.myUrl,
      type: "my-site",
      label: myDomain ? `Your Site (${myDomain})` : "Your Site"
    },
    ...params.competitorUrls.map((url, index) => ({
      url,
      type: "competitor",
      label: getDomainLabel(url) || `Competitor ${index + 1}`
    }))
  ];

  const results: PageResult[] = [];

  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    params.onProgress?.(`Analyzing ${target.label} (${index + 1}/${targets.length})`);
    const result = await analyzePage(target, params.group.keywords, params.proxySettings);
    results.push(result);
  }

  return {
    id: createId(),
    timestamp: new Date().toISOString(),
    groupName: params.group.name,
    keywords: params.group.keywords,
    myUrl: params.myUrl,
    competitorUrls: params.competitorUrls,
    results
  };
}
