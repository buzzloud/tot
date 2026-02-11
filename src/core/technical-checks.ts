import type { TechnicalCheckRow, TechnicalCheckStatus } from "../types";

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

function buildRow(
  key: string,
  label: string,
  status: TechnicalCheckStatus,
  summary: string,
  details: string
): TechnicalCheckRow {
  return { key, label, status, summary, details };
}

function analyzeHeaderHierarchy(main: Element | null): TechnicalCheckRow {
  const headings = main ? Array.from(main.querySelectorAll("h1, h2, h3, h4, h5, h6")) : [];
  const levels = headings.map((heading) => Number(heading.tagName.toLowerCase().slice(1)));
  const levelCounts = [1, 2, 3, 4, 5, 6].reduce<Record<number, number>>((acc, level) => {
    acc[level] = levels.filter((item) => item === level).length;
    return acc;
  }, {});

  let jumps = 0;
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] - levels[index - 1] > 1) {
      jumps += 1;
    }
  }

  const failures: string[] = [];
  if (levelCounts[1] === 0) {
    failures.push("missing H1");
  }
  if (levelCounts[1] > 1) {
    failures.push("multiple H1");
  }
  if (jumps > 0) {
    failures.push(`hierarchy jumps=${jumps}`);
  }

  const status: TechnicalCheckStatus = failures.length > 0 ? "fail" : "pass";
  const summary = `H1=${levelCounts[1]}, H2=${levelCounts[2]}, H3=${levelCounts[3]}, H4=${levelCounts[4]}, H5=${levelCounts[5]}, H6=${levelCounts[6]}, jumps=${jumps}`;
  const details =
    failures.length > 0
      ? `Issues: ${failures.join("; ")}`
      : "Heading order is valid for H1-H6.";

  return buildRow("header-hierarchy", "Header hierarchy (H1-H6)", status, summary, details);
}

function analyzeCanonical(doc: Document, pageUrl: string): TechnicalCheckRow {
  const links = Array.from(doc.querySelectorAll("link[rel]")).filter((link) => {
    const rel = (link.getAttribute("rel") || "").toLowerCase();
    return rel.split(/\s+/).includes("canonical");
  });

  if (links.length === 0) {
    return buildRow(
      "canonical",
      "Canonical tag",
      "fail",
      "canonical count=0",
      "No canonical link tag found."
    );
  }

  if (links.length > 1) {
    return buildRow(
      "canonical",
      "Canonical tag",
      "fail",
      `canonical count=${links.length}`,
      "Multiple canonical link tags found."
    );
  }

  const href = (links[0].getAttribute("href") || "").trim();
  if (!href) {
    return buildRow(
      "canonical",
      "Canonical tag",
      "fail",
      "canonical href is empty",
      "Canonical href is empty."
    );
  }

  try {
    const resolved = new URL(href, pageUrl);
    if (!["http:", "https:"].includes(resolved.protocol)) {
      return buildRow(
        "canonical",
        "Canonical tag",
        "fail",
        "canonical protocol invalid",
        `Canonical protocol is not http/https: ${resolved.protocol}`
      );
    }

    return buildRow(
      "canonical",
      "Canonical tag",
      "pass",
      "canonical count=1",
      `Resolved canonical: ${resolved.toString()}`
    );
  } catch {
    return buildRow(
      "canonical",
      "Canonical tag",
      "fail",
      "canonical URL invalid",
      "Canonical href cannot be resolved as a valid URL."
    );
  }
}

function analyzeBrokenAnchors(main: Element | null): TechnicalCheckRow {
  const anchors = main ? Array.from(main.querySelectorAll("a[href]")) : [];
  const brokenCount = anchors.reduce((count, anchor) => {
    const href = (anchor.getAttribute("href") || "").trim();
    if (href === "" || href === "#") {
      return count + 1;
    }
    return count;
  }, 0);

  const status: TechnicalCheckStatus = brokenCount > 0 ? "fail" : "pass";
  const summary = `Broken ${brokenCount} of ${anchors.length} anchors`;
  const details =
    brokenCount > 0
      ? "Found anchors with empty href or # only."
      : "No empty or # only anchors found.";

  return buildRow("broken-anchors", "Broken anchor links", status, summary, details);
}

function analyzeMetaDuplicates(doc: Document): TechnicalCheckRow {
  const titleCount = doc.querySelectorAll("title").length;
  const metaDescriptionCount = Array.from(doc.querySelectorAll("meta[name]")).filter(
    (meta) => (meta.getAttribute("name") || "").toLowerCase() === "description"
  ).length;

  let status: TechnicalCheckStatus = "pass";
  let details = "Single title and meta description tags found.";

  if (titleCount > 1 || metaDescriptionCount > 1) {
    status = "fail";
    details = "Duplicate title or meta description tags detected.";
  } else if (titleCount === 0 || metaDescriptionCount === 0) {
    status = "warn";
    details = "Missing title or meta description tag.";
  }

  return buildRow(
    "meta-duplicates",
    "Meta tag duplicates",
    status,
    `title=${titleCount}, meta description=${metaDescriptionCount}`,
    details
  );
}

function analyzeImageAltClassification(main: Element | null): TechnicalCheckRow {
  const images = main ? Array.from(main.querySelectorAll("img")) : [];
  const total = images.length;
  let decorative = 0;
  let content = 0;
  let missing = 0;

  images.forEach((image) => {
    if (!image.hasAttribute("alt")) {
      missing += 1;
      return;
    }

    const altText = cleanText(image.getAttribute("alt") || "");
    if (altText.length === 0) {
      decorative += 1;
      return;
    }

    content += 1;
  });

  let status: TechnicalCheckStatus = "pass";
  let details = "All images have alt attributes.";
  if (total === 0) {
    status = "warn";
    details = "No images found in main content.";
  } else if (missing > 0) {
    status = "fail";
    details = "Some images are missing alt attributes.";
  }

  return buildRow(
    "image-alt-classification",
    "Decorative vs content images",
    status,
    `content=${content}, decorative=${decorative}, missing alt=${missing}`,
    details
  );
}

function analyzeResponsiveImages(main: Element | null): TechnicalCheckRow {
  const images = main ? Array.from(main.querySelectorAll("img")) : [];
  const totalImages = images.length;
  const pictureCount = main ? main.querySelectorAll("picture").length : 0;
  const imgSrcsetCount = images.reduce((count, image) => {
    const srcset = (image.getAttribute("srcset") || "").trim();
    return srcset ? count + 1 : count;
  }, 0);
  const sourceSrcsetCount = main
    ? Array.from(main.querySelectorAll("source[srcset]")).reduce((count, source) => {
        const srcset = (source.getAttribute("srcset") || "").trim();
        return srcset ? count + 1 : count;
      }, 0)
    : 0;

  let status: TechnicalCheckStatus = "pass";
  let details = "Responsive image signals detected.";

  if (totalImages === 0) {
    status = "warn";
    details = "No images found in main content.";
  } else if (pictureCount === 0 && imgSrcsetCount === 0 && sourceSrcsetCount === 0) {
    status = "fail";
    details = "No picture/srcset usage detected in main content.";
  }

  return buildRow(
    "responsive-images",
    "Responsive image usage",
    status,
    `picture=${pictureCount}, img[srcset]=${imgSrcsetCount}, source[srcset]=${sourceSrcsetCount}`,
    details
  );
}

function analyzeImageDimensions(main: Element | null): TechnicalCheckRow {
  const images = main ? Array.from(main.querySelectorAll("img")) : [];
  const total = images.length;
  const withDimensions = images.reduce((count, image) => {
    const width = (image.getAttribute("width") || "").trim();
    const height = (image.getAttribute("height") || "").trim();
    if (width && height) {
      return count + 1;
    }
    return count;
  }, 0);
  const missing = total - withDimensions;

  let status: TechnicalCheckStatus = "pass";
  let details = "All images have width and height attributes.";

  if (total === 0) {
    status = "warn";
    details = "No images found in main content.";
  } else if (missing > 0) {
    status = "fail";
    details = "Some images are missing width or height attributes.";
  }

  return buildRow(
    "image-dimensions",
    "Image dimensions",
    status,
    `with dimensions=${withDimensions}/${total}, missing=${missing}`,
    details
  );
}

export function analyzeMyUrlTechnicalChecks(params: {
  html: string;
  pageUrl: string;
}): TechnicalCheckRow[] {
  const parser = new DOMParser();
  const fullDoc = parser.parseFromString(params.html, "text/html");
  const prunedDoc = parser.parseFromString(params.html, "text/html");

  REMOVE_SELECTORS.forEach((selector) => {
    prunedDoc.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const main = selectMain(prunedDoc);

  return [
    analyzeHeaderHierarchy(main),
    analyzeCanonical(fullDoc, params.pageUrl),
    analyzeBrokenAnchors(main),
    analyzeMetaDuplicates(fullDoc),
    analyzeImageAltClassification(main),
    analyzeResponsiveImages(main),
    analyzeImageDimensions(main)
  ];
}
