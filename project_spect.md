# project_spect.md - Keyword Presence and Competitor Gap Analyzer

## How to launch the project

```bash
# 1) Install dependencies
npm install

# 2) Start local proxy (Terminal 1)
npm run proxy

# 3) Start app (Terminal 2)
npm run dev
```

Open `http://localhost:5173`.

Optional (needed only when "Render JS pages" is enabled in Fetch & Proxy):

```bash
npx playwright install
```

Optional (needed only for SERP check):

```powershell
$env:SERPAPI_KEY="your_key_here"
npm run proxy
```

## 1) Product purpose

The app compares your page against competitor pages for a selected keyword group, then shows where your page is strong and where competitors have coverage you are missing.

Primary goals:
- detect keyword presence by on-page buckets (`title`, `meta`, `h1`, `h2`, `h3`, `body`),
- show content/SEO structure checks in one place,
- identify competitive keyword gaps,
- let you run quick SERP position checks from any keyword row,
- keep ranking snapshots in history and archive.

## 2) Core workflow

1. Create/select a keyword group.
2. Enter `My URL` and up to 10 competitor URLs.
3. Choose fetch/proxy mode.
4. Run analysis.
5. Review summary tables, keyword tables, and gap output.
6. Click planet icon on a keyword to open SERP ranking window.
7. Save SERP snapshots automatically to Rankings History and move older checks to Archive when needed.

## 3) Implemented features (purpose + functionality)

### 3.1 Keyword groups
Purpose:
- keep reusable keyword sets by topic/campaign.

Functionality:
- create, edit, update, delete keyword groups,
- one keyword per line,
- duplicate normalization,
- warning for very short keywords,
- panel is collapsible and closed by default.

### 3.2 Analyzer input
Purpose:
- define one target page and competitor set per run.

Functionality:
- `My URL` + up to 10 competitor URLs,
- URL validation before run,
- group selection required.

### 3.3 Fetch and proxy system
Purpose:
- improve reliability for pages that block browser fetches.

Functionality:
- modes: `Auto`, `Local proxy only`, `Custom proxy only`,
- local proxy endpoint: `http://localhost:8787/proxy`,
- custom template supports `{url}` and `{url_raw}`,
- optional JS render mode via Playwright,
- panel is collapsible and closed by default,
- blocked/empty response heuristics with fallback attempts.

### 3.4 Content extraction
Purpose:
- focus analysis on meaningful page content.

Functionality:
- removes common non-content blocks,
- selects best content container using layered selectors,
- falls back to fuller extraction when content is too small,
- extracts:
  - title,
  - meta description,
  - H1/H2/H3 text,
  - body text,
  - first 100 words after first H1,
  - image ALT texts and counters.

### 3.5 Keyword matching engine
Purpose:
- produce predictable, bucket-level keyword coverage metrics.

Functionality:
- case-insensitive matching,
- Unicode NFKC normalization,
- punctuation and whitespace normalization,
- whole-word style matching for single words,
- flexible whitespace phrase matching for multi-word phrases,
- per-keyword counts for `title`, `meta`, `h1`, `h2`, `h3`, `body` and total.

### 3.6 Labeling and page identity
Purpose:
- keep competitor references readable and actionable.

Functionality:
- labels use domain values instead of `Competitor 1/2/...`,
- my page label format: `Your Site (domain)`,
- in result tables, `Page` cell shows label + full URL on second line,
- separate URL columns removed from summary/check tables.

### 3.7 Results tables

#### A) Title / Meta / H1 Summary
Purpose:
- quick view of primary on-page targeting fields.

Functionality:
- columns: `Page`, `Title`, `Meta Description`, `H1`,
- highlights matched group keywords,
- buttons:
  - `Copy competitor titles`,
  - `Copy competitor meta`.

#### B) First 100 Words After H1
Purpose:
- validate early body relevance immediately after H1.

Functionality:
- columns: `Page`, `Keyword Found`, `Matched Keywords`,
- checks first 100 words after first H1 only.

#### C) Keyword results (per URL panel)
Purpose:
- detailed keyword distribution across buckets.

Functionality:
- columns: `Keyword`, `Found`, `Total`, `Title`, `Meta`, `H1`, `H2`, `H3`, `Body`,
- keyword click copies text,
- planet icon button runs SERP check for that keyword,
- my URL panel:
  - shows found keywords in table,
  - missing keywords in collapsed "Show missing keywords" block,
  - marks missing terms found on competitors with `Gap` badge,
- competitor panels:
  - show found keywords only,
  - rows highlighted when keyword is found on competitor and missing on my URL.

#### D) Content Structure Checks
Purpose:
- detect content scaffolding that often improves UX/SEO.

Functionality:
- checks:
  - table-of-contents style jump links to existing section IDs,
  - data-table usage,
- columns: `Page`, `TOC Present`, `TOC Details`, `Data Tables Present`, `Table Details`.

#### E) FAQ Presence
Purpose:
- detect FAQ-style sections from heading/body language.

Functionality:
- phrase list matching in `h2 + h3 + body`,
- includes phrase `learn more about`,
- columns: `Page`, `FAQ Present`, `Matched Phrases`.

#### F) Reviews Presence
Purpose:
- detect social proof/review section signals.

Functionality:
- phrase list matching in `h2 + h3 + body`,
- columns: `Page`, `Reviews Present`, `Matched Phrases`.

#### G) Schema Presence
Purpose:
- detect structured data implementation signals.

Functionality:
- checks raw HTML for:
  - JSON-LD,
  - Microdata,
  - RDFa,
- columns: `Page`, `Schema Present`, `Detected Types`.

#### H) Image ALT Check (Page Content)
Purpose:
- audit image ALT coverage and keyword usage.

Functionality:
- columns: `Page`, `ALT Fulfilled`, `ALT Coverage`, `Missing ALTs`, `ALT Phrases Used`, `Matched Group Keywords`,
- `ALT Fulfilled = Yes` when all content images have ALT (or no images).

#### I) Video Embed Checks
Purpose:
- detect embedded video presence in main content.

Functionality:
- checks iframe embeds for YouTube/Vimeo,
- columns: `Page`, `Video Embeds Present`, `Total Embeds`, `YouTube`, `Vimeo`.

#### J) My URL Technical Checks
Purpose:
- run deterministic technical QA for the primary URL.

Functionality:
- checks (my URL only):
  1. Header hierarchy validation (`H1-H6`, including jump detection),
  2. Canonical tag presence and validity,
  3. Broken anchors (`href=""` or `href="#"`),
  4. Meta tag duplicates (`title`, `meta[name=description]`),
  5. Decorative vs content images (`alt=""` vs text),
  6. Responsive image signals (`picture`, `img[srcset]`, `source[srcset]`),
  7. Image dimensions (`width` + `height` attrs),
- status: `Pass`, `Fail`, `Warn`.

#### K) Gap keywords
Purpose:
- summarize terms competitors rank for on-page but my URL misses.

Functionality:
- shows keyword + competitor list + occurrence buckets.

### 3.8 SERP check from keyword rows
Purpose:
- inspect live ranking context for a selected keyword.

Functionality:
- planet icon opens a new SERP window,
- SERP controls appear before "Show missing keywords" in My URL panel:
  - location input,
  - UK city typeahead suggestions from `src/data/uk-major-cities-50k.json`,
  - device toggle: `Desktop | Mobile`,
- uses Google UK defaults:
  - `google.co.uk`,
  - `gl=uk`, `hl=en`,
- scans top 60 depth,
- if target URL is not found: shows `Not in top 60`,
- SERP window displays:
  - target page positions,
  - Top 10 organic,
  - People Also Ask,
  - People Also Search For,
  - request params and scan depth notes.

### 3.9 Rankings History and Archive
Purpose:
- keep a local audit trail of SERP checks over time.

Functionality:
- every SERP check is saved automatically to Rankings History,
- each history entry is collapsed by default and expandable,
- each active entry has `Archive` button,
- archiving removes entry from active list and moves it to separate `Rankings Archive` section,
- archive entries are also collapsed by default,
- `Clear history` clears active history only.

### 3.10 Export
Purpose:
- share/download an analysis snapshot.

Functionality:
- HTML export implemented,
- PDF button exists but PDF generation is not implemented yet.

## 4) Current panel order in UI

1. `Keyword Groups` (collapsed by default)
2. `Analyzer`
3. `Fetch & Proxy` (collapsed by default)
4. `Results`
   - Title / Meta / H1 Summary
   - First 100 Words After H1
   - URL keyword result panels
   - Content Structure Checks
   - FAQ Presence
   - Reviews Presence
   - Schema Presence
   - Image ALT Check
   - Video Embed Checks
   - My URL Technical Checks
   - Gap keywords
5. `Rankings History`
6. `Rankings Archive`

## 5) Storage and persistence

LocalStorage keys are used for:
- keyword groups,
- proxy settings,
- SERP location/device preferences,
- rankings history,
- rankings archive.

## 6) Module structure

- `src/core`
  - `fetcher.ts`, `extractor.ts`, `normalizer.ts`, `matcher.ts`, `analyzer.ts`, `reporter.ts`, `summary.ts`, `first100.ts`, `content-structure.ts`, `faq.ts`, `reviews.ts`, `schema.ts`, `image-alts.ts`, `video-embeds.ts`, `technical-checks.ts`, `exporters.ts`
- `src/app`
  - `ui.ts`, `summary-ui.ts`, `first100-ui.ts`, `content-structure-ui.ts`, `faq-ui.ts`, `reviews-ui.ts`, `schema-ui.ts`, `image-alts-ui.ts`, `video-embeds-ui.ts`, `technical-checks-ui.ts`, `rankings-history-ui.ts`, `serp-window.ts`, `page-cell.ts`
- `src/storage`
  - `keyword-groups.ts`, `proxy-settings.ts`, `rankings-history.ts`
- `src/data`
  - `uk-major-cities-50k.json`
- `scripts`
  - `proxy-server.mjs`

## 7) Known constraints

- Some sites block scraping or serve anti-bot pages.
- JS-heavy sites may require `Render JS pages` (Playwright).
- Main-content extraction is heuristic and may vary by site structure.
- SERP quality/coverage depends on SerpApi response and API key limits.
- HTML export currently includes keyword tables only (not all advanced result tables).
