import type { SerpResponse } from "../app/serp-types";

const STORAGE_KEY = "keyword-gap-rankings-history";
const ARCHIVE_STORAGE_KEY = "keyword-gap-rankings-history-archive";
const MAX_ENTRIES = 200;

export interface RankingHistoryEntry {
  id: string;
  createdAt: string;
  keyword: string;
  response: SerpResponse;
}

export function loadRankingsHistory(): RankingHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as RankingHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadArchivedRankingsHistory(): RankingHistoryEntry[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as RankingHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRankingsHistory(entries: RankingHistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function saveArchivedRankingsHistory(entries: RankingHistoryEntry[]): void {
  localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(entries));
}

export function addRankingHistoryEntry(
  entries: RankingHistoryEntry[],
  entry: RankingHistoryEntry
): RankingHistoryEntry[] {
  const next = [entry, ...entries].slice(0, MAX_ENTRIES);
  saveRankingsHistory(next);
  return next;
}

export function clearRankingsHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function archiveRankingHistoryEntry(
  activeEntries: RankingHistoryEntry[],
  archivedEntries: RankingHistoryEntry[],
  entryId: string
): { activeEntries: RankingHistoryEntry[]; archivedEntries: RankingHistoryEntry[] } {
  const entry = activeEntries.find((item) => item.id === entryId);
  if (!entry) {
    return { activeEntries, archivedEntries };
  }

  const nextActive = activeEntries.filter((item) => item.id !== entryId);
  const nextArchived = [entry, ...archivedEntries].slice(0, MAX_ENTRIES);
  saveRankingsHistory(nextActive);
  saveArchivedRankingsHistory(nextArchived);
  return { activeEntries: nextActive, archivedEntries: nextArchived };
}
