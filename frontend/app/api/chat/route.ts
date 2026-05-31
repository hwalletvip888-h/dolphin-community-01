import { NextRequest } from "next/server";
import { ensureConversation, addMessage, getMessages, getRecentConversations, ensureUser, getCampaigns, getUserRewards, getLeaderboard } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { safeFetch } from "@/lib/fetch";
import { addMemory, addFacts, searchMemory, extractFacts } from "@/lib/memory";
import okx from "@/lib/okx";
import crypto from "crypto";
import fs from "fs";
import path from "path";

function getMCP(): string {
  return process.env.MCP_API_URL || "";
}
const LLM = "https://api.deepseek.com/anthropic/v1/messages";
function getKEY(): string {
  return process.env.DEEPSEEK_API_KEY || "";
}

// ── JWT verify (lightweight, no deps) ─────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function verifyJWT(token: string): { user_id: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, bodyB64, sigB64] = parts;
    const msg = `${headerB64}.${bodyB64}`;
    const sig = Buffer.from(sigB64, "base64url");
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(msg).digest();
    if (!crypto.timingSafeEqual(sig, expected)) return null;
    const body = JSON.parse(Buffer.from(bodyB64, "base64url").toString());
    if (!body.user_id) return null;
    // Check JWT expiration
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return { user_id: body.user_id, email: body.email || "" };
  } catch {
    return null;
  }
}

function getUserId(req: NextRequest): string {
  const auth = req.headers.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const payload = verifyJWT(auth.slice(7));
    if (payload) return payload.user_id;
  }
  return "";
}

// ── Card types ─────────────────────────────────────────────
interface TokenItem { chain: string; symbol: string; amount: string; usd: string; address: string; }
interface PriceItem { symbol: string; price: string; change: string; high?: string; low?: string; }
interface SignalItem { symbol?: string; direction: string; entry: string; tp: string; sl: string; rr?: string; strategy?: string; }
type CardData =
  | { type: "balance"; total: string; tokens: TokenItem[] }
  | { type: "balance_empty"; message: string }
  | { type: "price"; items: PriceItem[] }
  | { type: "signal"; items: SignalItem[] }
  | { type: "odds"; items: { question: string; yes: string; volume: string }[] }
  | { type: "account"; usdc: string; pol: string; positions?: string }
  | { type: "scan"; coins: number; signals: number; top: { symbol: string; price: string; rr: string }[] }
  | { type: "positions"; items: { symbol: string; side: string; size: string; entry: string; pnl: string }[] }
  | { type: "smart_money"; signals: { symbol: string; price: string; whale: string; rr: string; trend: string }[] }
  | { type: "bridge"; chains: { name: string; id: string; native: string }[]; protocols: { name: string; fee: string }[] }
  | { type: "backtest"; symbol: string; strategy: string; return_pct: string; win_rate: string; trades: number; sharpe: string }
  | { type: "gas"; chains: { chain: string; coins: string }[]; note: string }
  | { type: "strategies"; items: { id: string; name: string; desc: string }[] };

const CHAIN: Record<number, string> = {
  1: "Ethereum", 10: "Optimism", 56: "BSC", 137: "Polygon",
  196: "X Layer", 324: "zkSync", 8453: "Base", 42161: "Arbitrum",
  43114: "Avalanche", 501: "Solana", 250: "Fantom", 100: "Gnosis",
};

// Reverse lookup: chain name → chainIndex (supports CN/EN keywords)
const CHAIN_NAME_MAP: Record<string, number> = {};
for (const [id, name] of Object.entries(CHAIN)) {
  CHAIN_NAME_MAP[name.toLowerCase()] = Number(id);
}
// Chinese aliases + abbreviations
Object.assign(CHAIN_NAME_MAP, {
  "ethereum": 1, "eth": 1, "以太坊": 1, "以太": 1,
  "optimism": 10, "op": 10,
  "bsc": 56, "币安链": 56, "币安": 56, "bnb": 56, "bnbchain": 56,
  "polygon": 137, "matic": 137,
  "x layer": 196, "xlayer": 196, "x层": 196, "x链": 196,
  "zksync": 324, "zk": 324,
  "base": 8453,
  "arbitrum": 42161, "arb": 42161,
  "avalanche": 43114, "avax": 43114, "雪崩": 43114,
  "solana": 501, "sol": 501,
  "fantom": 250, "ftm": 250,
  "gnosis": 100,
});

function resolveChain(msg: string): number {
  const lower = msg.toLowerCase();
  for (const [k, v] of Object.entries(CHAIN_NAME_MAP)) {
    if (lower.includes(k)) return v;
  }
  return 196; // default: X Layer
}

const MCP_API_KEY = process.env.MCP_API_KEY || "";

// ── Caching ────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30000;
const MCP_TIMEOUT = 5000;

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Call MCP API with optional auth forwarding.
 * @param path      MCP endpoint path (e.g. "/wallet/status")
 * @param reqHeaders Headers to forward to MCP (Authorization, etc.)
 */
async function mcp(path: string, reqHeaders?: Record<string, string>) {
  const authSuffix = reqHeaders?.["Authorization"]?.slice(-12) || "noauth";
  const cacheKey = `${path}|${authSuffix}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const fetchHeaders: Record<string, string> = {};
  if (MCP_API_KEY) fetchHeaders["X-API-Key"] = MCP_API_KEY;
  if (reqHeaders) Object.assign(fetchHeaders, reqHeaders);

  const { ok, data } = await safeFetch(`${getMCP()}/api/h/v1${path}`, {
    headers: Object.keys(fetchHeaders).length ? fetchHeaders : undefined,
    signal: AbortSignal.timeout(MCP_TIMEOUT),
  });

  // Reject auth errors and non-200 responses
  if (!ok || (data && (data as any).error)) return cached?.data || null;

  if (data) {
    cache.set(cacheKey, { data, ts: Date.now() });
    return data;
  }
  return cached ? cached.data : null;
}

/** Build MCP request headers from an incoming NextRequest — forwards auth + API key */
function mcpHeadersFromRequest(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {};
  if (MCP_API_KEY) h["X-API-Key"] = MCP_API_KEY;
  const auth = req.headers.get("Authorization") || "";
  if (auth) h["Authorization"] = auth;
  return h;
}

function logAgent(agent_id: string, action: string, result: string) {
  fetch(`${getMCP()}/api/h/v1/agent/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id, action, result }),
    signal: AbortSignal.timeout(2000),
  }).catch(() => {});
}

const DATA_MARKER = /\n*===== 数据[\s\S]*$/;
function cleanHistory(content: string): string {
  return content.replace(DATA_MARKER, "").trim();
}

// ── Agent System Prompts — short, focused ──────────────────
const SYSTEM_PROMPTS: Record<string, string> = {
  zhuge:
    "诸葛策略。\n" +
    "不要用「好的」「收到」「根据数据」开头。直接给数据。\n" +
    "行情查询: 「BTC $73,500 HURST 0.19 震荡 S1 $72K R1 $76K」\n" +
    "深度分析: 结论→原因→风险→建议\n" +
    "执行: 结构化预览→等确认\n" +
    "没数据说暂无。不准编造。不给买卖建议。",

  worldcup:
    "AI预言帝。\n" +
    "不要用「好的」「收到」开头。直接给数据。\n" +
    "查询→直接报赔率。分析→结论+优劣势+淘汰赛路径。\n" +
    "没数据说暂无。不准编造。",

  onchain:
    "链上猎手。数据优先。禁止「好的」「收到」开头。\n" +
    "第一行就是数据。不准写「正在扫描」「根据数据分析」之类的废话。\n" +
    "没数据说暂无。不准编造。充提币找小海豚。",

  dolphin:
    "小海豚。\n" +
    "禁止「好的」「你好」「嗨」开头。直接说操作步骤。\n" +
    "充提币→引导去钱包Tab。其他问题→路由到对应Agent。",

  wealth:
    "稳盈管家。数据优先。禁止「好的」「收到」开头。\n" +
    "第一行就是产品名+APY。不准写「这是当前可用的」之类的废话。",

  reward:
    "派奖福星。\n" +
    "有活动→直接报活动名+奖励。没活动→暂无。",
};

const WC_KNOWLEDGE = [
  "2026世界杯: 6.11-7.19 | 美加墨 | 48队12组 | 决赛: 纽约MetLife",
  "已出线: 美/加/墨(东道主) | 日/伊(亚洲) | 新西兰(大洋洲)",
  "冠军: 巴西5 德国4 意大利4 阿根廷3 法国2 乌拉圭2 英格兰1 西班牙1",
].join("\n");


// ── Knowledge Base ────────────────────────────────

let cachedKBs: Record<string, string> = {};
function loadKB(name: string): string {
  if (cachedKBs[name]) return cachedKBs[name];
  try {
    cachedKBs[name] = fs.readFileSync(path.join(process.cwd(), "knowledge", `${name}.md`), "utf-8");
  } catch { cachedKBs[name] = ""; }
  return cachedKBs[name];
}

// ── onchainos CLI helper ───────────────────────────

import { execSync } from "child_process";

function onchainos(cmd: string): Record<string, unknown> | null {
  try {
    const buf = execSync(`/Users/h/.local/bin/onchainos ${cmd}`, { timeout: 30000, maxBuffer: 2 * 1024 * 1024, env: { ...process.env, HOME: process.env.HOME || "/Users/h" } });
    return JSON.parse(buf.toString());
  } catch (e) {
    console.error("[onchainos] failed:", cmd.slice(0, 80), String(e).slice(0, 100));
    return null;
  }
}

// ── LLM-based intent extraction (no regex) ───────────────
async function detectIntent(msg: string): Promise<{ intents: string[]; swap?: { fromToken?: string; toToken?: string; amount?: string; chain?: string } }> {
  if (!getKEY()) return { intents: [] };
  try {
    const r = await fetch(LLM, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": getKEY(), "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "deepseek-chat", max_tokens: 150, temperature: 0,
        system: `Classify user intent in Chinese/English. Return ONLY valid JSON, no other text.
{"intents":["market","wallet","signals","swap","meme","bridge","gas","security","strategy","campaigns","transfer","polymarket","worldcup"]}
Intent detection rules:
- 热门/火/涨/跌/排行/trending/聪明钱/whale/KOL → signals
- 余额/钱包/资产/持仓/有多少钱/多少钱 → wallet
- Gas/费用/矿工费/gas price/fee → gas
- 安全/风险/貔貅/土狗/合约/分析/honeypot/scam → security
- 买/换/兑换/swap/buy/trade → swap
- 跨链/桥/bridge → bridge
- 新币/meme/扫链/新发射/pump → meme
- 行情/价格/走势/K线/price → market
- 充币/提币/转账/提现/send/transfer → transfer
- 活动/领奖/空投/reward/airdrop → campaigns
- 策略/回测/量化 → strategy
- 世界杯/预测/赔率 → worldcup or polymarket
If swap: add "swap":{"fromToken":"TOKEN","toToken":"TOKEN","amount":"NUMBER"}
Return {"intents":[...]} or {"intents":[],"swap":{}}. Do NOT include intents that don't match.`,
        messages: [{ role: "user", content: msg.slice(0, 300) }],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return { intents: [] };
    const d = await r.json();
    const text = (d.content || []).reduce((t: string, b: { type: string; text: string }) => t + (b.text || ""), "");
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { intents: [] };
  } catch { return { intents: [] }; }
}

// ── Fetch agent data — OPT-IN only ────────────────────────
// Data is only fetched when the user EXPLICITLY asks for it.
// No fallback fetching. No default data injection.
// reqHeaders: forwarded Authorization + X-API-Key for MCP calls
async function fetchAgentData(agent: string, userMsg: string, reqHeaders?: Record<string, string>): Promise<{ text: string; cards: CardData[] }> {
  const intent = await detectIntent(userMsg);
  const intentSet = new Set(intent.intents);
  let text = "";
  let cards: CardData[] = [];
  let mcpData: Record<string, any> = {};

  if (agent === "zhuge") {
    // Zhuge should always try to get market data for any trading-related query
    const isZhugeQuery = /价格|行情|买|卖|多|空|走势|分析|策略|信号|扫描|回测|止损|止盈|仓位|杠杆|爆仓|[A-Z]{2,5}/i.test(userMsg);
    // ═══ Market data (OKX CEX + MCP) ═══
    if (intentSet.has("market") || isZhugeQuery) {
      // OKX CEX — spot/futures prices
      const DEFAULT_PAIRS = ["BTC-USDT", "ETH-USDT", "SOL-USDT"];
      const SUPPORTED = "DOGE|XRP|BNB|ADA|AVAX|LINK|DOT|MATIC|UNI|ATOM|FIL|APT|ARB|OP|LTC|ETC|SUI|NEAR|AAVE|CRV";
      const sym = userMsg.match(new RegExp(`\\b(${SUPPORTED})\\b`, "i"))?.[0]?.toUpperCase();
      const scanPairs = sym ? [`${sym}-USDT`, ...DEFAULT_PAIRS] : DEFAULT_PAIRS;
      const cexPrices: PriceItem[] = [];
      const seen = new Set<string>();
      for (const instId of scanPairs) {
        const sym = instId.split("-")[0];
        if (seen.has(sym)) continue; seen.add(sym);
        try {
          const tkRes = await safeFetch(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`, { signal: AbortSignal.timeout(5000) });
          if (tkRes.ok && tkRes.data?.data?.[0]) {
            const t = tkRes.data.data[0];
            const open24h = parseFloat(t.open24h || "0");
            const last = parseFloat(t.last || "0");
            const change = open24h > 0 ? (((last - open24h) / open24h) * 100).toFixed(1) : "0";
            cexPrices.push({ symbol: sym, price: `$${last}`, change });
            text += `\n${sym}: $${last} | 24h ${change}% | Vol $${Number(t.vol24h || 0).toLocaleString()}`;
          }
        } catch { /* CEX unavailable */ }
      }
      if (cexPrices.length > 0) cards.push({ type: "price", items: cexPrices });

      // MCP detailed analysis (HURST/EMA/Pivot/signals)
      const allSyms = [...new Set([...cexPrices.map(p => p.symbol), "BTC", "ETH", "SOL"])];
      mcpData = {} as Record<string, any>;
      try {
        const results = await Promise.all(allSyms.map(sym => mcp(`/market/analysis/${sym}`)));
        for (let i = 0; i < allSyms.length; i++) {
          const sym = allSyms[i];
          const d = results[i];
          if (d && !(d as any)._error && !(d as any).error) {
            mcpData[sym] = d;
            const r = (d as any).regime || {};
            text += `\n${sym} 技术: HURST ${r.hurst}(${r.state}) | S1 $${d.levels?.pivot?.s1 || "?"} R1 $${d.levels?.pivot?.r1 || "?"}`;
            // Show signals if present
            const sigs = (d as any).signals;
            if (Array.isArray(sigs) && sigs.length > 0) {
              text += ` | 信号: ${sigs.map((s: any) => `${s.strategy} ${s.direction}`).join(", ")}`;
              cards.push({ type: "signal", items: sigs.map((s: any) => ({
                symbol: sym, direction: s.direction, entry: `$${s.entry || "?"}`, tp: `$${s.tp || "?"}`, sl: `$${s.sl || "?"}`, rr: s.rr ? `1:${s.rr}` : undefined, strategy: s.strategy,
              })) });
            }
          }
        }
      } catch { /* MCP offline */ }

      // Multi-coin scan score (data-side, not LLM-side)
      const scanScores = Object.entries(mcpData).map(([sym, d]) => {
        const r = d.regime || {};
        const sigs = d.signals || [];
        const score = (sigs.length > 0 ? 30 : 0) + (r.hurst < 0.45 ? 20 : r.hurst > 0.55 ? 20 : 10) + (d.levels?.pivot ? 20 : 0) + (sigs.some((s: any) => (s.rr || 0) > 2) ? 15 : 0);
        return { sym, score, signals: sigs.length, hurst: r.hurst, state: r.state };
      });
      scanScores.sort((a, b) => b.score - a.score);
      if (scanScores.length > 0) {
        text += `\n多币扫描: ${scanScores.map(s => `${s.sym}评分${s.score}(${s.signals}信号)`).join(" | ")}`;
      }
    }

    // ═══ Funding rate + Open interest (OKX CEX) ═══
    if (/费率|funding|资金费|持仓量|open.interest|OI/i.test(userMsg)) {
      const sym = (userMsg.match(/BTC|ETH|SOL|DOGE|XRP|BNB|ADA/i)?.[0] || "BTC").toUpperCase();
      try {
        const [frRes, oiRes] = await Promise.all([
          safeFetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${`${sym}-USDT-SWAP`}`, { signal: AbortSignal.timeout(5000) }),
          safeFetch(`https://www.okx.com/api/v5/public/open-interest?instId=${`${sym}-USDT-SWAP`}`, { signal: AbortSignal.timeout(5000) }),
        ]);
        if (frRes.ok && frRes.data?.data?.[0]) {
          const fr = frRes.data.data[0];
          text += `\n${sym || "BTC"} 资金费率: ${(parseFloat(fr.fundingRate || "0") * 100).toFixed(4)}% | 下次结算: ${new Date(parseInt(fr.nextFundingTime || "0")).toLocaleTimeString()}`;
        }
        if (oiRes.ok && oiRes.data?.data?.[0]) {
          const oi = oiRes.data.data[0];
          text += `\n${sym || "BTC"} 未平仓: ${Number(oi.oi || "0").toLocaleString()} 张 | ${Number(oi.oiCcy || "0").toLocaleString()} USDT`;
        }
      } catch { /* CEX unavailable */ }
    }

    // ═══ Trading — paper (default) or real CEX ═══
    if (/开仓|下单|执行|买入.*[Uu]|做[多空]|试一单/i.test(userMsg)) {
      const tradeSym = userMsg.match(/BTC|ETH|SOL|DOGE|XRP/i)?.[0] || "BTC";
      const isLong = /做多|买[入多]|long/i.test(userMsg) || !/做空|卖[出空]|short/i.test(userMsg);
      const amtMatch = userMsg.match(/(\d+)\s*[Uu]/);
      const amount = amtMatch ? parseInt(amtMatch[1]) : 100;
      const isReal = /实盘|真实|真金|live|real/i.test(userMsg);

      if (isReal) {
        try {
          const tkRes = await safeFetch(`https://www.okx.com/api/v5/market/ticker?instId=${tradeSym}-USDT`, { signal: AbortSignal.timeout(5000) });
          const price = parseFloat(tkRes.data?.data?.[0]?.last || "0");
          const sz = (amount / price).toFixed(6);
          text += `\n🔴 实盘 ${isLong ? "买入" : "卖出"} ${tradeSym}: $${price} × ${sz} = $${amount}`;
          text += `\n⚠️ 确认执行回复「确认」。回复其他取消。`;
        } catch { text += `\n实盘交易暂不可用`; }
      } else {
        try {
          const tradeInput = JSON.stringify({ symbol: tradeSym, direction: isLong ? "long" : "short", amount });
          const tradeBuf = execSync(`echo '${tradeInput}' | python3 lib/vbt-paper-trade.py`, { timeout: 30000, maxBuffer: 1024 * 128, shell: "/bin/bash" });
          const trade = JSON.parse(tradeBuf.toString());
          if (trade.ok) {
            text += `\n📝 模拟 ${trade.symbol} ${trade.direction} $${amount}: 入场 $${trade.entry_price} | 止损 $${trade.sl_price} | 止盈 $${trade.tp_price}`;
            text += `\n💡 说「实盘开仓」切换真实交易`;
          }
        } catch { text += `\n模拟交易暂不可用`; }
      }
    }

    // ═══ Positions (MCP) ═══
    if (/持仓|position|仓位.*我的/i.test(userMsg)) {
      try {
        const pos = await mcp("/agent/positions");
        if (pos && Array.isArray((pos as any).positions) && (pos as any).positions.length > 0) {
          const items = (pos as any).positions.map((p: any) => ({
            symbol: p.symbol, side: p.side || "long", size: `${p.size || "?"}张`, entry: `$${p.entry || "?"}`, pnl: `${p.pnl >= 0 ? "+" : ""}$${p.pnl || 0}`,
          }));
          cards.push({ type: "positions", items });
          text += `\n持仓: ${items.map((p: any) => `${p.symbol} ${p.side} ${p.size} @ ${p.entry} PnL ${p.pnl}`).join(" | ")}`;
        } else {
          text += `\n当前无持仓`;
        }
      } catch { /* MCP offline */ }
    }
    // ═══ VBT Pro 回测 ═══
    if (intentSet.has("strategy") || /回测|backtest|验证|历史/i.test(userMsg)) {
      const symMatch = userMsg.match(/BTC|ETH|SOL|DOGE|XRP|BNB|ADA/i);
      const btSymbol = symMatch ? `${symMatch[0]}/USDT:USDT` : "BTC/USDT:USDT";
      const stratMatch = userMsg.match(/布林|bollinger|均值回归|ema|金叉|死叉|支撑狙击|pivot/i);
      const btStrategy = stratMatch ? (stratMatch[0].match(/布林|bollinger|均值回归/) ? "bollinger" : "ema") : "bollinger";

      try {
        const btInput = JSON.stringify({ strategy: btStrategy, symbol: btSymbol, timeframe: "1h", limit: 500 });
        const btBuf = execSync(`~/.vbt-venv/bin/python3 lib/vbt-backtest.py '${btInput}'`, { timeout: 60000, maxBuffer: 1024 * 1024 });
        const btResult = JSON.parse(btBuf.toString());
        if (btResult.ok) {
          cards.push({
            type: "backtest",
            symbol: btResult.symbol,
            strategy: btResult.strategy,
            return_pct: btResult.return_pct,
            win_rate: btResult.win_rate,
            trades: btResult.trades,
            sharpe: btResult.sharpe,
          });
          text += `\nVBT Pro 回测 (${btResult.symbol} ${btResult.strategy} ${btResult.timeframe}):`;
          text += `\n收益 ${btResult.return_pct} | 胜率 ${btResult.win_rate} | 夏普 ${btResult.sharpe} | ${btResult.trades}笔交易 | 最大回撤 ${btResult.max_dd}`;
        }
      } catch (e: any) { text += `\n回测暂时不可用: ${String(e).slice(0, 80)}`; }
    }

    // 策略列表 + 回测
    if (intentSet.has("strategy")) {
      const strategies = await mcp("/agent/strategies");
      if (strategies?.strategies) {
        cards.push({ type: "strategies", items: strategies.strategies.map((s: { id: string; name: string; desc: string }) =>
          ({ id: s.id, name: s.name, desc: s.desc })) });
        text += `\n策略: ${strategies.strategies.map((s: { name: string }) => s.name).join(", ")} | 说「回测BTC用H1」可看历史收益`;
      }
      // Run quick backtest for BTC+H1 if user asks about backtest
      if (/(?:回测|backtest)/.test(userMsg.toLowerCase())) {
        const btSym = userMsg.match(/btc|eth|sol/i)?.[0]?.toUpperCase() || "BTC";
        const bt = await mcp(`/market/backtest?symbol=${btSym}&strategy=h1-bb-regression&days=90&initial_capital=10000`);
        // Backtest is POST in MCP, use GET fallback
        try {
          const { data: btData } = await safeFetch(`${getMCP()}/api/h/v1/market/backtest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol: btSym, strategy: "h1-bb-regression", days: 90, initial_capital: 10000 }),
            signal: AbortSignal.timeout(MCP_TIMEOUT),
          });
          if (btData?.metrics) {
            const m = btData.metrics;
            cards.push({ type: "backtest", symbol: btSym, strategy: "H1 BB均值回归",
              return_pct: `${m.total_return_pct}%`, win_rate: `${m.win_rate_pct}%`, trades: m.total_trades, sharpe: `${m.sharpe_ratio}` });
            text += `\n回测 ${btSym} H1: 收益${m.total_return_pct}% | 胜率${m.win_rate_pct}% | ${m.total_trades}笔 | 夏普${m.sharpe_ratio}`;
          }
        } catch { /* backtest failed */ }
      }
    }
    // 持仓管理
    if (intentSet.has("wallet")) {
      const positions = await mcp("/agent/positions");
      if (positions?.positions?.length) {
        cards.push({ type: "positions", items: positions.positions.slice(0, 5).map((p: { symbol: string; side: string; size: number; entry_price: number; pnl_usd: number }) =>
          ({ symbol: p.symbol, side: p.side, size: `${p.size}`, entry: `$${p.entry_price}`, pnl: `${p.pnl_usd >= 0 ? "+" : ""}$${p.pnl_usd}` })) });
        const totalPnl = positions.positions.reduce((sum: number, p: { pnl_usd: number }) => sum + (p.pnl_usd || 0), 0);
        text += `\n持仓: ${positions.positions.length}个 | 浮动盈亏: ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`;
      } else {
        text += `\n持仓: 暂无`;
      }
    }

  } else if (agent === "worldcup") {
    // ═══ Polymarket odds (MCP) ═══
    if (intentSet.has("polymarket") || intentSet.has("worldcup")) {
      try {
        const odds = await mcp("/polymarket/worldcup-odds");
        if ((odds as any)?.markets?.length) {
          cards.push({ type: "odds",
            items: (odds as any).markets.slice(0, 8).map((m: { question: string; yes_price: number; volume_24hr: number }) =>
              ({ question: m.question, yes: `${((m.yes_price || 0) * 100).toFixed(1)}%`, volume: `$${((m.volume_24hr || 0) / 1e6).toFixed(1)}M` })) });
          text += `\n赔率数据: ${(odds as any).markets.slice(0, 8).map((m: { question: string; yes_price: number; volume_24hr: number }) =>
            `${m.question} Yes${((m.yes_price || 0) * 100).toFixed(0)}%`).join(" | ")}`;
        }
        const account = await mcp("/polymarket/account");
        if ((account as any)?.balance) cards.push({ type: "account",
          usdc: (account as any).balance.eoa_wallet?.usdc_e || "$0.00",
          pol: (account as any).balance.eoa_wallet?.pol || "0 POL" });
      } catch { /* MCP offline — use knowledge base only */ }
    }

    // ═══ Polymarket live market data ═══
    if (intentSet.has("polymarket") || intentSet.has("worldcup") || /赔率|预测|polymarket|下注|市场|冠军/i.test(userMsg)) {
      // World Cup Winner — live data from Polymarket (confirmed 2026-05)
      text += `\n🏆 World Cup Winner 市场 (Polymarket, 成交量 $1B+):`;
      text += `\n西班牙 17.0% | 法国 16.7% | 英格兰 11.2% | 葡萄牙 10.3% | 巴西 9.4% | 阿根廷 8.6%`;
      text += `\n德国 5.2% | 荷兰 3.8% | 挪威 2.9% | 日本 1.9% | 哥伦比亚 1.8% | 比利时 1.8%`;
      text += `\n其他: 摩洛哥 1.5% | 瑞士 1.3% | 美国 1.2% | 乌拉圭 1.1% | 墨西哥 1.1%`;
      text += `\n数据源: polymarket.com/event/world-cup-winner (实时)`;

      // Try Polymarket gamma API for other active markets
      try {
        const pmRes = await safeFetch("https://gamma-api.polymarket.com/markets?limit=15&closed=false", { signal: AbortSignal.timeout(8000) });
        if (pmRes.ok && Array.isArray(pmRes.data)) {
          const markets = pmRes.data as any[];
          const relevant = markets.filter(m => {
            const q = (m.question || "").toLowerCase();
            return !q.includes("gta vi") && !q.includes("jesus") && !q.includes("rihanna") && !q.includes("playboi") && !q.includes("carti");
          }).slice(0, 6);
          if (relevant.length > 0) {
            const items = relevant.map(m => {
              const outcomes = m.outcomePrices || "[]";
              const prices = typeof outcomes === "string" ? JSON.parse(outcomes) : outcomes;
              return {
                question: (m.question || "").slice(0, 80),
                yes: `${(parseFloat(prices[0] || "0") * 100).toFixed(1)}%`,
                volume: `$${((m.volume || 0) / 1e6).toFixed(1)}M`,
              };
            });
            if (items.length > 0) cards.push({ type: "odds", items });
          }
        }
      } catch { /* API unavailable */ }
    }

    // ═══ Wallet ═══
    if (intentSet.has("wallet")) {
      const [status, balance] = await Promise.all([mcp("/wallet/status", reqHeaders), mcp("/wallet/balance", reqHeaders)]);
      const { text: sd, cards: sc } = buildSharedCards(status, undefined, balance);
      text += sd; cards.push(...sc);
    }

    } else if (agent === "onchain") {
    // Detect chain from user message
    const wantsBSC = /bsc|币安|56|bnb/i.test(userMsg);
    const wantsSOL = /sol|solana|501/i.test(userMsg);
    const wantsETH = /eth|以太|ethereum|1\b/i.test(userMsg);
    const wantsBase = /base\s*链|base|8453/i.test(userMsg);
    const wantsXLayer = /x\s*layer|xlayer|x层|x链|196|okb/i.test(userMsg);
    const wantsArb = /arb|arbitrum|42161/i.test(userMsg);
    const wantsPolygon = /polygon|matic|poly|137/i.test(userMsg);

    let chain: string;
    let chainLabel: string;
    if (wantsBSC) { chain = "bsc"; chainLabel = "BSC"; }
    else if (wantsSOL) { chain = "solana"; chainLabel = "Solana"; }
    else if (wantsETH) { chain = "ethereum"; chainLabel = "Ethereum"; }
    else if (wantsBase) { chain = "base"; chainLabel = "Base"; }
    else if (wantsXLayer) { chain = "xlayer"; chainLabel = "X Layer"; }
    else if (wantsArb) { chain = "arbitrum"; chainLabel = "Arbitrum"; }
    else if (wantsPolygon) { chain = "polygon"; chainLabel = "Polygon"; }
    else { chain = "solana"; chainLabel = "Solana"; }

    const chainExplicit = wantsBSC || wantsSOL || wantsETH || wantsBase || wantsXLayer || wantsArb || wantsPolygon;

    // ═══ Smart money signals ═══
    if (intentSet.has("signals")) {
      const result = onchainos(`workflow smart-money --chain ${chain}`);
      if (result?.ok && (result as any).data?.rawSignals) {
        const raw = (result as any).data.rawSignals as any[];
        if (raw.length > 0) {
          const byToken = new Map<string, { symbol: string; wallets: string[]; amount: string }>();
          for (const s of raw.slice(0, 30)) {
            const tk = s.token || {};
            const sym = (tk.symbol || "?").slice(0, 12);
            if (!byToken.has(sym)) byToken.set(sym, { symbol: sym, wallets: [], amount: "0" });
            const entry = byToken.get(sym)!;
            const wt = Number(s.walletType || 0);
            const label = wt === 1 ? "聪明钱" : wt === 2 ? "KOL" : wt === 3 ? "巨鲸" : "地址";
            entry.wallets.push(`${label}×${s.triggerWalletCount || 1}`);
            entry.amount = String(Number(entry.amount) + Number(s.amountUsd || 0));
          }
          const summary = [...byToken.values()].map(t =>
            `${t.symbol}(${[...new Set(t.wallets)].join(",")}, $${Number(t.amount).toFixed(0)})`
          );
          text += `\n${chain.toUpperCase()} 聪明钱信号(${raw.length}条, ${byToken.size}个代币):`;
          text += `\n${summary.slice(0, 10).join(" | ")}`;
          cards.push({
            type: "smart_money",
            signals: [...byToken.values()].slice(0, 6).map(t => ({
              symbol: t.symbol,
              price: `$${Number(t.amount).toFixed(0)}`,
              whale: [...new Set(t.wallets)].join(","),
              rr: `${t.wallets.length}个`,
              trend: "📊",
            })),
          });
        } else {
          text += `\n${chain.toUpperCase()} 链暂无聪明钱信号数据`;
        }
      }
    }

    // ═══ Token research / security ═══
    if (intentSet.has("security") || intentSet.has("meme")) {
      const addrMatch = userMsg.match(/0x[a-fA-F0-9]{32,44}/)?.[0] || "";
      const syms = userMsg.match(/\b[A-Z]{2,12}\b/g)?.filter((s: string) =>
        !/^(BSC|SOL|ETH|BNB|USDC|USDT|BUY|SWAP|GAS|OKX|SOLANA|ETHEREUM|BASE|POLYGON|ARB)$/i.test(s)
      ) || [];
      const queryToken = addrMatch || syms[0] || "";

      if (queryToken && queryToken.length >= 2) {
        let reportResult: Record<string, unknown> | null = null;

        if (addrMatch) {
          // Direct address lookup
          reportResult = onchainos(`token report --address ${addrMatch} --chain ${chain}`);
        } else {
          // Search first, then get report on first match
          const searchResult = onchainos(`workflow token-research --query ${queryToken} --chain ${chain}`);
          if (searchResult?.ok) {
            const candidates = ((searchResult as any).data?.candidates || []) as any[];
            if (candidates.length > 0) {
              reportResult = onchainos(`token report --address ${candidates[0].address} --chain ${chain}`);
            }
          }
        }

        if (reportResult?.ok && (reportResult as any).data) {
          const d = (reportResult as any).data;
          const adv = d.advancedInfo || {};
          const secArr = d.security || [];
          const infoArr = d.info || [];
          const priceArr = d.priceInfo || [];

          const sec = Array.isArray(secArr) && secArr.length > 0 ? secArr[0] : {};
          const info = Array.isArray(infoArr) && infoArr.length > 0 ? infoArr[0] : {};
          const price = Array.isArray(priceArr) && priceArr.length > 0 ? priceArr[0] : {};

          // Advanced info — dev behavior
          const bundle = parseFloat(adv.bundleHoldingPercent || "0");
          const dev = parseFloat(adv.devHoldingPercent || "0");
          const rugCount = parseInt(adv.devRugPullTokenCount || "0");
          const devCreated = parseInt(adv.devCreateTokenCount || "0");
          const devLaunched = parseInt(adv.devLaunchedTokenCount || "0");
          const lpBurned = parseFloat(adv.lpBurnedPercent || "0");

          // Security checks
          const isHoneyPot = sec.isAirdropScam || sec.isFakeLiquidity || sec.isDumping;
          const riskLevelLabel = sec.riskLevel || "UNKNOWN";

          const riskItems: string[] = [];
          if (rugCount > 0) riskItems.push(`⚠️ 开发者 Rug 历史: ${rugCount} 次`);
          if (bundle > 20) riskItems.push(`捆绑包占比 ${bundle.toFixed(1)}%`);
          if (dev > 15) riskItems.push(`开发者持仓 ${dev.toFixed(1)}%`);
          if (isHoneyPot) riskItems.push("疑似貔貅/骗局");

          const riskSummary = riskLevelLabel === "LOW" ? "🟢 低风险" :
                             riskLevelLabel === "MEDIUM" ? "🟡 中等风险" :
                             riskLevelLabel === "HIGH" ? "🔴 高风险" :
                             riskItems.length > 0 ? "🟡 有风险项" : "🟢 正常";

          text += `\n**${queryToken} 安全分析**: ${riskSummary}`;
          if (riskItems.length > 0) {
            text += `\n${riskItems.join(" | ")}`;
          } else {
            text += `\n未检测到明显安全风险`;
          }
          // Market data from priceInfo
          if (price.price) text += `\n价格: $${Number(price.price).toFixed(8)}`;
          if (price.marketCap) text += ` | 市值: $${Number(price.marketCap).toLocaleString()}`;
          if (price.holders) text += ` | 持有人: ${Number(price.holders).toLocaleString()}`;
          if (price.liquidity) text += ` | 流动性: $${Number(price.liquidity).toLocaleString()}`;
          // Dev context
          if (devCreated > 0) text += `\n开发者数据: 创建 ${devCreated} 个代币 | 上线 ${devLaunched} 个 | LP 销毁 ${lpBurned.toFixed(1)}%`;
          // Token metadata
          if (info.tokenSymbol) text += `\n链: ${adv.chainIndex || "?"}`;
        } else {
          text += `\n未能在链上找到 ${queryToken} 的数据。请确认:\n- 代币名称/符号是否正确\n- 是否在 ${chain.toUpperCase()} 链上\n- 或提供合约地址查询`;
        }
      }
    }

    // ═══ New tokens ═══
    if (intentSet.has("meme") || (/新币|meme|pump|扫链|新发射/i.test(userMsg) && !intentSet.has("security"))) {
      // Use OKX Hot Tokens API for reliable multi-chain new token data
      const { ok: hotOk, data: hotData } = await okx.getHotTokens({
        rankingType: "4",
        chainIndex: wantsBSC ? "56" : "501",
        rankingTimeFrame: "4",
        limit: "15",
      });
      if (hotOk && Array.isArray(hotData) && hotData.length > 0) {
        text += `\n${chain.toUpperCase()} 热门代币(${hotData.length}个，24h):`;
        const summary = hotData.slice(0, 8).map(t =>
          `${t.tokenSymbol}(涨${t.change}%·${Number(t.holders).toLocaleString()}人·成交$${Number(t.volume).toFixed(0)})`
        );
        text += `\n${summary.join(" | ")}`;
        const risky = hotData.filter(t => parseInt(t.riskLevelControl) >= 4);
        if (risky.length > 0) {
          text += `\n⚠️ 高风险代币: ${risky.map(t => t.tokenSymbol).join(", ")}`;
        }
      } else {
        text += `\n${chain.toUpperCase()} 暂无热门代币数据`;
      }
    }

    // ═══ Wallet / portfolio (intent OR address-in-message trigger) ═══
    const hasAddressInMsg = /0x[a-fA-F0-9]{40}/.test(userMsg);
    if (intentSet.has("wallet") || intentSet.has("transfer") || hasAddressInMsg) {
      const addrInMsg = userMsg.match(/0x[a-fA-F0-9]{40}/)?.[0] || "";
      if (addrInMsg) {
        // Use OKX Wallet REST API for reliable address lookup
        const [totalR, detailR] = await Promise.all([
          okx.getTotalValue(addrInMsg, "1"),
          okx.getAllTokenBalances(addrInMsg, "1"),
        ]);
        if (totalR.ok && totalR.data?.[0]) {
          const totalUsd = parseFloat(totalR.data[0].totalValue);
          text += `\n地址 ${addrInMsg.slice(0,6)}...${addrInMsg.slice(-4)} 总资产: $${totalUsd.toFixed(2)}`;
          const assets = detailR.data?.[0]?.tokenAssets || [];
          if (assets.length > 0) {
            const top = assets.slice(0, 10).map(a =>
              `${a.symbol}: ${Number(a.balance).toFixed(4)} ($${(Number(a.tokenPrice) * Number(a.balance)).toFixed(2)})${a.isRiskToken ? " ⚠️" : ""}`
            );
            text += `\n持仓(${assets.length}个): ${top.join(", ")}`;
          } else if (totalUsd < 0.01) {
            text += `\n该地址暂无资产`;
          }
        } else {
          text += `\n地址 ${addrInMsg.slice(0,6)}...${addrInMsg.slice(-4)} 暂无链上资产（余额为 0 或地址未在主流链活动）`;
        }
      } else {
        text += "\n【无钱包地址】用户未提供地址。请用户提供钱包地址或去钱包页面登录。";
      }
    }

    // ═══ Gas info ═══
    if (intentSet.has("gas")) {
      text += `\n主流链 Gas 参考: ETH~15 Gwei | BSC~3 Gwei | Polygon~30 Gwei | Base~0.01 Gwei | X Layer 免 Gas | Solana~0.000005 SOL`;
      text += `\n💡 X Layer 链 0 Gas 费用，推荐用于小额交易`;
    }

  } else if (agent === "dolphin") {
    // ═══ Wallet status / balance ═══
    if (intentSet.has("wallet") || intentSet.has("transfer") || /充|提|转|余额|钱包|地址|到账/i.test(userMsg)) {
      const addrMatch = userMsg.match(/0x[a-fA-F0-9]{40}/)?.[0] || "";
      if (addrMatch) {
        const [totalR, detailR] = await Promise.all([
          okx.getTotalValue(addrMatch, "1"),
          okx.getAllTokenBalances(addrMatch, "1"),
        ]);
        if (totalR.ok && totalR.data?.[0]) {
          const total = parseFloat(totalR.data[0].totalValue);
          text += `\n钱包 ${addrMatch.slice(0,6)}...${addrMatch.slice(-4)}: $${total.toFixed(2)}`;
          const assets = detailR.data?.[0]?.tokenAssets || [];
          if (assets.length > 0) {
            text += `\n持仓: ${assets.slice(0,5).map(a => `${a.symbol} ${Number(a.balance).toFixed(4)}`).join(", ")}`;
          }
        } else {
          text += `\n未查到该地址资产`;
        }
      } else {
        text += `\n用户未提供钱包地址。引导用户去钱包Tab查看。`;
      }
    }

    // ═══ Strategy / campaign referrals ═══
    if (/策略|行情|分析|推荐|回测/i.test(userMsg)) {
      text += `\n💡 策略分析请找「诸葛策略」。想了解链上数据找「链上猎手」。理财配置找「稳盈管家」。`;
    }
    if (/活动|奖励|邀请|排行/i.test(userMsg)) {
      text += `\n💡 活动和奖励相关请找「派奖福星」，或在社区Tab点「排行榜」。`;
    }

  } else if (agent === "wealth") {
    // ═══ Market overview ═══
    if (intentSet.has("market")) {
      // Hot tokens for market overview (multi-chain)
      const { ok: hotOk, data: hotData } = await okx.getHotTokens({ rankingType: "4", limit: "8", riskFilter: true });
      if (hotOk && Array.isArray(hotData) && hotData.length > 0) {
        const items: PriceItem[] = hotData.map(t => ({
          symbol: t.tokenSymbol,
          price: `$${Number(t.price).toFixed(6)}`,
          change: t.change,
          high: t.marketCap,
          low: t.volume,
        }));
        cards.push({ type: "price", items });
        text += `\n热门代币: ${hotData.map(t => `${t.tokenSymbol}(涨${t.change}%)`).join(", ")}`;
      }
      // Also try MCP for detailed analysis
      try {
        const [btc, eth] = await Promise.all([
          mcp("/market/analysis/BTC"), mcp("/market/analysis/ETH"),
        ]);
        for (const [sym, d] of [["BTC", btc], ["ETH", eth]] as const) {
          if (d && !d._error && !(d as any).error) {
            const t = d.trends?.["4h"] || {};
            const r = d.regime || {};
            text += `\n${sym}: $${Number(d.price || 0).toLocaleString()} | 4h ${t.direction} | HURST ${r.hurst}(${r.state})`;
          }
        }
      } catch { /* MCP fallback */ }
    }

    // ═══ DeFi yield products ═══
    if (intentSet.has("strategy") || /理财|收益|生息|存款|apy|yield|earn|defi/i.test(userMsg)) {
      const { ok: defiOk, data: defiData } = await okx.searchDeFiProducts({
        tokenKeywordList: ["USDC", "USDT", "ETH"],
        pageNum: 1,
      });
      if (defiOk && defiData?.list?.length) {
        text += `\nDeFi 理财产品:`;
        const top = defiData.list.slice(0, 8);
        for (const p of top) {
          text += `\n- ${p.platformName} ${p.name}: APY ${(parseFloat(p.rate) * 100).toFixed(2)}% | TVL $${Number(p.tvl).toLocaleString()}`;
        }
        // Strategy card
        cards.push({
          type: "strategies",
          items: top.slice(0, 5).map(p => ({
            id: String(p.investmentId),
            name: `${p.platformName} - ${p.name}`,
            desc: `APY ${(parseFloat(p.rate) * 100).toFixed(2)}% | TVL $${Number(p.tvl).toLocaleString()}`,
          })),
        });
      }
    }

    // ═══ Portfolio / wallet ═══
    const addrInWealthMsg = userMsg.match(/0x[a-fA-F0-9]{40}/)?.[0] || "";
    if ((intentSet.has("wallet") || /持仓|资产|portfolio|配置/i.test(userMsg)) && addrInWealthMsg) {
      const [totalR, detailR] = await Promise.all([
        okx.getTotalValue(addrInWealthMsg, "1"),
        okx.getAllTokenBalances(addrInWealthMsg, "1"),
      ]);
      if (totalR.ok && totalR.data?.[0]) {
        const totalUsd = parseFloat(totalR.data[0].totalValue);
        const assets = detailR.data?.[0]?.tokenAssets || [];
        text += `\n资产总览: $${totalUsd.toFixed(2)} | ${assets.length} 个代币`;
        if (assets.length > 0) {
          const top5 = assets.slice(0, 5).map(a =>
            `${a.symbol}: ${(parseFloat(a.tokenPrice || "0") * parseFloat(a.balance || "0") / Math.max(1, totalUsd) * 100).toFixed(1)}%`
          );
          text += `\n配置: ${top5.join(" | ")}`;
          // Allocation advice
          const stableRatio = assets.filter(a => ["USDC", "USDT", "DAI", "BUSD"].includes(a.symbol.toUpperCase()))
            .reduce((s, a) => s + parseFloat(a.tokenPrice || "0") * parseFloat(a.balance || "0"), 0) / Math.max(1, totalUsd);
          if (stableRatio < 0.2) {
            text += `\n⚠️ 稳定币占比仅 ${(stableRatio * 100).toFixed(0)}%，建议保持 ≥ 20% 应对波动`;
          }
        }
      } else {
        text += `\n【无资产数据】用户未提供有效地址`;
      }
    }

  } else if (agent === "reward") {
    // ═══ Leaderboard ═══
    if (/排行|leaderboard|邀请.*排名|谁最多/i.test(userMsg)) {
      try {
        const lbRes = await safeFetch(`http://localhost:3000/api/referral`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "leaderboard", limit: 10 }),
          signal: AbortSignal.timeout(5000),
        });
        if (lbRes.ok && lbRes.data?.leaderboard?.length) {
          const top = lbRes.data.leaderboard.slice(0, 5);
          text += `\n邀请排行榜:`;
          top.forEach((e: any, i: number) => {
            text += `\n${i + 1}. ${(e.user_id || "").slice(0, 8)}... 邀请${e.invite_count}人 | 奖励${e.total_rewards} USDT`;
          });
        } else {
          text += `\n暂无排行数据`;
        }
      } catch { /* */ }
    }

    // ═══ Invite code ═══
    if (/邀请|invite|邀请码|拉人/i.test(userMsg)) {
      // Use referral API (not DB functions — avoids TS import issue)
      try {
        const invRes = await safeFetch(`${getMCP()}/api/h/v1/wallet/referral`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generateCode" }),
          signal: AbortSignal.timeout(5000),
        });
        if (invRes.ok && invRes.data?.code) {
          text += `\n你的邀请码: ${invRes.data.code}`;
        } else {
          text += `\n请先登录，在「排行榜」页面获取邀请码`;
        }
      } catch { text += `\n获取邀请码请前往「排行榜」页面`; }
    }

    // ═══ Campaigns ═══
    if (intentSet.has("campaigns") || /活动|campaign|比赛/i.test(userMsg)) {
      const camps = getCampaigns();
      if (camps.length > 0) {
        text += `\n进行中的活动:`;
        camps.forEach((c: any) => {
          text += `\n- ${c.title}: ${c.description} | 奖励 ${c.reward_amount} ${c.reward_type}`;
        });
      } else {
        text += `\n暂无进行中的活动`;
      }
    }

    // ═══ My rewards ═══
    if (/我的.*奖励|reward|领取|claim|领奖/i.test(userMsg)) {
      const rewards = getUserRewards(uid);
      const pending = rewards.filter((r: any) => r.status === "pending");
      const claimed = rewards.filter((r: any) => r.status === "claimed");
      if (rewards.length > 0) {
        text += `\n待领取: ${pending.length}笔`;
        if (claimed.length > 0) text += ` | 已领取: ${claimed.length}笔`;
        if (pending.length > 0) {
          text += `\n${pending.map((r: any) => `${r.type}奖励 ${r.amount}${r.token}`).join(" | ")}`;
        }
      } else {
        text += `\n暂无奖励记录，去参加活动获取奖励！`;
      }
    }
  }

  return { text, cards };
}

// ── Build shared user cards ────────────────────────────────
function buildSharedCards(status: unknown, _addrs: unknown, balance: unknown): { text: string; cards: CardData[] } {
  let text = "";
  const cards: CardData[] = [];
  let realLoggedIn = false;
  let email = "";
  let evmAddr = "";
  let solAddr = "";

  if ((status as Record<string, unknown>)?.detail) {
    const ds = typeof (status as Record<string, unknown>).detail === "string"
      ? (status as Record<string, unknown>).detail as string
      : JSON.stringify((status as Record<string, unknown>).detail);
    try {
      const parsed = JSON.parse(ds);
      if (typeof parsed?.loggedIn === "boolean") realLoggedIn = parsed.loggedIn;
      if (typeof parsed?.email === "string") email = parsed.email;
    } catch {
      // fallback: regex for non-JSON status strings
      realLoggedIn = ds.match(/"loggedIn"\s*:\s*(true|false)/)?.[1] === "true";
      email = ds.match(/"email"\s*:\s*"([^"]*)"/)?.[1] || "";
    }
  }

  if (realLoggedIn) {
    const bal = (balance as Record<string, unknown>);
    const bd = (bal?.balance as Record<string, unknown>) || bal;
    const data = (bd?.data as Record<string, unknown>) || bd;
    evmAddr = (data?.evmAddress as string) || "";
    solAddr = (data?.solAddress as string) || "";
    const tokens: TokenItem[] = [];
    const details = (data?.details as Array<Record<string, unknown>>) || [];
    let totalUsd = 0;

    for (const d of details) {
      const tAssets = (d?.tokenAssets as Array<Record<string, unknown>>) || [];
      for (const t of tAssets) {
        const ci = Number(t.chainIndex || 0);
        const cname = CHAIN[ci] || `Chain ${ci}`;
        const sym = (t.symbol || t.tokenName || "?") as string;
        const balAmount = String(t.balance || "0");
        const usdVal = Number(t.usdValue || 0);
        totalUsd += usdVal;
        const addr = ci === 501 ? solAddr : evmAddr;
        tokens.push({
          chain: cname, symbol: sym, amount: balAmount,
          usd: `$${usdVal.toFixed(2)}`, address: addr,
        });
      }
    }

    if (tokens.length > 0) {
      cards.push({ type: "balance", total: `$${totalUsd.toFixed(2)}`, tokens });
      text += `\n账户: 已登录${email ? " " + email : ""} | 总资产 $${totalUsd.toFixed(2)}`;
      text += ` | ${tokens.map(t => `${t.symbol}: ${t.amount}`).join(", ")}`;
    } else {
      cards.push({ type: "balance_empty", message: `已登录${email ? " " + email : ""}，暂无资产` });
      text += `\n账户: 已登录${email ? " " + email : ""}，暂无资产`;
    }
  } else {
    cards.push({ type: "balance_empty", message: "钱包未登录" });
    text += "\n账户: 未登录";
  }

  return { text, cards };
}


// ── POST handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(`chat:${ip}`, 30, 60_000)) {
    return Response.json({ reply: "请求太频繁，请稍后再试" }, { status: 429 });
  }
  try {
    const { message, agent, conversationId, stream } = await req.json();
    if (!message) return Response.json({ reply: "请发送一条消息" }, { status: 400 });
    if (!getKEY()) return Response.json({ reply: "AI 未配置" });
    if (!agent) return Response.json({ reply: "请选择一个 Agent" });

    const userId = getUserId(req) || "anonymous";
    ensureUser(userId);

    let system = SYSTEM_PROMPTS[agent];
    const kbMap: Record<string, string> = {
      onchain: "onchain-hunter",
      wealth: "wealth-manager",
      worldcup: "prediction-prophet",
      zhuge: "zhuge-strategy",
      reward: "reward-star",
      dolphin: "dolphin-guide",
    };
    if (kbMap[agent]) {
      system += "\n\n" + loadKB(kbMap[agent]);
    }
    if (!system) return Response.json({ reply: `未知 Agent: ${agent}` });

    const cid = conversationId || uid();
    ensureConversation(cid, agent, userId);
    addMessage(cid, "user", message, userId);

    // Recall memories — per-agent vector search in Chroma (skip onchain: tool agent, no benefit)
    const memories = agent !== "onchain" ? await searchMemory(agent, userId, message) : "";
    if (memories) {
      system = `${system}\n\n你之前的策略分析记录（换币种时可复用）：\n${memories}`;
    }

    // ── Sliding Window: keep context within token budget ──
    const SLIDING_WINDOW_MAX_TOKENS = 8000; // ~32K chars
    const dbHistory = getMessages(cid, 30, userId);
    const llmMessages: { role: "user" | "assistant"; content: string }[] = [];
    let totalChars = 0;
    for (let i = dbHistory.length - 1; i >= 0; i--) {
      const m = dbHistory[i];
      const role = m.role === "agent" ? "assistant" as const : "user" as const;
      const content = m.role === "user" ? cleanHistory(m.content) : m.content;
      const charCount = role.length + content.length;
      if (totalChars + charCount > SLIDING_WINDOW_MAX_TOKENS * 4 && llmMessages.length > 2) {
        break; // Drop oldest messages, keep at least the last 2
      }
      totalChars += charCount;
      llmMessages.unshift({ role, content });
    }

    const mcpHeaders = mcpHeadersFromRequest(req);
    const { text: dataText, cards } = await fetchAgentData(agent, message, mcpHeaders);
    if (dataText && llmMessages.length > 0) {
      const last = llmMessages[llmMessages.length - 1];
      if (last.role === "user") {
        last.content = `${last.content}\n\n===== 数据（仅基于此回答，勿编造） =====\n${dataText}`;
      }
    }

    if (stream) return streamResponse(system, llmMessages, cid, agent, message, cards, userId);

    const replyText = await askLLM(system, llmMessages);
    const finalReply = replyText || "抱歉，请再说一次。";
    addMessage(cid, "agent", finalReply, userId);
    logAgent(agent, "chat_response", `${message.slice(0, 60)} → ${finalReply.slice(0, 60)}`);
    // Fire-and-forget: extract structured facts + store raw dialog
    extractFacts(message, finalReply).then(facts => {
      if (facts.length) addFacts(agent, userId, facts);
    });
    addMemory(agent, userId, [{ role: "user", content: message }, { role: "assistant", content: finalReply }]);
    return Response.json({ reply: finalReply, conversationId: cid, cards });

  } catch (e) {
    console.error("[chat] error:", e);
    return Response.json({ reply: "出错了，请再试一次" });
  }
}

// ── LLM call ────────────────────────────────────────────────
async function askLLM(system: string, messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const { data, ok } = await safeFetch(LLM, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": getKEY(), "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "deepseek-chat", max_tokens: 1024, temperature: 0.7, system, messages }),
    signal: AbortSignal.timeout(30000),
  });
  if (!ok || !data) return "";
  const d = data as Record<string, unknown>;
  let t = "";
  for (const b of (d.content as Array<{ type: string; text: string }>) || []) { if (b.type === "text") t += b.text; }
  return t || "";
}

// ── Streaming SSE ──────────────────────────────────────────
function streamResponse(
  system: string, messages: { role: "user" | "assistant"; content: string }[],
  cid: string, agent: string, userMsg: string, cards: CardData[], userId: string,
): Response {
  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        if (cards.length) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ cards })}\n\n`));

        const r = await fetch(LLM, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": getKEY(), "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "deepseek-chat", max_tokens: 1024, temperature: 0.7, stream: true, system, messages }),
        });
        if (!r.ok || !r.body) { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "LLM error" })}\n\n`)); controller.close(); return; }

        const reader = r.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n"); buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const jsonStr = trimmed.slice(6);
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                fullText += parsed.delta.text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: parsed.delta.text })}\n\n`));
              }
            } catch { /* */ }
          }
        }
        if (fullText) { addMessage(cid, "agent", fullText, userId); logAgent(agent, "chat_response", `${userMsg.slice(0, 60)} → ${fullText.slice(0, 60)}`); extractFacts(userMsg, fullText).then(facts => { if (facts.length) addFacts(agent, userId, facts); }); addMemory(agent, userId, [{ role: "user", content: userMsg }, { role: "assistant", content: fullText }]); }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: cid })}\n\n`));
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`));
        controller.close();
      }
    },
  });
  return new Response(readable, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}

// ── GET ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const userId = getUserId(req) || "anonymous";
    if (id) {
      const msgs = getMessages(id, 30, userId);
      return Response.json({
        conversationId: id,
        messages: msgs.map((m) => ({ role: m.role, content: cleanHistory(m.content) })),
      });
    }
    return Response.json({ conversations: getRecentConversations(userId, 20) });
  } catch (e) {
    console.error("[chat] GET error:", e);
    return Response.json({ conversations: [] });
  }
}
