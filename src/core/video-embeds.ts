const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "nav",
  "header",
  "footer",
  "aside",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  ".navigation",
  ".nav",
  ".menu",
  "#navigation",
  "#nav",
  "#menu"
];

const PRIMARY_SELECTORS = "main, article, [role='main']";
const SECONDARY_SELECTORS =
  ".main-content, #main-content, .content, .entry-content, .post-content, .page-content, .entry, .post";
const GENERIC_SELECTORS = "section, div";
const MIN_MAIN_WORDS = 120;

function cleanText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function getWordCount(text: string): number {
  if (!text) {
    return 0;
  }
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

function getTextStats(node: ParentNode): { wordCount: number } {
  return { wordCount: getWordCount(cleanText(node.textContent || "")) };
}

function selectMain(doc: Document): Element | null {
  const pickBest = (nodes: Element[]): Element | null => {
    let best: Element | null = null;
    let bestCount = 0;
    nodes.forEach((node) => {
      const { wordCount } = getTextStats(node);
      if (wordCount > bestCount) {
        best = node;
        bestCount = wordCount;
      }
    });
    return best;
  };

  const primaryBest = pickBest(Array.from(doc.querySelectorAll(PRIMARY_SELECTORS)));
  const secondaryBest = pickBest(Array.from(doc.querySelectorAll(SECONDARY_SELECTORS)));
  const genericBest = pickBest(Array.from(doc.querySelectorAll(GENERIC_SELECTORS)));

  let main = primaryBest;
  if (!main || getTextStats(main).wordCount < MIN_MAIN_WORDS) {
    main = secondaryBest || main;
  }
  if (!main || getTextStats(main).wordCount < MIN_MAIN_WORDS) {
    main = genericBest || main;
  }
  if (!main || getTextStats(main).wordCount < MIN_MAIN_WORDS) {
    main = doc.body;
  }

  return main;
}

function isYouTubeSrc(src: string): boolean {
  const value = src.toLowerCase();
  return (
    value.includes("youtube.com/embed/") ||
    value.includes("youtube-nocookie.com/embed/") ||
    value.includes("youtu.be/")
  );
}

function isVimeoSrc(src: string): boolean {
  const value = src.toLowerCase();
  return value.includes("player.vimeo.com/video/") || value.includes("vimeo.com/video/");
}

export interface VideoEmbedCheck {
  videoEmbedsPresent: boolean;
  videoEmbedCount: number;
  youtubeEmbedCount: number;
  vimeoEmbedCount: number;
}

export function detectVideoEmbeds(html: string): VideoEmbedCheck {
  const parser = new DOMParser();
  const prunedDoc = parser.parseFromString(html, "text/html");

  REMOVE_SELECTORS.forEach((selector) => {
    prunedDoc.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const main = selectMain(prunedDoc);
  const scope = main || prunedDoc.body;
  const iframes = scope ? Array.from(scope.querySelectorAll("iframe[src]")) : [];

  let youtubeEmbedCount = 0;
  let vimeoEmbedCount = 0;

  iframes.forEach((iframe) => {
    const src = (iframe.getAttribute("src") || "").trim();
    if (!src) {
      return;
    }
    if (isYouTubeSrc(src)) {
      youtubeEmbedCount += 1;
      return;
    }
    if (isVimeoSrc(src)) {
      vimeoEmbedCount += 1;
    }
  });

  const videoEmbedCount = youtubeEmbedCount + vimeoEmbedCount;

  return {
    videoEmbedsPresent: videoEmbedCount > 0,
    videoEmbedCount,
    youtubeEmbedCount,
    vimeoEmbedCount
  };
}
