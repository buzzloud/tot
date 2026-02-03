import type { AnalysisResult, KeywordGroup, ProxySettings } from "../types";

export interface AppState {
  keywordGroups: KeywordGroup[];
  currentAnalysis: AnalysisResult | null;
  proxySettings: ProxySettings;
  editingGroupId: string | null;
}

export const state: AppState = {
  keywordGroups: [],
  currentAnalysis: null,
  proxySettings: {
    mode: "auto",
    customTemplate: "",
    timeoutMs: 15000,
    renderJs: false
  },
  editingGroupId: null
};
