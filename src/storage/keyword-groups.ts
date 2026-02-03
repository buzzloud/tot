import type { KeywordGroup } from "../types";

const STORAGE_KEY = "keyword-gap-groups";

export function loadGroups(): KeywordGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as KeywordGroup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGroups(groups: KeywordGroup[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}
