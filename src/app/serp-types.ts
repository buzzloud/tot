export interface SerpTargetResponse {
  label: string;
  url: string;
  domain: string;
  position: number | null;
  title?: string;
  resultUrl?: string;
}

export interface SerpResponse {
  keyword: string;
  params: {
    location: string;
    hl: string;
    gl: string;
    google_domain: string;
    device?: "desktop" | "mobile";
    num: number;
    scanDepth?: number;
    pageSize?: number;
  };
  totalOrganic: number;
  targets: SerpTargetResponse[];
  topOrganic: Array<{
    position: number;
    title: string;
    link: string;
    domain: string;
    snippet: string;
  }>;
  peopleAlsoAsk: Array<{
    question: string;
    snippet: string;
    link: string;
  }>;
  peopleAlsoSearchFor: Array<{
    query: string;
    link: string;
  }>;
}
