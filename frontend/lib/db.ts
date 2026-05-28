import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "dolphin.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");

    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'legacy',
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

      CREATE INDEX IF NOT EXISTS idx_messages_conv
        ON messages(conversation_id, id);
      CREATE INDEX IF NOT EXISTS idx_conv_user
        ON conversations(user_id);
    `);

    // Migration: add user_id column if upgrading from old schema
    try { _db.exec("ALTER TABLE conversations ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy'"); } catch { /* column exists */ }
    try { _db.exec("CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id)"); } catch { /* exists */ }
  }
  return _db;
}

export interface DbMessage {
  id: number;
  conversation_id: string;
  role: "user" | "agent";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  agent_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ── Users ────────────────────────────────────────────────────

export function ensureUser(userId: string, email: string = ""): void {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)").run(userId, email);
}

// ── Conversations ──────────────────────────────────────────

export function ensureConversation(id: string, agentId: string, userId: string): Conversation {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM conversations WHERE id = ? AND user_id = ?")
    .get(id, userId) as Conversation | undefined;

  if (existing) {
    db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ? AND user_id = ?").run(id, userId);
    return existing;
  }

  db.prepare("INSERT INTO conversations (id, agent_id, user_id) VALUES (?, ?, ?)").run(id, agentId, userId);
  return { id, agent_id: agentId, user_id: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

// ── Messages ───────────────────────────────────────────────

export function addMessage(
  conversationId: string,
  role: "user" | "agent",
  content: string,
  userId: string = "legacy",
): DbMessage {
  const db = getDb();
  db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ? AND user_id = ?").run(conversationId, userId);
  const result = db
    .prepare("INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)")
    .run(conversationId, role, content);
  return {
    id: Number(result.lastInsertRowid),
    conversation_id: conversationId,
    role,
    content,
    created_at: new Date().toISOString(),
  };
}

export function getMessages(
  conversationId: string,
  limit: number = 40,
  userId: string = "legacy",
): Pick<DbMessage, "role" | "content">[] {
  const db = getDb();
  // Verify conversation belongs to user
  const conv = db.prepare("SELECT id FROM conversations WHERE id = ? AND user_id = ?").get(conversationId, userId);
  if (!conv) return [];
  return db
    .prepare(
      "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id ASC LIMIT ?",
    )
    .all(conversationId, limit) as Pick<DbMessage, "role" | "content">[];
}

export function getRecentConversations(
  userId: string,
  limit: number = 10,
): Conversation[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?")
    .all(userId, limit) as Conversation[];
}

export function deleteConversation(id: string, userId: string): boolean {
  const db = getDb();
  db.prepare("DELETE FROM messages WHERE conversation_id = ?").run(id);
  const r = db.prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?").run(id, userId);
  return r.changes > 0;
}

export function getMessageCount(conversationId: string, userId: string): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?")
    .get(conversationId) as { cnt: number };
  return row.cnt;
}
