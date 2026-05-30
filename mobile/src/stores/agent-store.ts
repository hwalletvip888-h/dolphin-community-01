import { create } from "zustand";
import type { AgentId, AIModel, OnchainTab } from "@/src/shared/types/chat";

interface AgentState {
  activeAgentId: AgentId;
  activeIndex: number;
  selectedModel: AIModel;
  onchainTab: OnchainTab;
  setAgent: (id: AgentId, index: number) => void;
  setModel: (model: AIModel) => void;
  setOnchainTab: (tab: OnchainTab) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  activeAgentId: "worldcup",
  activeIndex: 0,
  selectedModel: "H1.6" as AIModel,
  onchainTab: "chat" as OnchainTab,
  setAgent: (id, index) => set({ activeAgentId: id, activeIndex: index }),
  setModel: (model) => set({ selectedModel: model }),
  setOnchainTab: (tab) => set({ onchainTab: tab }),
}));
