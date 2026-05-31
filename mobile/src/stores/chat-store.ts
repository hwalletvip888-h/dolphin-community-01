import { create } from "zustand";
import { API_BASE, authHeaders } from "@/src/lib/api";
import type { Message, Conversation, AgentId } from "@/src/shared/types/chat";
import type { CardData } from "@/src/shared/types/card";

interface ChatState {
  messages: Message[];
  conversationId: string;
  isTyping: boolean;
  conversations: Conversation[];
  abortController: AbortController | null;

  sendMessage: (text: string, agentId: AgentId, model: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (convId: string) => Promise<void>;
  switchConversation: (convId: string) => Promise<void>;
  clearMessages: () => void;
  cancelStream: () => void;
}

let msgCounter = 0;
function nextId() {
  return `msg_${Date.now()}_${++msgCounter}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: "",
  isTyping: false,
  conversations: [],
  abortController: null,

  sendMessage: async (text, agentId, model) => {
    const userMsg: Message = { id: nextId(), role: "user", content: text };
    const agentMsg: Message = { id: nextId(), role: "agent", content: "" };
    const state = get();

    set({
      messages: [...state.messages, userMsg, agentMsg],
      isTyping: true,
    });

    const abortController = new AbortController();
    set({ abortController });

    try {
      const headers = await authHeaders();
      const r = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text,
          agent: agentId,
          conversationId: state.conversationId || undefined,
          stream: true,
          model,
        }),
        signal: abortController.signal,
      });

      if (!r.ok) {
        const err = await r.text().catch(() => "Unknown error");
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === agentMsg.id ? { ...m, content: `请求失败: ${err.slice(0, 100)}` } : m
          ),
          isTyping: false,
          abortController: null,
        }));
        return;
      }

      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let cards: CardData[] | undefined;
      let convId = state.conversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.token) {
              set((s) => ({
                messages: s.messages.map((m) =>
                  m.id === agentMsg.id ? { ...m, content: m.content + parsed.token } : m
                ),
              }));
            }
            if (parsed.cards) cards = parsed.cards;
            if (parsed.done) convId = parsed.conversationId;
            if (parsed.error) {
              set((s) => ({
                messages: s.messages.map((m) =>
                  m.id === agentMsg.id ? { ...m, content: parsed.error } : m
                ),
              }));
            }
          } catch { /* skip malformed SSE */ }
        }
      }

      set((s) => {
        const finalMessages = s.messages.map((m) => {
          if (m.id === agentMsg.id) {
            if (!m.content.trim()) return null;
            return { ...m, cards };
          }
          return m;
        }).filter(Boolean) as Message[];
        return {
          messages: finalMessages,
          conversationId: convId || s.conversationId,
          isTyping: false,
          abortController: null,
        };
      });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === agentMsg.id ? { ...m, content: `网络错误: ${String(e).slice(0, 100)}` } : m
        ),
        isTyping: false,
        abortController: null,
      }));
    }
  },

  loadConversations: async () => {
    try {
      const headers = await authHeaders();
      const r = await fetch(`${API_BASE}/api/chat`, { headers });
      const d = await r.json();
      if (d.conversations) set({ conversations: d.conversations });
    } catch { /* silent */ }
  },

  loadMessages: async (convId) => {
    try {
      const headers = await authHeaders();
      const r = await fetch(`${API_BASE}/api/chat?id=${convId}`, { headers });
      const d = await r.json();
      if (d.messages) set({ messages: d.messages, conversationId: convId });
    } catch { /* silent */ }
  },

  switchConversation: async (convId) => {
    await get().loadMessages(convId);
  },

  clearMessages: () => {
    get().cancelStream();
    set({ messages: [], conversationId: "" });
  },

  cancelStream: () => {
    get().abortController?.abort();
    set({ isTyping: false, abortController: null });
  },
}));
