import type { AnalysisResult, KeywordGroup, ProxySettings } from "../types";
import type { RankingHistoryEntry } from "../storage/rankings-history";

export interface AppState {
  keywordGroups: KeywordGroup[];
  currentAnalysis: AnalysisResult | null;
  proxySettings: ProxySettings;
  editingGroupId: string | null;
  rankingsHistory: RankingHistoryEntry[];
  archivedRankingsHistory: RankingHistoryEntry[];
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
  editingGroupId: null,
  rankingsHistory: [],
  archivedRankingsHistory: []
};
