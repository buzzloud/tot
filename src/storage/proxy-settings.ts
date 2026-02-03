import type { ProxySettings } from "../types";

const STORAGE_KEY = "keyword-gap-proxy-settings";

const DEFAULT_SETTINGS: ProxySettings = {
  mode: "auto",
  customTemplate: "",
  timeoutMs: 15000,
  renderJs: false
};

export function loadProxySettings(): ProxySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<ProxySettings>;
  return {
      ...DEFAULT_SETTINGS,
      ...parsed
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveProxySettings(settings: ProxySettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
