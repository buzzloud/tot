import type { ExtractedContent } from "../types";

const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
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

function getTextStats(node: ParentNode): { text: string; wordCount: number } {
  const text = cleanText(node.textContent || "");
  return { text, wordCount: getWordCount(text) };
}

function collectHeadingText(root: ParentNode, selector: string): string {
  const items = Array.from(root.querySelectorAll(selector))
    .map((el) => cleanText(el.textContent || ""))
    .filter((text) => text.length > 0);

  return items.join(" ");
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

function buildContent(main: Element | null, title: string, metaDescription: string): ExtractedContent {
  const h1 = main ? collectHeadingText(main, "h1") : "";
  const h2 = main ? collectHeadingText(main, "h2") : "";
  const h3 = main ? collectHeadingText(main, "h3") : "";

  let bodyText = "";
  if (main) {
    const clone = main.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("h1, h2, h3").forEach((el) => el.remove());
    bodyText = cleanText(clone.textContent || "");
  }

  const mainText = main ? cleanText(main.textContent || "") : "";
  const wordCount = getWordCount(mainText);
  const previewText = mainText.slice(0, 280);

  return {
    title,
    metaDescription,
    h1,
    h2,
    h3,
    body: bodyText,
    wordCount,
    source: "pruned",
    previewText
  };
}

export function extractContent(html: string): ExtractedContent {
  const parser = new DOMParser();
  const fullDoc = parser.parseFromString(html, "text/html");
  const prunedDoc = parser.parseFromString(html, "text/html");

  if (!fullDoc || !fullDoc.body || !prunedDoc || !prunedDoc.body) {
    return {
      title: "",
      metaDescription: "",
      h1: "",
      h2: "",
      h3: "",
      body: "",
      wordCount: 0,
      source: "pruned",
      previewText: ""
    };
  }

  REMOVE_SELECTORS.forEach((selector) => {
    prunedDoc.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const title = cleanText(fullDoc.querySelector("title")?.textContent || "");
  const metaDescription = cleanText(
    fullDoc.querySelector("meta[name='description']")?.getAttribute("content") || ""
  );

  const prunedMain = selectMain(prunedDoc);
  const fullMain = selectMain(fullDoc);

  const prunedContent = buildContent(prunedMain, title, metaDescription);
  const fullContent = buildContent(fullMain, title, metaDescription);

  const ratio =
    fullContent.wordCount > 0
      ? prunedContent.wordCount / fullContent.wordCount
      : 1;
  const useFull =
    (prunedContent.wordCount < MIN_MAIN_WORDS &&
      fullContent.wordCount > prunedContent.wordCount) ||
    ratio < 0.5;

  if (useFull) {
    return { ...fullContent, source: "full" };
  }

  return { ...prunedContent, source: "pruned" };
}
