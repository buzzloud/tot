# Issues Log

## Issue: Competitor pages always failed to analyze
**Symptoms**
- Competitor results showed: “All fetch attempts failed … Blocked or empty content detected”.
- The error appeared even when the proxy response was a large HTML payload (200k+ characters).
- “Your Site” could work while competitors consistently failed.

**Root Cause**
- The blocked/empty detector relied on raw HTML size and block patterns only.
- Large, valid HTML documents with minimal block keywords were still being flagged as “blocked”, so analysis was aborted before parsing real content.

**Step-by-step fix**
1. **Add HTML-to-text extraction before block decisions**
   - Strip scripts/styles/tags and collapse whitespace to produce a text-only version of the response.
2. **Measure real content depth**
   - Count words in the extracted text rather than relying on raw HTML length.
3. **Require both signals to mark as blocked**
   - Only treat a page as blocked when it matches block patterns **and** has low extracted text.
4. **Apply the same logic in both fetch paths**
   - Browser fetcher (`src/core/fetcher.ts`) and local proxy (`scripts/proxy-server.mjs`) now use the same heuristics.
5. **Retest competitor URLs**
   - Competitor pages now pass the “blocked” check and get analyzed successfully.

**Files Updated**
- `src/core/fetcher.ts`
- `scripts/proxy-server.mjs`
