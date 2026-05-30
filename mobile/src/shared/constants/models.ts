// AI models — shared between web and mobile
// Source: frontend/app/app/page.tsx:136-140
import type { AIModel } from "../types/chat";

export interface ModelConfig {
  id: AIModel;
  desc: string;
}

export const MODELS: ModelConfig[] = [
  { id: "H 1.6 Lite", desc: "极速响应，日常对话" },
  { id: "H1.6", desc: "平衡模式，最佳体验" },
  { id: "H1.6 Max", desc: "深度推理，复杂逻辑" },
];
