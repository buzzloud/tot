export type Bucket = "title" | "meta" | "h1" | "h2" | "h3" | "body";

export type PageType = "my-site" | "competitor";

export interface KeywordGroup {
  id: string;
  name: string;
  keywords: string[];
  createdAt: string;
}

export interface ProxySettings {
  mode: "auto" | "local" | "custom";
  customTemplate: string;
  timeoutMs: number;
  renderJs: boolean;
}

export interface ExtractedContent {
  title: string;
  metaDescription: string;
  h1: string;
  h2: string;
  h3: string;
  body: string;
  first100AfterH1: string;
  imageAltTexts: string[];
  totalImages: number;
  imagesWithAlt: number;
  imagesMissingAlt: number;
  wordCount: number;
  source: "pruned" | "full";
  previewText: string;
}

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  occurrencesTotal: number;
  occurrencesByBucket: Record<Bucket, number>;
  bucketsFound: Bucket[];
}

export type TechnicalCheckStatus = "pass" | "fail" | "warn";

export interface TechnicalCheckRow {
  key: string;
  label: string;
  status: TechnicalCheckStatus;
  summary: string;
  details: string;
}

export interface PageResult {
  url: string;
  type: PageType;
  label: string;
  fetchStatus: "success" | "error";
  errorMessage?: string;
  warningMessage?: string;
  previewText?: string;
  title: string;
  metaDescription: string;
  h1Text: string;
  faqPresent: boolean;
  faqMatches: string[];
  reviewsPresent: boolean;
  reviewsMatches: string[];
  schemaPresent: boolean;
  schemaMatches: string[];
  first100AfterH1: string;
  first100Present: boolean;
  first100Matches: string[];
  tocPresent: boolean;
  tocJumpLinks: number;
  tocMatchedSections: number;
  tableUsagePresent: boolean;
  dataTableCount: number;
  totalTableCount: number;
  imageAltTotal: number;
  imageAltWithValue: number;
  imageAltMissing: number;
  imageAltFulfilled: boolean;
  imageAltPhrases: string[];
  imageAltKeywordMatches: string[];
  videoEmbedsPresent: boolean;
  videoEmbedCount: number;
  youtubeEmbedCount: number;
  vimeoEmbedCount: number;
  technicalChecks: TechnicalCheckRow[];
  wordCount: number;
  matches: KeywordMatch[];
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  groupName: string;
  keywords: string[];
  myUrl: string;
  competitorUrls: string[];
  results: PageResult[];
}

export interface GapKeyword {
  keyword: string;
  competitors: Array<{
    label: string;
    url: string;
    occurrences: number;
    buckets: Bucket[];
  }>;
}
