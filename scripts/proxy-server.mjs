import http from "node:http";

const PORT = Number(process.env.PORT || 8787);

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
  console.log(`Proxy server running on http://localhost:${PORT}/proxy`);
});
