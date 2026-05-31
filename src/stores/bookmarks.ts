import { create } from "zustand";
import type { Message } from "@/src/types";
import { AGENTS } from "@/src/data/agents";

export interface Bookmark {
  id: string;
  content: string;
  agentId: string;
  agentName: string;
  cardType?: string;
  savedAt: number;
}

type BookmarkState = {
  items: Bookmark[];
  add: (msg: Message, agentId: string, cards?: any[]) => void;
  remove: (id: string) => void;
  isBookmarked: (id: string) => boolean;
};

export const useBookmarks = create<BookmarkState>((set, get) => ({
  items: [],

  add: (msg, agentId, cards) => {
    const agent = AGENTS.find((a) => a.id === agentId);
    const exists = get().items.find((b) => b.id === msg.id);
    if (exists) return;
    set((s) => ({
      items: [
        {
          id: msg.id,
          content: msg.content.slice(0, 200),
          agentId,
          agentName: agent?.name || agentId,
          cardType: cards?.[0]?.type,
          savedAt: Date.now(),
        },
        ...s.items,
      ],
    }));
  },

  remove: (id) => set((s) => ({ items: s.items.filter((b) => b.id !== id) })),

  isBookmarked: (id) => get().items.some((b) => b.id === id),
}));
