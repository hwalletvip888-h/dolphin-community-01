import { post, get } from "./client";

export function sendMessage(text: string, agent: string, convId?: string) {
  return post("/api/chat", { message: text, agent, conversationId: convId || undefined, stream: false });
}

export function fetchConversations() {
  return get("/api/chat");
}

export function fetchMessages(convId: string) {
  return get(`/api/chat?id=${convId}`);
}

export function walletCall(action: string, params?: Record<string, unknown>) {
  return post("/api/wallet", { action, ...params });
}

export function fetchSignals() {
  return get("/api/signals");
}

export function fetchFutures() {
  return get("/api/futures");
}
