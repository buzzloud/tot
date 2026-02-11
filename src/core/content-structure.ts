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

function parseHashId(href: string): string {
  const value = href.trim();
  if (!value.startsWith("#")) {
    return "";
  }
  const rawId = value.slice(1).trim();
  if (!rawId) {
    return "";
  }
  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
}

export interface ContentStructureCheck {
  tocPresent: boolean;
  tocJumpLinks: number;
  tocMatchedSections: number;
  tableUsagePresent: boolean;
  dataTableCount: number;
  totalTableCount: number;
}

function isLikelyDataTable(table: HTMLTableElement): boolean {
  if (table.querySelector("th, thead, caption")) {
    return true;
  }

  const rows = table.rows.length;
  const firstRowCols = table.rows[0]?.cells.length || 0;
  return rows >= 2 && firstRowCols >= 2;
}

export function detectContentStructure(html: string): ContentStructureCheck {
  const parser = new DOMParser();
  const fullDoc = parser.parseFromString(html, "text/html");
  const prunedDoc = parser.parseFromString(html, "text/html");

  REMOVE_SELECTORS.forEach((selector) => {
    prunedDoc.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const main = selectMain(prunedDoc);
  const scope = main || prunedDoc.body;

  const anchors = scope ? Array.from(scope.querySelectorAll("a[href]")) : [];
  const ids = new Set<string>();
  let tocJumpLinks = 0;

  anchors.forEach((anchor) => {
    const href = (anchor.getAttribute("href") || "").trim();
    if (href === "#" || !href.startsWith("#")) {
      return;
    }
    const id = parseHashId(href);
    if (!id) {
      return;
    }
    tocJumpLinks += 1;
    ids.add(id);
  });

  let tocMatchedSections = 0;
  ids.forEach((id) => {
    if (fullDoc.getElementById(id)) {
      tocMatchedSections += 1;
    }
  });

  const tocPresent = tocJumpLinks >= 2 && tocMatchedSections >= 2;

  const tables = scope ? Array.from(scope.querySelectorAll("table")) : [];
  const totalTableCount = tables.length;
  const dataTableCount = tables.filter((table) =>
    isLikelyDataTable(table as HTMLTableElement)
  ).length;
  const tableUsagePresent = dataTableCount > 0;

  return {
    tocPresent,
    tocJumpLinks,
    tocMatchedSections,
    tableUsagePresent,
    dataTableCount,
    totalTableCount
  };
}
