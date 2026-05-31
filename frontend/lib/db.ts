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

      CREATE TABLE IF NOT EXISTS community_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL CHECK(role IN ('user', 'agent', 'system')),
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_comm_created ON community_messages(created_at);

      CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inviter_user_id TEXT NOT NULL,
        invitee_user_id TEXT DEFAULT '',
        invite_code TEXT NOT NULL UNIQUE,
        reward_claimed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_referral_inviter ON referrals(inviter_user_id);
      CREATE INDEX IF NOT EXISTS idx_referral_code ON referrals(invite_code);

      CREATE TABLE IF NOT EXISTS rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('invite','checkin','campaign','airdrop')),
        amount TEXT DEFAULT '0',
        token TEXT DEFAULT 'USDT',
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','claimed','failed')),
        tx_hash TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);

      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        reward_type TEXT DEFAULT 'USDT',
        reward_amount TEXT DEFAULT '0',
        start_at TEXT NOT NULL,
        end_at TEXT NOT NULL,
        active INTEGER DEFAULT 1
      );
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

// ── Community Messages ──────────────────────────────────────

export interface CommunityMessage {
  id: number;
  user_id: string;
  role: "user" | "agent" | "system";
  content: string;
  created_at: string;
}

export function addCommunityMessage(
  userId: string,
  role: "user" | "agent" | "system",
  content: string
): CommunityMessage {
  const db = getDb();
  const result = db
    .prepare("INSERT INTO community_messages (user_id, role, content) VALUES (?, ?, ?)")
    .run(userId, role, content);
  return {
    id: Number(result.lastInsertRowid),
    user_id: userId,
    role,
    content,
    created_at: new Date().toISOString(),
  };
}

export function getCommunityMessages(
  after?: number,
  limit: number = 50
): CommunityMessage[] {
  const db = getDb();
  if (after) {
    return db
      .prepare("SELECT * FROM community_messages WHERE id > ? ORDER BY id ASC LIMIT ?")
      .all(after, limit) as CommunityMessage[];
  }
  return db
    .prepare("SELECT * FROM community_messages ORDER BY id DESC LIMIT ?")
    .all(limit) as CommunityMessage[];
}

// ── Referral ──────────────────────────────────────

export function generateInviteCode(userId: string): string {
  const db = getDb();
  const code = `H${userId.slice(0, 6).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  db.prepare("INSERT OR IGNORE INTO referrals (inviter_user_id, invite_code) VALUES (?, ?)").run(userId, code);
  return code;
}

export function getUserInviteCode(userId: string): string | null {
  const db = getDb();
  const row = db.prepare("SELECT invite_code FROM referrals WHERE inviter_user_id = ? LIMIT 1").get(userId) as { invite_code: string } | undefined;
  return row?.invite_code || null;
}

export function claimInviteReward(inviteCode: string, inviteeUserId: string): { ok: boolean; message: string } {
  const db = getDb();
  const ref = db.prepare("SELECT * FROM referrals WHERE invite_code = ?").get(inviteCode) as { id: number; invitee_user_id: string; reward_claimed: number; inviter_user_id: string } | undefined;
  if (!ref) return { ok: false, message: "邀请码无效" };
  if (ref.invitee_user_id && ref.invitee_user_id !== inviteeUserId) return { ok: false, message: "邀请码已被使用" };

  const txn = db.transaction(() => {
    db.prepare("UPDATE referrals SET invitee_user_id = ? WHERE id = ?").run(inviteeUserId, ref.id);
    // Reward both inviter and invitee
    db.prepare("INSERT INTO rewards (user_id, type, amount, token, status) VALUES (?, 'invite', '5', 'USDT', 'pending')").run(ref.inviter_user_id);
    db.prepare("INSERT INTO rewards (user_id, type, amount, token, status) VALUES (?, 'invite', '2', 'USDT', 'pending')").run(inviteeUserId);
  });
  txn();
  return { ok: true, message: "邀请成功，奖励已发放" };
}

export function getUserInviteStats(userId: string) {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM referrals WHERE inviter_user_id = ? AND invitee_user_id != ''").get(userId) as { c: number })?.c || 0;
  const rewards = (db.prepare("SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as total FROM rewards WHERE user_id = ? AND type = 'invite' AND status = 'claimed'").get(userId) as { total: number })?.total || 0;
  return { totalInvites: total, totalRewards: rewards };
}

// ── Rewards ───────────────────────────────────────

export function getLeaderboard(limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT user_id, COUNT(*) as invite_count, COALESCE(SUM(CAST(amount AS REAL)), 0) as total_rewards
    FROM referrals r LEFT JOIN rewards rw ON r.inviter_user_id = rw.user_id AND rw.type = 'invite'
    WHERE r.invitee_user_id != ''
    GROUP BY r.inviter_user_id
    ORDER BY invite_count DESC
    LIMIT ?
  `).all(limit) as { user_id: string; invite_count: number; total_rewards: number }[];
}

export function getUserRewards(userId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM rewards WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(userId) as {
    id: number; user_id: string; type: string; amount: string; token: string; status: string; tx_hash: string; created_at: string;
  }[];
}

export function getCampaigns() {
  const db = getDb();
  return db.prepare("SELECT * FROM campaigns WHERE active = 1 AND datetime('now') BETWEEN start_at AND end_at ORDER BY start_at DESC").all() as {
    id: number; title: string; description: string; reward_type: string; reward_amount: string; start_at: string; end_at: string;
  }[];
}

export function claimReward(rewardId: number, userId: string): { ok: boolean; message: string } {
  const db = getDb();
  const row = db.prepare("SELECT * FROM rewards WHERE id = ? AND user_id = ? AND status = 'pending'").get(rewardId, userId) as { id: number } | undefined;
  if (!row) return { ok: false, message: "奖励不存在或已领取" };
  db.prepare("UPDATE rewards SET status = 'claimed' WHERE id = ?").run(rewardId);
  return { ok: true, message: "领取成功" };
}
