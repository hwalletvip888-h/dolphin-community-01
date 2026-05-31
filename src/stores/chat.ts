import { create } from "zustand";
import { sendMessage } from "@/src/api/chat";
import type { Message } from "@/src/types";

let c = 0;
const genId = () => `m_${Date.now()}_${++c}`;

type ChatState = {
  messages: Message[];
  conversationId: string;
  isTyping: boolean;
  send: (text: string, agentId: string) => Promise<void>;
  clear: () => void;
  cancel: () => void;
};

export const useChat = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: "",
  isTyping: false,

  send: async (text, agentId) => {
    const trimmed = text.trim();
    if (!trimmed || get().isTyping) return;

    const userMsg: Message = { id: genId(), role: "user", content: trimmed };
    const agentMsg: Message = { id: genId(), role: "agent", content: "" };
    const prevConvId = get().conversationId;

    set((s) => ({ messages: [...s.messages, userMsg, agentMsg], isTyping: true }));

    try {
      const data = await sendMessage(trimmed, agentId, prevConvId || undefined);
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === agentMsg.id
            ? { ...m, content: data.reply || "抱歉，请再试一次", cards: data.cards }
            : m
        ),
        conversationId: data.conversationId || prevConvId,
        isTyping: false,
      }));
    } catch {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === agentMsg.id ? { ...m, content: "网络错误，请检查连接后重试" } : m
        ),
        isTyping: false,
      }));
    }
  },

  clear: () => set({ messages: [], conversationId: "", isTyping: false }),
  cancel: () => set({ isTyping: false }),
}));
