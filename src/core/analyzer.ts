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
import { detectFaq } from "./faq";
import { detectReviews } from "./reviews";
import { detectSchema } from "./schema";
import { detectFirst100Keywords } from "./first100";
import { detectImageAlts } from "./image-alts";
import { analyzeMyUrlTechnicalChecks } from "./technical-checks";
import { detectContentStructure } from "./content-structure";
import { detectVideoEmbeds } from "./video-embeds";
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
    const faq = detectFaq(content);
    const reviews = detectReviews(content);
    const schema = detectSchema(html);
    const first100 = detectFirst100Keywords(content.first100AfterH1, keywords);
    const structure = detectContentStructure(html);
    const imageAlts = detectImageAlts(
      content.imageAltTexts,
      keywords,
      content.totalImages,
      content.imagesMissingAlt
    );
    const video = detectVideoEmbeds(html);
    const technicalChecks =
      target.type === "my-site"
        ? analyzeMyUrlTechnicalChecks({ html, pageUrl: target.url })
        : [];
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
      faqPresent: faq.present,
      faqMatches: faq.matches,
      reviewsPresent: reviews.present,
      reviewsMatches: reviews.matches,
      schemaPresent: schema.present,
      schemaMatches: schema.matches,
      first100AfterH1: content.first100AfterH1,
      first100Present: first100.present,
      first100Matches: first100.matches,
      tocPresent: structure.tocPresent,
      tocJumpLinks: structure.tocJumpLinks,
      tocMatchedSections: structure.tocMatchedSections,
      tableUsagePresent: structure.tableUsagePresent,
      dataTableCount: structure.dataTableCount,
      totalTableCount: structure.totalTableCount,
      imageAltTotal: content.totalImages,
      imageAltWithValue: content.imagesWithAlt,
      imageAltMissing: content.imagesMissingAlt,
      imageAltFulfilled: imageAlts.fulfilled,
      imageAltPhrases: imageAlts.phrases,
      imageAltKeywordMatches: imageAlts.keywordMatches,
      videoEmbedsPresent: video.videoEmbedsPresent,
      videoEmbedCount: video.videoEmbedCount,
      youtubeEmbedCount: video.youtubeEmbedCount,
      vimeoEmbedCount: video.vimeoEmbedCount,
      technicalChecks,
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
      faqPresent: false,
      faqMatches: [],
      reviewsPresent: false,
      reviewsMatches: [],
      schemaPresent: false,
      schemaMatches: [],
      first100AfterH1: "",
      first100Present: false,
      first100Matches: [],
      tocPresent: false,
      tocJumpLinks: 0,
      tocMatchedSections: 0,
      tableUsagePresent: false,
      dataTableCount: 0,
      totalTableCount: 0,
      imageAltTotal: 0,
      imageAltWithValue: 0,
      imageAltMissing: 0,
      imageAltFulfilled: false,
      imageAltPhrases: [],
      imageAltKeywordMatches: [],
      videoEmbedsPresent: false,
      videoEmbedCount: 0,
      youtubeEmbedCount: 0,
      vimeoEmbedCount: 0,
      technicalChecks: [],
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
