import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "dolphin.db");

function db() {
  const d = new Database(DB_PATH);
  d.pragma("journal_mode = WAL");
  return d;
}

// ── Schema ───────────────────────────────────────────────
export function initSignalDB() {
  const d = db();
  d.exec(`
    CREATE TABLE IF NOT EXISTS signal_wallets (
      address TEXT NOT NULL,
      chain TEXT DEFAULT 'ethereum',
      label TEXT DEFAULT '',           -- 聪明钱/KOL/巨鲸
      reputation INTEGER DEFAULT 50,  -- 0-100, 50=neutral
      total_signals INTEGER DEFAULT 0,
      blacklisted INTEGER DEFAULT 0,  -- 0=正常, 1=黑名单
      suspicious INTEGER DEFAULT 0,  -- 0=正常, 1=可疑
      first_seen TEXT,
      last_seen TEXT,
      notes TEXT DEFAULT '',
      PRIMARY KEY (address, chain)
    );

    CREATE TABLE IF NOT EXISTS signal_outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      token_address TEXT DEFAULT '',
      chain TEXT DEFAULT 'ethereum',
      signal_type TEXT DEFAULT '',      -- 买入/卖出/大量买入/大量卖出
      entry_price REAL,
      entry_time TEXT,
      exit_price REAL,
      exit_time TEXT,
      peak_price REAL,                  -- 最高价
      peak_time TEXT,                   -- 最高价时间
      peak_pct REAL,                    -- 最高涨幅%
      final_pnl_pct REAL,              -- 最终盈亏%
      outcome TEXT DEFAULT 'pending',  -- pending/profit/loss/rug/scam
      dump_speed TEXT DEFAULT '',       -- immediate(<5min)/fast(<1h)/slow/gradual
      pattern TEXT DEFAULT '',          -- pump_dump/steady_gain/slow_decline/flat
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_outcomes_wallet ON signal_outcomes(wallet_address, chain);
    CREATE INDEX IF NOT EXISTS idx_outcomes_token ON signal_outcomes(token_symbol);
    CREATE INDEX IF NOT EXISTS idx_wallets_reputation ON signal_wallets(reputation);
  `);
  d.close();
}

// ── Record a signal outcome ──────────────────────────────
export function recordOutcome(params: {
  wallet_address: string; token_symbol: string; chain?: string;
  signal_type: string; entry_price: number; entry_time: string;
}) {
  const d = db();
  d.prepare(`INSERT OR IGNORE INTO signal_outcomes
    (wallet_address, token_symbol, chain, signal_type, entry_price, entry_time)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run(params.wallet_address, params.token_symbol, params.chain || "ethereum",
         params.signal_type, params.entry_price, params.entry_time);
  d.close();
}

// ── Update outcome after tracking period ─────────────────
export function updateOutcome(params: {
  wallet_address: string; token_symbol: string;
  exit_price: number; exit_time: string; peak_price: number; peak_pct: number;
  final_pnl_pct: number; dump_speed: string; pattern: string; outcome: string;
}) {
  const d = db();
  const row = d.prepare(`SELECT id FROM signal_outcomes
    WHERE wallet_address=? AND token_symbol=? AND outcome='pending'
    ORDER BY id DESC LIMIT 1`)
    .get(params.wallet_address, params.token_symbol) as { id: number } | undefined;
  if (row) {
    d.prepare(`UPDATE signal_outcomes SET
      exit_price=?, exit_time=?, peak_price=?, peak_pct=?, final_pnl_pct=?,
      dump_speed=?, pattern=?, outcome=?
      WHERE id=?`)
      .run(params.exit_price, params.exit_time, params.peak_price, params.peak_pct,
           params.final_pnl_pct, params.dump_speed, params.pattern, params.outcome, row.id);
    // Update wallet reputation
    updateWalletReputation(d, params.wallet_address);
  }
  d.close();
}

// ── Update wallet reputation ─────────────────────────────
function updateWalletReputation(d: Database.Database, address: string) {
  const outcomes = d.prepare(`SELECT outcome, dump_speed, pattern FROM signal_outcomes
    WHERE wallet_address=? AND outcome!='pending' ORDER BY id DESC LIMIT 20`)
    .all(address) as { outcome: string; dump_speed: string; pattern: string }[];

  if (!outcomes.length) return;

  let reputation = 50;
  let blacklisted = 0;
  let suspicious = 0;

  for (const o of outcomes) {
    if (o.outcome === "rug" || (o.outcome === "loss" && o.dump_speed === "immediate")) {
      blacklisted = 1;
      reputation = 0;
      break; // immediate dump after buy = blacklist, no recovery
    }
    if (o.outcome === "scam") { blacklisted = 1; reputation = 0; break; }
    if (o.outcome === "loss" && o.dump_speed === "fast") {
      suspicious = 1;
      reputation = Math.max(0, reputation - 15);
    }
    if (o.outcome === "profit") reputation = Math.min(100, reputation + 5);
    if (o.outcome === "loss" && o.dump_speed !== "immediate") reputation = Math.max(0, reputation - 5);
  }

  if (!blacklisted && suspicious < 2) suspicious = 0;

  d.prepare(`INSERT INTO signal_wallets (address, chain, reputation, total_signals, blacklisted, suspicious, last_seen)
    VALUES (?, 'ethereum', ?, 1, ?, ?, datetime('now'))
    ON CONFLICT(address, chain) DO UPDATE SET
    reputation=?, total_signals=total_signals+1, blacklisted=?, suspicious=?, last_seen=datetime('now')`)
    .run(address, reputation, blacklisted, suspicious, reputation, blacklisted, suspicious);
}

// ── Query wallet status ──────────────────────────────────
export function getWalletStatus(address: string) {
  const d = db();
  const wallet = d.prepare(`SELECT * FROM signal_wallets WHERE address=?`).get(address) as Record<string, unknown> | undefined;
  const recentOutcomes = d.prepare(`SELECT * FROM signal_outcomes
    WHERE wallet_address=? AND outcome!='pending' ORDER BY id DESC LIMIT 5`).all(address);
  d.close();
  return { wallet, recentOutcomes };
}

// ── Get blacklisted wallets ──────────────────────────────
export function getBlacklist() {
  const d = db();
  const list = d.prepare(`SELECT address, reputation, notes, last_seen FROM signal_wallets WHERE blacklisted=1`).all();
  d.close();
  return list;
}

// Initialize on import
initSignalDB();
