// Local SQLite database for offline conversation cache
// Ported from frontend/lib/db.ts (better-sqlite3 → expo-sqlite)
import * as SQLite from "expo-sqlite";
import type { Conversation } from "@/src/shared/types/chat";

const db = SQLite.openDatabaseSync("dolphin.db");

export function initDb(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      user_id TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'agent')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);
  `);
}

export function ensureConversation(id: string, agentId: string, userId: string): Conversation {
  const existing = db.getFirstSync<Conversation>(
    "SELECT * FROM conversations WHERE id = ?",
    [id]
  );
  if (existing) {
    db.runSync("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?", [id]);
    return existing;
  }
  db.runSync(
    "INSERT INTO conversations (id, agent_id, user_id) VALUES (?, ?, ?)",
    [id, agentId, userId]
  );
  return { id, agent_id: agentId, user_id: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

export function addMessage(conversationId: string, role: "user" | "agent", content: string, userId?: string): void {
  db.runSync(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
    [conversationId, role, content]
  );
  db.runSync(
    "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
    [conversationId]
  );
}

export function getMessages(conversationId: string, limit = 100): { role: string; content: string }[] {
  const rows = db.getAllSync<{ role: string; content: string }>(
    "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id ASC LIMIT ?",
    [conversationId, limit]
  );
  return rows;
}

export function getRecentConversations(userId: string, limit = 20): Conversation[] {
  const rows = db.getAllSync<Conversation>(
    "SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?",
    [userId, limit]
  );
  return rows;
}

export function deleteConversation(id: string): void {
  db.runSync("DELETE FROM messages WHERE conversation_id = ?", [id]);
  db.runSync("DELETE FROM conversations WHERE id = ?", [id]);
}

export function getMessageCount(conversationId: string): number {
  const row = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?",
    [conversationId]
  );
  return row?.count ?? 0;
}
