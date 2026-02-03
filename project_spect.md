# project_spect.md — Keyword Presence & Competitor Gap Analyzer (Browser App)

## 1) Project summary (what we’re building)
A **browser-based application** that compares **your page** against up to **10 competitor pages** by scanning the **main page text** (including **H1/H2/H3 and body copy**) for a selected **keyword group** (up to **80–100 keywords/phrases**).

The app outputs a **results table** showing, for each URL and keyword:
- **Found / Not found**
- **Occurrences** (count)
- **Location bucket(s)**: **H1**, **H2**, **H3**, **Body**
- **Gap insights**: keywords found on competitor pages but **missing on your page**
- Export a **simplified report** as **PDF** and **standalone HTML**.

A core requirement is **high-confidence, predictable keyword detection**, which is defined and testable (see Section 4).

---

## 2) Goals & constraints

### Goals
- Fast, repeatable content-gap checks across a defined set of pages.
- Keyword detection that is **case-insensitive by default** and stable across common text variations.
- Clean separation into modules so future features can be added without breaking this functionality.
- Simple exports (PDF/HTML) suitable for sharing with clients/teams.

### Constraints
- Runs primarily in the **browser**.
- Competitor pages must be fetched and parsed; this has known limitations (CORS, JS-rendered content).
- Accuracy requirements must be addressed with a robust extraction + normalization pipeline and clear detection rules.

---

## 3) Primary user workflows

### A) Manage keyword groups
1. User creates a **keyword group** with a name.
2. User enters keywords/phrases (one per line).
3. Group is saved and available in a dropdown for analysis runs.

### B) Run an analysis
1. User enters **My URL**.
2. User enters up to **10 competitor URLs**.
3. User selects a **keyword group**.
4. User clicks **Analyze**.
5. App fetches each page, extracts main text, runs keyword detection, and renders the results.

### C) Review and export
1. User reviews:
   - Per-URL keyword presence
   - Gap keywords (competitors have, mine lacks)
2. User exports:
   - **HTML report** (standalone)
   - **PDF** (simplified)

---

## 4) Keyword detection requirements (accuracy definition)

### Detection defaults (confirmed)
- **Case-insensitive matching by default**.
- Locations are reported in **high-level buckets only**: **H1 / H2 / H3 / Body**.
- Scan includes **H1/H2/H3 plus body** from the main content area (not header/nav/footer/menu).

### Normalization (required for accuracy)
Before matching, both **keywords** and **extracted text** should be normalized consistently:
- Lowercasing (case-insensitive)
- Unicode normalization (NFKC)
- Convert non-breaking spaces to spaces
- Collapse repeated whitespace to a single space
- Trim leading/trailing whitespace
- Optional: normalize common punctuation variants (smart quotes, em dashes → hyphen)

### Matching rules (recommended defaults; configurable later)
Because substring matching can create false positives (e.g., “door” in “outdoor”), the engine should support a clear default:
- **Whole-word matching for single-word keywords**
- **Phrase matching for multi-word keywords** with whitespace flexibility (collapsed whitespace)

These defaults can be exposed later as a per-group setting:
- Whole word (recommended default)
- Substring (optional)
- Stemming/lemmatization (future, not required for MVP)

### Counting occurrences
- Count total matches per bucket (H1/H2/H3/Body).
- If the same keyword appears in multiple buckets, each bucket is reported with its own count and a combined “total occurrences” per URL if needed.

### “Found” definition
- “Found” is true if occurrences > 0 in any of the included buckets.

### Acceptance accuracy tests (minimum)
- Case differences match (e.g., “Double Glazing” = “double glazing”).
- “door” does NOT match “outdoor” under whole-word mode.
- Phrase across multiple spaces/newlines matches after normalization.
- H1/H2/H3 buckets report correctly and do not include template navigation headings.

---

## 5) “Main text only” extraction requirements

### Included
- Content within the main content area:
  - H1/H2/H3 headings
  - Body copy: paragraphs, lists, table text, captions (as available)

### Excluded
- Header
- Navigation / menus
- Footer
- Sidebars (where possible, depending on markup)
- Scripts/styles and hidden elements where feasible

### Extraction strategy (robust, modular)
MVP approach (client-side DOM parsing):
1. Fetch HTML
2. Parse into DOM
3. Remove common non-content selectors (header/nav/footer/aside/menus, etc.)
4. Prefer an explicit “main” container when present:
   - main, article, [role=main], common content classes
5. If no main container is found, fall back to a best-effort heuristic (largest text block).

**Note:** Pure browser-based extraction cannot guarantee consistent results across all sites (CORS blocks, JS-rendered content). See Section 11 for mitigation options.

---

## 6) UI pages & components

### Page 1 — Keyword Groups
- Create/edit/delete keyword groups
- Keyword textarea (one per line)
- Validation:
  - Group name required
  - Deduplicate keywords (normalized)
  - Warn on very short keywords (e.g., 1–2 characters) that increase false positives

### Page 2 — Analyzer
- Inputs:
  - My URL (single)
  - Competitor URLs (up to 10)
  - Keyword group dropdown
- Actions:
  - Analyze
  - Export HTML
  - Export PDF
- Output areas:
  - Summary per URL (words scanned, keywords found, total matches)
  - Keyword table (rows: keywords, columns: found/count/buckets)
  - “Competitor keywords missing on my page” (gap list/table)

### Report view (used for exports)
- Simplified, printable layout
- Includes:
  - Run metadata (date/time, selected group, URLs)
  - Gap summary
  - Keyword-by-URL matrix or keyword list with per-URL status (simplified)

---

## 7) Data model (logical)

### KeywordGroup
- id (uuid)
- name
- keywords[] (raw list)
- createdAt / updatedAt
- settings (future): matchMode, wholeWord, etc.

### AnalysisRun (optional for history)
- id
- timestamp
- keywordGroupId
- myUrl
- competitorUrls[]
- results (stored optionally for re-open)

### PageResult (per URL)
- url
- fetchStatus (success/fail + message)
- extractedTextStats (wordCount, charCount)
- keywordMatches[]

### KeywordMatch (per keyword per URL)
- keyword
- found (bool)
- occurrencesTotal
- occurrencesByBucket: { h1, h2, h3, body }
- bucketsFound[] (derived)

---

## 8) Output tables (what “results” look like)

### A) Per-URL keyword table (primary)
Columns (per keyword):
- Keyword
- Found (Yes/No)
- Occurrences (total)
- H1 count
- H2 count
- H3 count
- Body count

### B) Gap table (primary insight)
- Keyword
- Found on competitors? (Yes + which competitors)
- Missing on my page? (Yes)
- Competitor coverage count (e.g., 6/10)

---

## 9) Export specification (simplified)

### HTML export
- Standalone HTML file
- Embedded styles for readability/printing
- Includes run metadata, gap summary, and core tables

### PDF export
- Simplified printable layout (same content as HTML report)
- Implementation may use browser print-to-PDF flow or a client-side PDF library
- Must preserve:
  - readable tables
  - clear URL labeling
  - gap summary

---

## 10) Recommended tech stack (browser-first, modular)
This aligns with your current prototype approach and supports future growth.

### Option A (recommended for maintainability)
- **TypeScript + Vite**
- UI: lightweight component approach (React optional, not required)
- Storage: localStorage initially (upgradeable to IndexedDB)
- Modules:
  - fetcher
  - extractor
  - normalizer
  - matcher
  - analyzer orchestrator
  - renderer/reporting
  - export

### Option B (smallest footprint)
- Vanilla JS + modules (ESM)
- Keep localStorage
- Still enforce module boundaries

**Recommendation:** TypeScript + Vite for safer refactors and predictable matching logic.

---

## 11) Key risks & mitigations (important)

### Risk 1 — CORS / blocked fetching
Many competitor sites block cross-origin reads in browsers.
- Mitigation (MVP): Use a controlled proxy endpoint.
- Mitigation (robust): Add a lightweight serverless “fetch + extract” service.

### Risk 2 — JS-rendered content
If a competitor page renders content client-side, raw HTML fetch will miss content.
- Mitigation: server-side rendering fetch (headless) in the fetch service (optional phase).

### Risk 3 — “Main text” identification inaccuracies
Heuristic extraction can include/exclude the wrong sections.
- Mitigation: improve main-content detection with layered heuristics, allow manual override later (select main container).

### Risk 4 — Keyword false positives/negatives
- Mitigation: define matching rules (whole-word/phrase), normalize thoroughly, and provide a test suite of pages/keywords.

---

## 12) Step-by-step delivery plan

### Phase 0 — Lock requirements (1 short iteration)
- Confirm matching mode defaults:
  - Whole-word for single words? (recommended)
  - Phrase matching rules
- Confirm whether H1/H2/H3 are only within main content area (recommended).
- Confirm export contents (simplified is OK; confirm exactly which tables).

**Deliverable:** final agreed acceptance criteria + test cases.

### Phase 1 — Architecture & refactor to modules
- Split into core modules:
  1) KeywordGroupStore
  2) UrlManager
  3) PageFetcher
  4) ContentExtractor (main-text + H1/H2/H3/body buckets)
  5) TextNormalizer
  6) KeywordMatcher
  7) AnalyzerOrchestrator
  8) ReportRenderer
  9) Exporters (HTML, PDF)
- Ensure adding features later doesn’t change module contracts.

**Deliverable:** working app with same UI but modular internal structure.

### Phase 2 — Content extraction improvements (main-text accuracy)
- Improve selector removal + main-container selection.
- Extract bucketed text:
  - H1 text (within main)
  - H2 text (within main)
  - H3 text (within main)
  - Body text (within main, excluding headings)
- Add extraction diagnostics per URL:
  - fetched OK?
  - main container chosen?
  - word count

**Deliverable:** stable extraction for a representative sample of sites.

### Phase 3 — Keyword detection engine (accuracy-first)
- Implement normalization consistently for keywords and page text.
- Implement matching defaults (case-insensitive + recommended whole-word/phrase).
- Count occurrences per bucket + total.
- Add unit-like test inputs (sample texts) to verify edge cases.

**Deliverable:** verified matching behavior against acceptance tests.

### Phase 4 — Analysis results + competitor gap logic
- Produce:
  - per-URL keyword table
  - competitor gap table (keywords on any competitor but missing on my page)
  - coverage stats (how many competitors have each keyword)
- Handle failures gracefully (timeouts, blocked URLs).

**Deliverable:** clear reporting even when some URLs fail.

### Phase 5 — Export (HTML + PDF)
- HTML report export (standalone) with print styling.
- PDF export:
  - Option 1: print-to-PDF flow
  - Option 2: client-side PDF library
- Ensure exports are consistent with the simplified report spec.

**Deliverable:** shareable reports that match UI metrics.

### Phase 6 — QA, performance & release hardening
- Performance targets for 11 URLs × 100 keywords:
  - show progress UI
  - avoid freezing the tab
- Add retries/timeouts and clear error messages.
- Add “sample run” fixtures for regression testing.

**Deliverable:** stable MVP ready for real use.

---

## 13) MVP acceptance criteria (summary)
- User can create/select keyword groups.
- User can analyze 1 + up to 10 competitor URLs using a selected group (80–100 keywords).
- Extraction excludes header/nav/footer/menu and includes H1/H2/H3 + body in the main content area.
- Matching is case-insensitive and produces accurate counts and bucket locations (H1/H2/H3/Body).
- Gap report correctly flags keywords present on competitors but missing on the user’s page.
- Exports: simplified HTML and PDF reports.

---

## 14) Open items (need confirmation)
1) Matching mode default:
   - Recommended: whole-word for single-word keywords; phrase matching for multi-word keywords.
2) Should we treat punctuation variants as equivalent in phrases (e.g., “trade-counter” vs “trade counter”)?
3) Should URLs be stored as “analysis history” (nice-to-have) or just per-session?

