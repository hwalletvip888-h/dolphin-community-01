// Chat types — shared between web and mobile
// Source: frontend/app/app/page.tsx
import type { CardData } from "./card";

export type AgentId = "worldcup" | "dolphin" | "onchain" | "zhuge" | "wealth" | "reward";
export type OnchainTab = "chat" | "positions" | "simtrade" | "signals";
export type AIModel = "H 1.6 Lite" | "H1.6" | "H1.6 Max";

export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  cards?: CardData[];
}

export interface Conversation {
  id: string;
  agent_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
