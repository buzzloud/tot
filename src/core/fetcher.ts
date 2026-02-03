import type { ProxySettings } from "../types";

interface ProxyAttempt {
  name: string;
  url: string;
}

const DEFAULT_SETTINGS: ProxySettings = {
  mode: "auto",
  customTemplate: "",
  timeoutMs: 15000,
  renderJs: false
};

const PUBLIC_PROXIES: ProxyAttempt[] = [
  {
    name: "AllOrigins",
    url: "https://api.allorigins.win/raw?url={url}"
  },
  {
    name: "CorsProxyIO",
    url: "https://corsproxy.io/?{url}"
  }
];

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
  /cf-error-details/i,
  /keyword presence & competitor gap analyzer/i,
  /app not initialized/i,
  /keyword groups/i,
  /npm run dev/i
];

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  if (!text) {
    return 0;
  }
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

function isLikelyBlocked(html: string): boolean {
  const trimmed = html.trim();
  if (trimmed.length < 1200) {
    return true;
  }

  const text = stripHtmlToText(trimmed);
  const wordCount = countWords(text);
  const patternMatch = BLOCK_PATTERNS.some((pattern) => pattern.test(trimmed));

  return patternMatch && wordCount < 200;
}

function applyTemplate(template: string, targetUrl: string): string {
  const encoded = encodeURIComponent(targetUrl);
  let result = template;
  if (result.includes("{url_raw}")) {
    result = result.split("{url_raw}").join(targetUrl);
  }
  if (result.includes("{url}")) {
    result = result.split("{url}").join(encoded);
  }
  if (result === template) {
    result = `${template}${encoded}`;
  }
  return result;
}

function buildAttempts(targetUrl: string, settings: ProxySettings): ProxyAttempt[] {
  const attempts: ProxyAttempt[] = [];
  const localProxyBase = "http://localhost:8787/proxy?url=";

  if (settings.renderJs && settings.mode !== "custom") {
    attempts.push({
      name: "LocalProxy Rendered (localhost:8787)",
      url: applyTemplate(localProxyBase, targetUrl) + "&render=1"
    });
  }

  if (settings.mode === "auto") {
    attempts.push({ name: "Direct", url: targetUrl });
  }

  if (settings.customTemplate) {
    attempts.push({
      name: "Custom",
      url: applyTemplate(settings.customTemplate, targetUrl)
    });
  }

  if (settings.mode !== "custom") {
    attempts.push({
      name: "LocalProxy (localhost:8787)",
      url: applyTemplate(localProxyBase, targetUrl)
    });
  }

  if (settings.mode === "auto") {
    PUBLIC_PROXIES.forEach((proxy) => {
      attempts.push({
        name: proxy.name,
        url: applyTemplate(proxy.url, targetUrl)
      });
    });
  }

  if (attempts.length === 0) {
    attempts.push({ name: "Direct", url: targetUrl });
  }

  return attempts;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchHtml(
  targetUrl: string,
  settings: ProxySettings = DEFAULT_SETTINGS
): Promise<string> {
  const attempts = buildAttempts(targetUrl, settings);
  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const response = await fetchWithTimeout(attempt.url, settings.timeoutMs);

      if (response.type === "opaque") {
        throw new Error("Opaque response (CORS blocked)");
      }

      const html = await response.text();

      if (!response.ok) {
        const detail = html && html.length < 300 ? html : `HTTP ${response.status}`;
        throw new Error(detail);
      }
      if (!html) {
        throw new Error("Empty response");
      }

      if (isLikelyBlocked(html)) {
        throw new Error(`Blocked or empty content detected (length ${html.length})`);
      }

      return html;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push(`${attempt.name}: ${message}`);
    }
  }

  throw new Error(`All fetch attempts failed. ${errors.join(" | ")}`);
}
