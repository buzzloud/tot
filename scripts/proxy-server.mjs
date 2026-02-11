import http from "node:http";

const PORT = Number(process.env.PORT || 8787);

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
}

const BLOCK_PATTERNS = [
  /enable javascript/i,
  /access denied/i,
  /verify you are/i,
  /captcha/i,
  /attention required/i,
  /unusual traffic/i,
  /bot detection/i,
  /request blocked/i,
  /service unavailable/i,
  /checking your browser/i,
  /cf-browser-verification/i,
  /cf-error-details/i
];

function stripHtmlToText(html) {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text) {
  if (!text) {
    return 0;
  }
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

function isBlockedHtml(html) {
  const trimmed = (html || "").trim();
  if (trimmed.length < 1200) {
    return true;
  }

  const text = stripHtmlToText(trimmed);
  const wordCount = countWords(text);
  const patternMatch = BLOCK_PATTERNS.some((pattern) => pattern.test(trimmed));

  return patternMatch && wordCount < 200;
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function normalizeDomain(urlValue) {
  try {
    const parsed = new URL(urlValue);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function toStringValue(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function toNumberValue(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeOrganicResult(result, start, index) {
  const link = typeof result.link === "string" ? result.link : "";
  const title = typeof result.title === "string" ? result.title : "";
  const snippet = typeof result.snippet === "string" ? result.snippet : "";
  const rawPos = Number(result.position);

  let position = start + index + 1;
  if (Number.isFinite(rawPos)) {
    if (rawPos <= 10 && start > 0) {
      position = start + rawPos;
    } else {
      position = rawPos;
    }
  }

  return {
    position,
    title,
    link,
    domain: normalizeDomain(link),
    snippet
  };
}

function getMatchedRanks(targets, organicResults) {
  const rows = targets.map((target) => ({
    label: target.label,
    url: target.url,
    domain: normalizeDomain(target.url),
    position: null,
    title: "",
    resultUrl: ""
  }));

  for (const result of organicResults) {
    const resultUrl = typeof result.link === "string" ? result.link : "";
    if (!resultUrl) {
      continue;
    }
    const resultDomain = normalizeDomain(resultUrl);
    if (!resultDomain) {
      continue;
    }

    for (const row of rows) {
      if (row.position !== null || !row.domain) {
        continue;
      }
      if (row.domain !== resultDomain) {
        continue;
      }
      row.position = Number.isFinite(result.position) ? Number(result.position) : null;
      row.title = typeof result.title === "string" ? result.title : "";
      row.resultUrl = resultUrl;
    }
  }

  return rows;
}

function getTopOrganicResults(organicResults, limit = 10) {
  return organicResults.slice(0, limit).map((result, index) => {
    const link = typeof result.link === "string" ? result.link : "";
    const title = typeof result.title === "string" ? result.title : "";
    const snippet = typeof result.snippet === "string" ? result.snippet : "";
    const position = Number.isFinite(result.position) ? Number(result.position) : index + 1;

    return {
      position,
      title,
      link,
      domain: normalizeDomain(link),
      snippet
    };
  });
}

function getPeopleAlsoAsk(data) {
  const items = Array.isArray(data.related_questions) ? data.related_questions : [];
  return items.slice(0, 10).map((item) => ({
    question: typeof item.question === "string" ? item.question : "",
    snippet: typeof item.snippet === "string" ? item.snippet : "",
    link: typeof item.link === "string" ? item.link : ""
  }));
}

function getPeopleAlsoSearchFor(data) {
  const directItems = Array.isArray(data.people_also_search_for)
    ? data.people_also_search_for
    : [];

  if (directItems.length > 0) {
    return directItems.slice(0, 10).map((item) => ({
      query:
        (typeof item.query === "string" && item.query) ||
        (typeof item.name === "string" && item.name) ||
        "",
      link: typeof item.link === "string" ? item.link : ""
    }));
  }

  const related = Array.isArray(data.related_searches) ? data.related_searches : [];
  const filtered = related.filter((item) => {
    if (typeof item.block_position !== "number") {
      return false;
    }
    return item.block_position === 1;
  });

  if (filtered.length > 0) {
    return filtered.slice(0, 10).map((item) => ({
      query: typeof item.query === "string" ? item.query : "",
      link: typeof item.link === "string" ? item.link : ""
    }));
  }

  return related.slice(0, 10).map((item) => ({
    query: typeof item.query === "string" ? item.query : "",
    link: typeof item.link === "string" ? item.link : ""
  }));
}

async function fetchSerpPage({
  apiKey,
  keyword,
  location,
  hl,
  gl,
  googleDomain,
  device,
  start,
  num
}) {
  const query = new URLSearchParams({
    engine: "google",
    q: keyword,
    location,
    hl,
    gl,
    google_domain: googleDomain,
    device,
    start: String(start),
    num: String(num),
    api_key: apiKey
  });

  const upstream = await fetch(`https://serpapi.com/search.json?${query.toString()}`, {
    headers: {
      Accept: "application/json"
    }
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return {
      ok: false,
      status: upstream.status,
      data: null,
      text
    };
  }

  try {
    return {
      ok: true,
      status: upstream.status,
      data: JSON.parse(text),
      text
    };
  } catch {
    return {
      ok: false,
      status: 502,
      data: null,
      text: "SerpApi returned invalid JSON."
    };
  }
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

async function handleSerpRequest(req, res) {
  if (req.method !== "POST") {
    writeJson(res, 405, { error: "Use POST for /serp" });
    return;
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    writeJson(res, 500, {
      error: "SERPAPI_KEY is not set. Start proxy with SERPAPI_KEY environment variable."
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    writeJson(res, 400, { error: "Invalid JSON body." });
    return;
  }

  const keyword = toStringValue(body.keyword, "");
  if (!keyword) {
    writeJson(res, 400, { error: "Missing keyword." });
    return;
  }

  const targets = Array.isArray(body.targets)
    ? body.targets
        .filter(
          (item) =>
            item &&
            typeof item.label === "string" &&
            item.label.trim().length > 0 &&
            typeof item.url === "string" &&
            item.url.trim().length > 0
        )
        .map((item) => ({ label: item.label.trim(), url: item.url.trim() }))
    : [];

  if (targets.length === 0) {
    writeJson(res, 400, { error: "Missing targets." });
    return;
  }

  const location = toStringValue(body.location, "United States");
  const hl = toStringValue(body.hl, "en");
  const gl = toStringValue(body.gl, "us");
  const googleDomain = toStringValue(body.googleDomain, "google.com");
  const device = toStringValue(body.device, "desktop").toLowerCase() === "mobile" ? "mobile" : "desktop";
  const scanDepth = clamp(toNumberValue(body.scanDepth, 60), 10, 100);
  const pageSize = 10;
  const requestedNum = clamp(toNumberValue(body.num, 60), 10, 100);

  try {
    let firstPageData = null;
    const combinedOrganic = [];

    for (let start = 0; start < scanDepth; start += pageSize) {
      const page = await fetchSerpPage({
        apiKey,
        keyword,
        location,
        hl,
        gl,
        googleDomain,
        device,
        start,
        num: pageSize
      });

      if (!page.ok || !page.data) {
        writeJson(res, page.status || 502, {
          error: `SerpApi request failed at start=${start}.`,
          details: page.text
        });
        return;
      }

      if (!firstPageData) {
        firstPageData = page.data;
      }

      const organicOnPage = Array.isArray(page.data.organic_results)
        ? page.data.organic_results
        : [];

      if (organicOnPage.length === 0) {
        break;
      }

      organicOnPage.forEach((item, index) => {
        combinedOrganic.push(normalizeOrganicResult(item, start, index));
      });

    }

    if (!firstPageData) {
      writeJson(res, 502, { error: "No SERP data returned." });
      return;
    }

    const rankedTargets = getMatchedRanks(targets, combinedOrganic);
    const topOrganic = getTopOrganicResults(combinedOrganic, 10);
    const peopleAlsoAsk = getPeopleAlsoAsk(firstPageData);
    const peopleAlsoSearchFor = getPeopleAlsoSearchFor(firstPageData);

    writeJson(res, 200, {
      keyword,
      params: {
        location,
        hl,
        gl,
        google_domain: googleDomain,
        device,
        num: requestedNum,
        scanDepth,
        pageSize
      },
      totalOrganic: combinedOrganic.length,
      targets: rankedTargets,
      topOrganic,
      peopleAlsoAsk,
      peopleAlsoSearchFor
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SerpApi error";
    writeJson(res, 502, { error: `SERP lookup failed: ${message}` });
  }
}

async function tryRenderedResponse(targetUrl, res) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    res.writeHead(501);
    res.end("Playwright not installed. Run: npm install -D playwright && npx playwright install");
    return true;
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
    const content = await page.content();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(content);
    return true;
  } finally {
    await browser.close();
  }
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (!req.url) {
    res.writeHead(400);
    res.end("Missing request URL");
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  if (requestUrl.pathname === "/serp") {
    await handleSerpRequest(req, res);
    return;
  }

  if (requestUrl.pathname !== "/proxy") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const target = requestUrl.searchParams.get("url");
  const render = requestUrl.searchParams.get("render") === "1";
  if (!target) {
    res.writeHead(400);
    res.end("Missing url parameter");
    return;
  }

  let parsedTarget;
  try {
    parsedTarget = new URL(target);
  } catch {
    res.writeHead(400);
    res.end("Invalid url parameter");
    return;
  }

  if (!["http:", "https:"].includes(parsedTarget.protocol)) {
    res.writeHead(400);
    res.end("Only http/https URLs are supported");
    return;
  }

  try {
    if (render) {
      await tryRenderedResponse(parsedTarget.toString(), res);
      return;
    }

    const upstream = await fetch(parsedTarget.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Upgrade-Insecure-Requests": "1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    const status = upstream.status;
    const contentType = upstream.headers.get("content-type") || "text/html";
    const html = await upstream.text();

    const shouldRender =
      isBlockedHtml(html) || [401, 403, 429, 503].includes(status);

    if (shouldRender) {
      const handled = await tryRenderedResponse(parsedTarget.toString(), res);
      if (handled) {
        return;
      }
    }

    res.writeHead(status, { "Content-Type": contentType });
    res.end(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown proxy error";
    res.writeHead(502);
    res.end(`Proxy error: ${message}`);
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Proxy server running on http://localhost:${PORT}/proxy and /serp`);
});
