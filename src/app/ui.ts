import type { KeywordGroup, PageResult } from "../types";
import { state } from "./state";
import { loadGroups, saveGroups } from "../storage/keyword-groups";
import { loadProxySettings, saveProxySettings } from "../storage/proxy-settings";
import { runAnalysis } from "../core/analyzer";
import { computeGaps } from "../core/reporter";
import { generateHtmlReport, downloadHtmlReport } from "../core/exporters";
import { normalizeText } from "../core/normalizer";
import { escapeHtml, dedupePreserveOrder } from "../utils/text";
import { isValidUrl } from "../utils/validation";
import { qs } from "../utils/dom";
import { createId } from "../utils/id";
import { renderSummaryTable } from "./summary-ui";
import { renderFaqTable } from "./faq-ui";
import { renderReviewsTable } from "./reviews-ui";
import { renderSchemaTable } from "./schema-ui";
import { renderFirst100Table } from "./first100-ui";
import { renderImageAltsTable } from "./image-alts-ui";
import { renderTechnicalChecksTable } from "./technical-checks-ui";
import { renderContentStructureTable } from "./content-structure-ui";
import { renderVideoEmbedsTable } from "./video-embeds-ui";
import { openSerpRankingWindow } from "./serp-window";
import ukCitiesData from "../data/uk-major-cities-50k.json";
import { renderRankingsArchiveTable, renderRankingsHistoryTable } from "./rankings-history-ui";
import {
  addRankingHistoryEntry,
  archiveRankingHistoryEntry,
  clearRankingsHistory,
  loadArchivedRankingsHistory,
  loadRankingsHistory
} from "../storage/rankings-history";

const MAX_COMPETITORS = 10;
const SERP_LOCATION_STORAGE_KEY = "serp_location";
const SERP_DEVICE_STORAGE_KEY = "serp_device";
const DEFAULT_SERP_LOCATION = "London, England, United Kingdom";
const DEFAULT_SERP_DEVICE: "desktop" | "mobile" = "desktop";
const SERP_CITY_OPTIONS = Array.from(
  new Set(
    (ukCitiesData.cities || [])
      .map((item) => (item && typeof item.location === "string" ? item.location.trim() : ""))
      .filter((item) => item.length > 0)
  )
);

export function initUi(): void {
  state.keywordGroups = loadGroups();
  state.proxySettings = loadProxySettings();
  state.rankingsHistory = loadRankingsHistory();
  state.archivedRankingsHistory = loadArchivedRankingsHistory();
  bindEvents();
  renderGroupList();
  refreshGroupSelect();
  ensureCompetitorRow();
  hydrateProxySettings();
  bindResultInteractions();
  renderRankingsHistory();
  (window as typeof window & { __appBooted?: boolean }).__appBooted = true;
}

export function showFatalError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const container = document.getElementById("app") || document.body;
  const banner = document.createElement("div");
  banner.className = "panel warning";
  banner.innerHTML = `
    <strong>App failed to initialize.</strong>
    <div class="hint">Details: ${escapeHtml(message)}</div>
    <div class="hint">If you opened index.html directly, run the Vite dev server (npm run dev).</div>
  `;
  container.prepend(banner);
}

function bindEvents(): void {
  qs<HTMLButtonElement>("#save-group-btn").addEventListener("click", handleSaveGroup);
  qs<HTMLButtonElement>("#cancel-edit-btn").addEventListener("click", () => {
    setEditingGroup(null);
  });
  qs<HTMLButtonElement>("#add-competitor-btn").addEventListener("click", () => {
    addCompetitorRow();
  });
  qs<HTMLButtonElement>("#toggle-groups-panel-btn").addEventListener("click", () => {
    toggleGroupsPanel();
  });
  qs<HTMLButtonElement>("#analyze-btn").addEventListener("click", handleAnalyze);
  qs<HTMLButtonElement>("#export-html-btn").addEventListener("click", handleExportHtml);
  qs<HTMLButtonElement>("#export-pdf-btn").addEventListener("click", () => {
    alert("PDF export is not implemented yet.");
  });
  qs<HTMLButtonElement>("#save-proxy-btn").addEventListener("click", handleSaveProxy);
  qs<HTMLButtonElement>("#toggle-proxy-panel-btn").addEventListener("click", () => {
    toggleProxyPanel();
  });
  qs<HTMLButtonElement>("#clear-rankings-history-btn").addEventListener("click", () => {
    clearRankingsHistory();
    state.rankingsHistory = [];
    renderRankingsHistory();
  });
  bindUrlCopy();
  bindRankingsHistoryInteractions();
  bindSummaryCopy();
}

function toggleProxyPanel(forceState?: boolean): void {
  const content = qs<HTMLDivElement>("#proxy-panel-content");
  const button = qs<HTMLButtonElement>("#toggle-proxy-panel-btn");
  const nextOpen =
    typeof forceState === "boolean" ? forceState : content.classList.contains("hidden");
  content.classList.toggle("hidden", !nextOpen);
  button.textContent = nextOpen ? "Close" : "Open";
}

function toggleGroupsPanel(forceState?: boolean): void {
  const content = qs<HTMLDivElement>("#groups-panel-content");
  const button = qs<HTMLButtonElement>("#toggle-groups-panel-btn");
  const nextOpen =
    typeof forceState === "boolean" ? forceState : content.classList.contains("hidden");
  content.classList.toggle("hidden", !nextOpen);
  button.textContent = nextOpen ? "Close" : "Open";
}

function bindResultInteractions(): void {
  const container = qs<HTMLDivElement>("#results-content");
  container.addEventListener("input", (event) => {
    const target = event.target as HTMLElement | null;
    const locationInput = target?.closest(".serp-location-input") as HTMLInputElement | null;
    if (!locationInput) {
      return;
    }
    const value = locationInput.value.trim();
    if (value) {
      saveSerpLocation(value);
    }
  });

  container.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null;
    const deviceButton = target?.closest(".serp-device-btn") as HTMLButtonElement | null;
    if (deviceButton) {
      event.preventDefault();
      event.stopPropagation();
      const nextDevice = deviceButton.dataset.device === "mobile" ? "mobile" : "desktop";
      saveSerpDevice(nextDevice);
      refreshSerpDeviceButtons(container);
      return;
    }

    const serpButton = target?.closest(".serp-check-btn") as HTMLButtonElement | null;
    if (serpButton) {
      event.preventDefault();
      event.stopPropagation();

      const encodedKeyword = serpButton.dataset.keyword || "";
      const keyword = encodedKeyword
        ? decodeURIComponent(encodedKeyword)
        : serpButton.getAttribute("data-keyword") || "";
      if (!keyword || !state.currentAnalysis) {
        return;
      }

      const location = getSerpLocationFromControls(container);
      const device = getSavedSerpDevice();
      const serpData = await openSerpRankingWindow(keyword, state.currentAnalysis, location, device);
      if (serpData) {
        state.rankingsHistory = addRankingHistoryEntry(state.rankingsHistory, {
          id: createId(),
          createdAt: new Date().toISOString(),
          keyword,
          response: serpData
        });
        renderRankingsHistory();
      }
      return;
    }

    const cell = target?.closest(".keyword-cell") as HTMLElement | null;
    if (!cell) {
      return;
    }
    const encoded = cell.dataset.keyword || "";
    const keyword = encoded ? decodeURIComponent(encoded) : cell.textContent || "";
    if (keyword) {
      copyToClipboard(keyword.trim());
      cell.classList.add("copied");
      window.setTimeout(() => cell.classList.remove("copied"), 600);
    }
  });
}

function renderRankingsHistory(): void {
  const activeContainer = qs<HTMLDivElement>("#rankings-history-content");
  activeContainer.innerHTML = renderRankingsHistoryTable(state.rankingsHistory);

  const archiveContainer = qs<HTMLDivElement>("#rankings-archive-content");
  archiveContainer.innerHTML = renderRankingsArchiveTable(state.archivedRankingsHistory);
}

function bindRankingsHistoryInteractions(): void {
  const activeContainer = qs<HTMLDivElement>("#rankings-history-content");
  activeContainer.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const archiveButton = target?.closest(".history-archive-btn") as HTMLButtonElement | null;
    if (!archiveButton) {
      return;
    }

    const entryId = archiveButton.dataset.entryId || "";
    if (!entryId) {
      return;
    }

    const next = archiveRankingHistoryEntry(
      state.rankingsHistory,
      state.archivedRankingsHistory,
      entryId
    );
    state.rankingsHistory = next.activeEntries;
    state.archivedRankingsHistory = next.archivedEntries;
    renderRankingsHistory();
  });
}

function getSavedSerpLocation(): string {
  try {
    return localStorage.getItem(SERP_LOCATION_STORAGE_KEY) || DEFAULT_SERP_LOCATION;
  } catch {
    return DEFAULT_SERP_LOCATION;
  }
}

function saveSerpLocation(location: string): void {
  try {
    localStorage.setItem(SERP_LOCATION_STORAGE_KEY, location);
  } catch {
    // Ignore storage errors.
  }
}

function getSavedSerpDevice(): "desktop" | "mobile" {
  try {
    return localStorage.getItem(SERP_DEVICE_STORAGE_KEY) === "mobile" ? "mobile" : "desktop";
  } catch {
    return DEFAULT_SERP_DEVICE;
  }
}

function saveSerpDevice(device: "desktop" | "mobile"): void {
  try {
    localStorage.setItem(SERP_DEVICE_STORAGE_KEY, device);
  } catch {
    // Ignore storage errors.
  }
}

function getSerpLocationFromControls(container: HTMLElement): string {
  const locationInput = container.querySelector<HTMLInputElement>(".serp-location-input");
  const typed = locationInput?.value.trim() || "";
  if (typed) {
    saveSerpLocation(typed);
    return typed;
  }

  const fallback = getSavedSerpLocation();
  if (locationInput) {
    locationInput.value = fallback;
  }
  return fallback;
}

function refreshSerpDeviceButtons(container: HTMLElement): void {
  const current = getSavedSerpDevice();
  container.querySelectorAll<HTMLButtonElement>(".serp-device-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.device === current);
    button.setAttribute("aria-pressed", button.dataset.device === current ? "true" : "false");
  });
}

function renderSerpControls(): string {
  const location = getSavedSerpLocation();
  const device = getSavedSerpDevice();
  const cityOptions = SERP_CITY_OPTIONS.map(
    (city) => `<option value="${escapeHtml(city)}"></option>`
  ).join("");

  return `
    <div class="serp-controls-panel">
      <div class="form-row">
        <label for="serp-location-input">SERP location</label>
        <input
          id="serp-location-input"
          type="text"
          class="serp-location-input"
          list="serp-city-options"
          value="${escapeHtml(location)}"
          placeholder="Start typing a city, e.g. Swindon, England, United Kingdom"
        />
        <datalist id="serp-city-options">
          ${cityOptions}
        </datalist>
      </div>
      <div class="serp-device-toggle" role="group" aria-label="SERP device">
        <button
          type="button"
          class="btn secondary serp-device-btn ${device === "desktop" ? "active" : ""}"
          data-device="desktop"
          aria-pressed="${device === "desktop" ? "true" : "false"}"
        >
          Desktop
        </button>
        <button
          type="button"
          class="btn secondary serp-device-btn ${device === "mobile" ? "active" : ""}"
          data-device="mobile"
          aria-pressed="${device === "mobile" ? "true" : "false"}"
        >
          Mobile
        </button>
      </div>
    </div>
  `;
}

function bindSummaryCopy(): void {
  const container = qs<HTMLDivElement>("#summary-table");
  container.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest(".copy-summary") as HTMLElement | null;
    if (!button) {
      return;
    }
    const encoded = button.dataset.copyText || "";
    const text = encoded ? decodeURIComponent(encoded) : "";
    if (text.trim().length === 0) {
      return;
    }
    copyToClipboard(text);
    button.classList.add("copied");
    window.setTimeout(() => button.classList.remove("copied"), 600);
  });
}

function bindUrlCopy(): void {
  const appRoot = qs<HTMLDivElement>("#app");
  appRoot.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const urlCell = target?.closest(".copy-url-cell") as HTMLElement | null;
    if (!urlCell) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const encoded = urlCell.dataset.copyUrl || "";
    const text = encoded ? decodeURIComponent(encoded) : (urlCell.textContent || "").trim();
    if (!text || text === "-") {
      return;
    }

    copyToClipboard(text);
    urlCell.classList.add("copied");
    window.setTimeout(() => urlCell.classList.remove("copied"), 700);
  });
}

function copyToClipboard(text: string): void {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);
}

function fallbackCopy(text: string): void {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "true");
  area.style.position = "absolute";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

function setGroupWarning(message: string): void {
  qs<HTMLDivElement>("#group-warning").textContent = message;
}

function setEditingGroup(group: KeywordGroup | null): void {
  const nameInput = qs<HTMLInputElement>("#group-name");
  const keywordsInput = qs<HTMLTextAreaElement>("#keywords-input");
  const saveButton = qs<HTMLButtonElement>("#save-group-btn");
  const cancelButton = qs<HTMLButtonElement>("#cancel-edit-btn");

  if (!group) {
    state.editingGroupId = null;
    nameInput.value = "";
    keywordsInput.value = "";
    saveButton.textContent = "Save group";
    cancelButton.classList.add("hidden");
    setGroupWarning("");
    return;
  }

  state.editingGroupId = group.id;
  nameInput.value = group.name;
  keywordsInput.value = group.keywords.join("\n");
  saveButton.textContent = "Update group";
  cancelButton.classList.remove("hidden");
}

function handleSaveGroup(): void {
  const nameInput = qs<HTMLInputElement>("#group-name");
  const keywordsInput = qs<HTMLTextAreaElement>("#keywords-input");
  const name = nameInput.value.trim();
  const rawKeywords = keywordsInput.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (!name) {
    alert("Please provide a group name.");
    return;
  }

  if (rawKeywords.length === 0) {
    alert("Please add at least one keyword.");
    return;
  }

  const seen = new Map<string, string>();
  rawKeywords.forEach((keyword) => {
    const normalized = normalizeText(keyword);
    if (!normalized) {
      return;
    }
    if (!seen.has(normalized)) {
      seen.set(normalized, keyword);
    }
  });

  const keywords = Array.from(seen.values());
  const shortKeywords = keywords.filter((keyword) => normalizeText(keyword).length <= 2);

  if (shortKeywords.length > 0) {
    setGroupWarning(
      `Warning: ${shortKeywords.length} keyword(s) are very short and may increase false positives.`
    );
  } else {
    setGroupWarning("");
  }

  const selectedGroupId = qs<HTMLSelectElement>("#keyword-group-select").value;
  if (state.editingGroupId) {
    const existing = state.keywordGroups.find((group) => group.id === state.editingGroupId);
    if (!existing) {
      setEditingGroup(null);
      alert("The group you were editing no longer exists.");
      return;
    }

    const updated: KeywordGroup = {
      ...existing,
      name,
      keywords
    };

    state.keywordGroups = state.keywordGroups.map((group) =>
      group.id === existing.id ? updated : group
    );
  } else {
    const group: KeywordGroup = {
      id: createId(),
      name,
      keywords,
      createdAt: new Date().toISOString()
    };

    state.keywordGroups = [group, ...state.keywordGroups];
  }
  saveGroups(state.keywordGroups);
  renderGroupList();
  refreshGroupSelect();

  if (selectedGroupId) {
    qs<HTMLSelectElement>("#keyword-group-select").value = selectedGroupId;
  }

  setEditingGroup(null);
}

function renderGroupList(): void {
  const container = qs<HTMLDivElement>("#groups-list");

  if (state.keywordGroups.length === 0) {
    container.innerHTML = "<p class=\"hint\">No keyword groups yet.</p>";
    return;
  }

  container.innerHTML = state.keywordGroups
    .map((group) => {
      const preview = group.keywords.slice(0, 4).join(", ");
      const more = group.keywords.length > 4 ? "..." : "";
      return `
        <div class="group-item">
          <div class="group-info">
            <div class="group-name">${escapeHtml(group.name)}</div>
            <div class="group-keywords">${escapeHtml(preview)}${more}</div>
          </div>
          <div class="actions">
            <button class="btn secondary" data-action="edit" data-group-id="${group.id}">Edit</button>
            <button class="btn secondary" data-action="delete" data-group-id="${group.id}">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-group-id");
      const action = btn.getAttribute("data-action");
      if (!id) {
        return;
      }
      if (action === "edit") {
        const group = state.keywordGroups.find((item) => item.id === id);
        if (group) {
          setEditingGroup(group);
        }
        return;
      }

      if (action === "delete") {
        state.keywordGroups = state.keywordGroups.filter((group) => group.id !== id);
        if (state.editingGroupId === id) {
          setEditingGroup(null);
        }
        saveGroups(state.keywordGroups);
        renderGroupList();
        refreshGroupSelect();
      }
    });
  });
}

function refreshGroupSelect(): void {
  const select = qs<HTMLSelectElement>("#keyword-group-select");
  if (state.keywordGroups.length === 0) {
    select.innerHTML = "<option value=\"\">No groups available</option>";
    return;
  }

  select.innerHTML = [
    "<option value=\"\">Select a group</option>",
    ...state.keywordGroups.map(
      (group) => `<option value="${group.id}">${escapeHtml(group.name)}</option>`
    )
  ].join("");
}

function ensureCompetitorRow(): void {
  const container = qs<HTMLDivElement>("#competitors-container");
  if (container.children.length === 0) {
    addCompetitorRow();
  }
}

function addCompetitorRow(value = ""): void {
  const container = qs<HTMLDivElement>("#competitors-container");
  if (container.children.length >= MAX_COMPETITORS) {
    alert("Maximum of 10 competitor URLs.");
    return;
  }

  const row = document.createElement("div");
  row.className = "competitor-row";
  row.innerHTML = `
    <input type="url" class="competitor-url" placeholder="https://competitor.com" value="${escapeHtml(value)}" />
    <button class="btn secondary" type="button">Remove</button>
  `;

  const removeButton = row.querySelector("button");
  if (removeButton) {
    removeButton.addEventListener("click", () => row.remove());
  }

  container.appendChild(row);
}

function setAnalysisStatus(message: string): void {
  qs<HTMLDivElement>("#analysis-status").textContent = message;
}

function hydrateProxySettings(): void {
  const modeSelect = qs<HTMLSelectElement>("#proxy-mode");
  const templateInput = qs<HTMLInputElement>("#proxy-template");
  const renderCheckbox = qs<HTMLInputElement>("#render-js");
  modeSelect.value = state.proxySettings.mode;
  templateInput.value = state.proxySettings.customTemplate;
  renderCheckbox.checked = state.proxySettings.renderJs;
  updateProxyHint();
}

function updateProxyHint(): void {
  const hint = qs<HTMLDivElement>("#proxy-hint");
  if (state.proxySettings.mode === "local") {
    hint.textContent =
      "Local proxy expected at http://localhost:8787/proxy (run: npm run proxy).";
    return;
  }
  if (state.proxySettings.mode === "custom") {
    hint.textContent = "Custom proxy template should include {url}.";
    return;
  }
  hint.textContent = "Auto mode tries direct, local, and public proxies.";
}

function handleSaveProxy(): void {
  const modeSelect = qs<HTMLSelectElement>("#proxy-mode");
  const templateInput = qs<HTMLInputElement>("#proxy-template");
  const renderCheckbox = qs<HTMLInputElement>("#render-js");

  if (modeSelect.value === "custom") {
    const template = templateInput.value.trim();
    if (template.length === 0) {
      alert("Custom proxy mode requires a template (include {url} or {url_raw}).");
      return;
    }
    if (!template.includes("{url}") && !template.includes("{url_raw}")) {
      alert("Custom proxy template should include {url} or {url_raw}.");
      return;
    }
  }

  state.proxySettings = {
    ...state.proxySettings,
    mode: modeSelect.value as typeof state.proxySettings.mode,
    customTemplate: templateInput.value.trim(),
    renderJs: renderCheckbox.checked
  };

  saveProxySettings(state.proxySettings);
  updateProxyHint();
}

async function handleAnalyze(): Promise<void> {
  const groupId = qs<HTMLSelectElement>("#keyword-group-select").value;
  const myUrl = qs<HTMLInputElement>("#my-url").value.trim();
  const competitorInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(".competitor-url")
  );

  const competitorUrls = dedupePreserveOrder(
    competitorInputs.map((input) => input.value.trim()).filter((value) => value.length > 0)
  );

  if (!groupId) {
    alert("Please select a keyword group.");
    return;
  }

  if (!isValidUrl(myUrl)) {
    alert("Please enter a valid URL for your site.");
    return;
  }

  if (competitorUrls.length > MAX_COMPETITORS) {
    alert("Maximum of 10 competitor URLs.");
    return;
  }

  const invalidCompetitors = competitorUrls.filter((url) => !isValidUrl(url));
  if (invalidCompetitors.length > 0) {
    alert("One or more competitor URLs are invalid.");
    return;
  }

  const group = state.keywordGroups.find((item) => item.id === groupId);
  if (!group) {
    alert("Selected group not found.");
    return;
  }

  const analyzeButton = qs<HTMLButtonElement>("#analyze-btn");
  analyzeButton.disabled = true;

  try {
    setAnalysisStatus("Starting analysis...");
    const analysis = await runAnalysis({
      myUrl,
      competitorUrls,
      group,
      proxySettings: state.proxySettings,
      onProgress: (message) => setAnalysisStatus(message)
    });

    state.currentAnalysis = analysis;
    renderResults(analysis.results, analysis);
    setAnalysisStatus("Analysis complete.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    setAnalysisStatus(`Analysis failed: ${message}`);
  } finally {
    analyzeButton.disabled = false;
  }
}

function summarizeResult(result: PageResult): string {
  const keywordsFound = result.matches.filter((match) => match.found).length;
  const totalOccurrences = result.matches.reduce(
    (sum, match) => sum + match.occurrencesTotal,
    0
  );
  return `Found ${keywordsFound} keywords, ${totalOccurrences} total matches, ${result.wordCount} words.`;
}

function renderResults(results: PageResult[], analysis: { groupName: string; keywords: string[] }): void {
  const meta = qs<HTMLDivElement>("#results-meta");
  meta.textContent = `Group: ${analysis.groupName} | Keywords: ${analysis.keywords.length}`;

  const summaryContainer = qs<HTMLDivElement>("#summary-table");
  if (state.currentAnalysis) {
    summaryContainer.innerHTML = renderSummaryTable(state.currentAnalysis);
  } else {
    summaryContainer.innerHTML = "";
  }

  const first100Container = qs<HTMLDivElement>("#first100-table");
  if (state.currentAnalysis) {
    first100Container.innerHTML = renderFirst100Table(state.currentAnalysis);
  } else {
    first100Container.innerHTML = "";
  }

  const container = qs<HTMLDivElement>("#results-content");
  const mySiteResult = results.find((item) => item.type === "my-site");
  const myFound = new Map<string, boolean>();
  if (mySiteResult) {
    mySiteResult.matches.forEach((match) => {
      myFound.set(match.keyword, match.found);
    });
  }

  container.innerHTML = results
    .map((result) => {
      const competitorFound = new Map<string, boolean>();
      if (result.type === "my-site") {
        results
          .filter((item) => item.type === "competitor")
          .forEach((competitor) => {
            competitor.matches.forEach((match) => {
              if (match.found) {
                competitorFound.set(match.keyword, true);
              }
            });
          });
      }
      if (result.fetchStatus === "error") {
        const proxyTip =
          state.proxySettings.mode === "local"
            ? "Tip: Start the local proxy with npm run proxy."
            : "Tip: Try Auto or Local proxy mode if this keeps failing.";

        return `
          <div class="panel">
            <h3>${escapeHtml(result.label)}</h3>
            <p class="hint">
              URL:
              <span
                class="copy-url-cell"
                data-copy-url="${encodeURIComponent(result.url)}"
                title="Click to copy URL"
              >${escapeHtml(result.url)}</span>
            </p>
            <p class="hint">Error: ${escapeHtml(result.errorMessage || "Unknown error")}</p>
            <p class="hint">${escapeHtml(proxyTip)}</p>
          </div>
        `;
      }

      const buildRow = (keyword: string) => {
        const match = result.matches.find((item) => item.keyword === keyword);
        if (!match) {
          return "";
        }
        const showGap =
          result.type === "my-site" &&
          !match.found &&
          competitorFound.get(keyword) === true;
        const gapBadge = showGap ? "<span class=\"gap-badge\">Gap</span>" : "";
        const gapRow =
          result.type === "competitor" && match.found && myFound.get(keyword) === false;
        const rowClass = gapRow ? "gap-row" : "";
        return `
          <tr class="${rowClass}">
            <td class="keyword-cell" data-keyword="${encodeURIComponent(keyword)}">
              <span>${escapeHtml(keyword)} ${gapBadge}</span>
              <button
                class="btn secondary serp-check-btn"
                type="button"
                title="Check SERP rankings"
                data-keyword="${encodeURIComponent(keyword)}"
              >&#127760;</button>
            </td>
            <td>${match.found ? "<span class=\"pill ok\">Yes</span>" : "<span class=\"pill no\">No</span>"}</td>
            <td>${match.occurrencesTotal}</td>
            <td>${match.occurrencesByBucket.title}</td>
            <td>${match.occurrencesByBucket.meta}</td>
            <td>${match.occurrencesByBucket.h1}</td>
            <td>${match.occurrencesByBucket.h2}</td>
            <td>${match.occurrencesByBucket.h3}</td>
            <td>${match.occurrencesByBucket.body}</td>
          </tr>
        `;
      };

      const foundRows = analysis.keywords
        .filter((keyword) => {
          const match = result.matches.find((item) => item.keyword === keyword);
          return match ? match.found : false;
        })
        .map((keyword) => buildRow(keyword))
        .join("");

      const missingKeywords = analysis.keywords.filter((keyword) => {
        const match = result.matches.find((item) => item.keyword === keyword);
        return match ? !match.found : false;
      });
      const missingRows = missingKeywords.map((keyword) => `<li>${escapeHtml(keyword)}</li>`).join("");

      const tableBody =
        foundRows.trim().length > 0
          ? foundRows
          : "<tr><td colspan=\"8\" class=\"hint\">No matching keywords found.</td></tr>";

      const warningHtml = result.warningMessage
        ? `<p class="hint">Warning: ${escapeHtml(result.warningMessage)}</p>`
        : "";
      const previewHtml =
        result.previewText && result.warningMessage
          ? `<p class="hint">Preview: ${escapeHtml(result.previewText)}...</p>`
          : "";

      const missingBlock =
        result.type === "my-site" && missingKeywords.length > 0
          ? `
            <details class="missing-keywords">
              <summary class="btn secondary">Show missing keywords (${missingKeywords.length})</summary>
              <ul>${missingRows}</ul>
            </details>
          `
          : "";
      const serpControlsBlock = result.type === "my-site" ? renderSerpControls() : "";

      return `
        <div class="panel">
          <h3>${escapeHtml(result.label)}</h3>
          <p class="hint">
            URL:
            <span
              class="copy-url-cell"
              data-copy-url="${encodeURIComponent(result.url)}"
              title="Click to copy URL"
            >${escapeHtml(result.url)}</span>
          </p>
          <p class="hint">${summarizeResult(result)}</p>
          ${warningHtml}
          ${previewHtml}
          <table class="results-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Found</th>
                <th>Total</th>
                <th>Title</th>
                <th>Meta</th>
                <th>H1</th>
                <th>H2</th>
                <th>H3</th>
                <th>Body</th>
              </tr>
            </thead>
            <tbody>${tableBody}</tbody>
          </table>
          ${serpControlsBlock}
          ${missingBlock}
        </div>
      `;
    })
    .join("");

  const contentStructureContainer = qs<HTMLDivElement>("#content-structure-table");
  if (state.currentAnalysis) {
    contentStructureContainer.innerHTML = renderContentStructureTable(state.currentAnalysis);
  } else {
    contentStructureContainer.innerHTML = "";
  }

  const faqContainer = qs<HTMLDivElement>("#faq-table");
  if (state.currentAnalysis) {
    faqContainer.innerHTML = renderFaqTable(state.currentAnalysis);
  } else {
    faqContainer.innerHTML = "";
  }

  const reviewsContainer = qs<HTMLDivElement>("#reviews-table");
  if (state.currentAnalysis) {
    reviewsContainer.innerHTML = renderReviewsTable(state.currentAnalysis);
  } else {
    reviewsContainer.innerHTML = "";
  }

  const schemaContainer = qs<HTMLDivElement>("#schema-table");
  if (state.currentAnalysis) {
    schemaContainer.innerHTML = renderSchemaTable(state.currentAnalysis);
  } else {
    schemaContainer.innerHTML = "";
  }

  const imageAltContainer = qs<HTMLDivElement>("#image-alt-table");
  if (state.currentAnalysis) {
    imageAltContainer.innerHTML = renderImageAltsTable(state.currentAnalysis);
  } else {
    imageAltContainer.innerHTML = "";
  }

  const videoEmbedsContainer = qs<HTMLDivElement>("#video-embeds-table");
  if (state.currentAnalysis) {
    videoEmbedsContainer.innerHTML = renderVideoEmbedsTable(state.currentAnalysis);
  } else {
    videoEmbedsContainer.innerHTML = "";
  }

  const technicalChecksContainer = qs<HTMLDivElement>("#technical-checks-table");
  if (state.currentAnalysis) {
    technicalChecksContainer.innerHTML = renderTechnicalChecksTable(state.currentAnalysis);
  } else {
    technicalChecksContainer.innerHTML = "";
  }

  renderGaps();
}

function renderGaps(): void {
  const container = qs<HTMLDivElement>("#gap-content");
  if (!state.currentAnalysis) {
    container.innerHTML = "<p class=\"hint\">No analysis yet.</p>";
    return;
  }

  const gaps = computeGaps(state.currentAnalysis);
  if (gaps.length === 0) {
    container.innerHTML = "<p class=\"hint\">No gap keywords found.</p>";
    return;
  }

  container.innerHTML = gaps
    .map((gap) => {
      const competitorLines = gap.competitors
        .map(
          (comp) =>
            `${escapeHtml(comp.label)} (${comp.occurrences} in ${comp.buckets.join(", ")})`
        )
        .join("; ");

      return `
        <div class="group-item">
          <div class="group-info">
            <div class="group-name">${escapeHtml(gap.keyword)}</div>
            <div class="group-keywords">${escapeHtml(competitorLines)}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function handleExportHtml(): void {
  if (!state.currentAnalysis) {
    alert("No analysis to export.");
    return;
  }

  const html = generateHtmlReport(state.currentAnalysis);
  downloadHtmlReport(html, `keyword-analysis-${Date.now()}.html`);
}
