import { create } from "zustand";
import { sendMessage } from "@/src/api/chat";
import type { Message } from "@/src/types";

let c = 0;
const genId = () => `m_${Date.now()}_${++c}`;

interface AgentSession {
  messages: Message[];
  conversationId: string;
}

type ChatState = {
  sessions: Record<string, AgentSession>;
  activeAgent: string;
  isTyping: boolean;
  getMessages: () => Message[];
  getConvId: () => string;
  send: (text: string, agentId: string) => Promise<void>;
  clearAgent: (agentId: string) => void;
  cancel: () => void;
};

function getSession(sessions: Record<string, AgentSession>, agentId: string): AgentSession {
  return sessions[agentId] || { messages: [], conversationId: "" };
}

export const useChat = create<ChatState>((set, get) => ({
  sessions: {},
  activeAgent: "",
  isTyping: false,

  getMessages: () => getSession(get().sessions, get().activeAgent).messages,
  getConvId: () => getSession(get().sessions, get().activeAgent).conversationId,

  send: async (text, agentId) => {
    const trimmed = text.trim();
    if (!trimmed || get().isTyping) return;

    if (get().activeAgent !== agentId) {
      set({ activeAgent: agentId });
    }

    const userMsg: Message = { id: genId(), role: "user", content: trimmed };
    const agentMsg: Message = { id: genId(), role: "agent", content: "" };
    const ses = getSession(get().sessions, agentId);
    const prevConvId = ses.conversationId;

    set((s) => ({
      sessions: { ...s.sessions, [agentId]: { ...ses, messages: [...ses.messages, userMsg, agentMsg] } },
      activeAgent: agentId,
      isTyping: true,
    }));

    try {
      const data = await sendMessage(trimmed, agentId, prevConvId || undefined);
      const cur = getSession(get().sessions, agentId);
      set((s) => ({
        sessions: {
          ...s.sessions,
          [agentId]: {
            ...cur,
            messages: cur.messages.map((m) =>
              m.id === agentMsg.id
                ? { ...m, content: data.reply || "抱歉，请再试一次", cards: data.cards }
                : m
            ),
            conversationId: data.conversationId || prevConvId,
          },
        },
        isTyping: false,
      }));
    } catch {
      const cur = getSession(get().sessions, agentId);
      set((s) => ({
        sessions: {
          ...s.sessions,
          [agentId]: {
            ...cur,
            messages: cur.messages.map((m) =>
              m.id === agentMsg.id ? { ...m, content: "网络错误，请检查连接后重试" } : m
            ),
          },
        },
        isTyping: false,
      }));
    }
  },

  clearAgent: (agentId: string) => set((s) => ({
    sessions: { ...s.sessions, [agentId]: { messages: [], conversationId: "" } },
  })),
  cancel: () => set({ isTyping: false }),
}));
