import { NextRequest } from "next/server";
import { ensureConversation, addMessage, getMessages, getRecentConversations, ensureUser } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { safeFetch } from "@/lib/fetch";
import { addMemory, addFacts, searchMemory, extractFacts } from "@/lib/memory";
import crypto from "crypto";

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
  // Include auth snippet in cache key so different users don't share cached auth results
  const authSuffix = reqHeaders?.["Authorization"]?.slice(-12) || "noauth";
  const cacheKey = `${path}|${authSuffix}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const fetchHeaders: Record<string, string> = {};
  if (MCP_API_KEY) fetchHeaders["X-API-Key"] = MCP_API_KEY;
  if (reqHeaders) Object.assign(fetchHeaders, reqHeaders);

  const { data } = await safeFetch(`${getMCP()}${path}`, {
    headers: Object.keys(fetchHeaders).length ? fetchHeaders : undefined,
    signal: AbortSignal.timeout(MCP_TIMEOUT),
  });

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
  fetch(`${getMCP()}/agent/log`, {
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
    "你是「诸葛策略」，加密货币量化分析师。\n" +
    "你能做：\n" +
    "- 行情分析: BTC/ETH/SOL及任意币种实时价格+HURST趋势+EMA均线+布林带+Pivot支撑阻力\n" +
    "- 交易信号: 基于EMA金叉死叉+布林带突破的策略信号(RR/入场/止盈/止损)\n" +
    "- 多币扫描: 一键扫描8币种，按信号质量排序\n" +
    "- 策略回测: H1布林带均值回归/H3支撑狙击，收益/胜率/夏普比\n" +
    "- 持仓管理: 实时浮动盈亏\n" +
    "- K线数据: 历史OHLCV，支持多时间框架\n" +
    "风格: 简洁专业，每句话带数字。不编造，没数据就说没数据。\n" +
    "HURST>0.55趋势 | <0.45震荡 | 之间观望 | 每单≤10%仓位必带止损\n" +
    "用户说充值/转账/入金/地址 → 引导切换到小海豚。\n" +
    "数据在下文中。没有数据就引导用户给具体币种或策略名。",

  worldcup:
    "你是「AI预言帝」，Polymarket预测市场分析师。\n" +
    "你能做：世界杯赔率分析、预测市场下单、账户查询、市场搜索、世界杯知识。\n" +
    "风格：简洁有激情，给出具体赔率数字和24h交易量。不编造。\n" +
    "数据（如果有）在下文中。没有数据就正常对话。",

  onchain:
    "你是「链上猎手」。把用户说的话交给 OKX OnchainOS 执行，把返回结果直接展示。\n" +
    "你不是分析师，不是顾问。你是传声筒。不解释、不建议、不反问、不承诺。\n" +
    "有数据显示数据，没数据就说没数据。",

  dolphin:
    "你是「小海豚」，Web3全能助手。全平台唯一负责充币、提币、转账、兑换指引的Agent。语气温暖耐心，像邻家姐姐。\n" +
    "你能做：充币指引(给地址)、提币指引(帮用户填表单)、兑换指引(帮用户选币种)、转账指引、查余额、安全科普、术语解释、策略推荐、活动入口。\n" +
    "用生活类比解释技术。先回答再延伸，结尾给下一步建议。\n" +
    "⚠️ 重要：\n" +
    "- 用户问「到账了吗」→ 重新查钱包余额对比数据回答，不猜不编\n" +
    "- 用户说「我要充币」「给我地址」→ 引导用户去侧边栏点充币按钮，那里显示真实地址\n" +
    "- 用户说「我要提币」→ 引导用户去侧边栏点提币按钮填表单\n" +
    "- 用户说「我要兑换」→ 引导用户去侧边栏点兑换按钮操作\n" +
    "- 任何链上操作前先确认钱包已登录，未登录则引导去登录\n" +
    "数据（如果有）在下文中。没有数据就正常聊天引导。",

  wealth:
    "你是「稳盈管家」，多市场行情顾问。风格稳重可靠。\n" +
    "你能做：多币行情概览、深度技术分析、K线解读、资产配置建议（仅供参考）。\n" +
    "用户问「该买吗」→ 给数据不给建议。不编造。\n" +
    "数据（如果有）在下文中。没有数据就正常对话。",

  reward:
    "你是「派奖福星」，活动运营助手。热情大方。\n" +
    "你能做：活动列表、活动详情、领奖指引、排行榜。\n" +
    "数据（如果有）在下文中。没有数据就列出已知活动。",
};

const WC_KNOWLEDGE = [
  "2026世界杯: 6.11-7.19 | 美加墨 | 48队12组 | 决赛: 纽约MetLife",
  "已出线: 美/加/墨(东道主) | 日/伊(亚洲) | 新西兰(大洋洲)",
  "冠军: 巴西5 德国4 意大利4 阿根廷3 法国2 乌拉圭2 英格兰1 西班牙1",
].join("\n");


// ── LLM-based intent extraction (no regex) ───────────────
async function detectIntent(msg: string): Promise<{ intents: string[]; swap?: { fromToken?: string; toToken?: string; amount?: string; chain?: string } }> {
  if (!getKEY()) return { intents: [] };
  try {
    const r = await fetch(LLM, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": getKEY(), "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "deepseek-chat", max_tokens: 150, temperature: 0,
        system: `Classify user intent + extract swap params. Return ONLY valid JSON, no other text.
{"intents":["meta"|"market"|"wallet"|"transfer"|"polymarket"|"worldcup"|"signals"|"campaigns"|"swap"|"meme"|"bridge"|"gas"|"security"|"strategy"]}
If swap: add "swap":{"fromToken":"SYMBOL_OR_0xADDR","toToken":"SYMBOL_OR_0xADDR","amount":"NUMBER","chain":"OPTIONAL_CHAIN"}
If user gives only one token/contract, use USDT as fromToken.
If user says "买"/"换" with amount and token, intent=swap.`,
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

  if (agent === "zhuge") {
    // 行情分析 — 只有问价格/走势才拉
    if (intentSet.has("market")) {
      const [btc, eth, sol, scan] = await Promise.all([
        mcp("/market/analysis/BTC"), mcp("/market/analysis/ETH"), mcp("/market/analysis/SOL"),
        mcp("/market/scan"),
      ]);
      const prices: PriceItem[] = [];
      const sigItems: SignalItem[] = [];
      for (const [sym, d] of [["BTC", btc], ["ETH", eth], ["SOL", sol]] as const) {
        if (d && !d._error) {
          const t = d.trends?.["4h"] || {};
          prices.push({
            symbol: sym, price: `$${Number(d.price || 0).toLocaleString()}`,
            change: (t.strength_pct || 0) > 0 ? `+${t.strength_pct || 0}` : `${t.strength_pct || 0}`,
          });
          if (d.signals?.length)
            for (const s of d.signals)
              sigItems.push({ symbol: sym, direction: s.direction, entry: `$${s.entry || "?"}`, tp: `$${s.tp || "?"}`, sl: `$${s.sl || "?"}`, rr: s.rr ? `1:${s.rr}` : undefined, strategy: s.strategy });
        }
      }
      if (prices.length) cards.push({ type: "price", items: prices });
      if (sigItems.length) cards.push({ type: "signal", items: sigItems });
      if (scan && !scan._error) {
        cards.push({ type: "scan", coins: scan.coins_scanned || 0, signals: scan.coins_with_signals || 0,
          top: (scan.results || []).filter((r: { signals_count: number }) => r.signals_count > 0).slice(0, 5)
            .map((r: { symbol: string; price: number; best_rr: number }) => ({ symbol: r.symbol, price: `$${r.price}`, rr: `${r.best_rr}` })) });
      }
      for (const [sym, d] of [["BTC", btc], ["ETH", eth], ["SOL", sol]] as const) {
        if (d && !d._error) {
          const r = d.regime || {};
          const t4 = d.trends?.["4h"] || {};
          const lv = d.levels || {};
          text += `\n${sym}: $${d.price} | HURST ${r.hurst}(${r.state}) | 4h ${t4.direction} | S1 $${lv.pivot?.s1 || "?"} R1 $${lv.pivot?.r1 || "?"}`;
          if (d.signals?.length) text += ` | 信号: ${d.signals.map((s: { strategy: string; direction: string }) => `${s.strategy} ${s.direction}`).join(", ")}`;
        }
      }
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
          const { data: btData } = await safeFetch(`${getMCP()}/market/backtest`, {
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
    // 世界杯知识 — 聊世界杯话题就注入（不含赔率数据）
    if (intentSet.has("worldcup")) {
      text += `\n${WC_KNOWLEDGE}`;
    }
    // 赔率数据 — 只有明确要赔率/下注时才拉
    if (intentSet.has("polymarket")) {
      const odds = await mcp("/polymarket/worldcup-odds");
      const account = await mcp("/polymarket/account");
      if ((account as any)?.balance) cards.push({ type: "account",
        usdc: (account as any).balance.eoa_wallet?.usdc_e || "$0.00",
        pol: (account as any).balance.eoa_wallet?.pol || "0 POL" });
      if ((odds as any)?.markets?.length) {
        cards.push({ type: "odds",
          items: (odds as any).markets.slice(0, 8).map((m: { question: string; yes_price: number; volume_24hr: number }) =>
            ({ question: m.question, yes: `${((m.yes_price || 0) * 100).toFixed(1)}%`, volume: `$${((m.volume_24hr || 0) / 1e6).toFixed(1)}M` })) });
        text += `\n赔率: ${(odds as any).markets.slice(0, 8).map((m: { question: string; yes_price: number; volume_24hr: number }) =>
          `${m.question} Yes${((m.yes_price || 0) * 100).toFixed(0)}% Vol${((m.volume_24hr || 0) / 1e6).toFixed(1)}M`).join(" | ")}`;
      }
    }
    if (intentSet.has("wallet")) {
      const [status, balance] = await Promise.all([mcp("/wallet/status", reqHeaders), mcp("/wallet/balance", reqHeaders)]);
      const { text: sd, cards: sc } = buildSharedCards(status, undefined, balance);
      text += sd; cards.push(...sc);
    }

  } else if (agent === "onchain") {
    // ── Wallet data ──
    if (intentSet.has("wallet") || intentSet.has("transfer")) {
      const [status, balance] = await Promise.all([mcp("/wallet/status", reqHeaders), mcp("/wallet/balance", reqHeaders)]);
      const { text: sd, cards: sc } = buildSharedCards(status, undefined, balance);
      text += sd; cards.push(...sc);
    }
    // ── Smart money / whale signals (onchainos signal list) ──
    if (intentSet.has("signals")) {
      const sm = await mcp("/signals/smart-money?chain=ethereum&limit=20");
      const rawSignals = sm?.signals || [];
      if (rawSignals.length) {
        // Normalize: onchainos uses token.symbol, fallback uses top-level symbol
        const normalized = rawSignals.map((s: Record<string, unknown>) => {
          const tk = s.token as Record<string, unknown> | undefined;
          const symbol = (tk?.symbol as string || s.symbol as string || "?").slice(0, 10);
          const wt = Number(s.walletType || 0);
          const whale = wt === 1 ? "聪明钱" : wt === 2 ? "KOL" : wt === 3 ? "巨鲸" : (s.whale_activity as string || "信号");
          // Format market cap compact
          const mc = Number(tk?.marketCapUsd || s.price || 0);
          const mcStr = mc > 1e9 ? `$${(mc/1e9).toFixed(1)}B` : mc > 1e6 ? `$${(mc/1e6).toFixed(1)}M` : mc > 1e3 ? `$${(mc/1e3).toFixed(0)}K` : `$${mc}`;
          // Operation description
          const ratio = Number(s.soldRatioPercent || 0);
          const action = ratio > 80 ? "大量卖出" : ratio > 50 ? "减仓" : ratio > 0 ? "部分卖出" : "买入";
          return {
            symbol,
            price: mcStr,
            whale,
            rr: `${s.triggerWalletCount || s.best_rr || "?"}`,
            trend: `${action} $${Number(s.amountUsd || 0).toLocaleString().slice(0,8)}`,
          };
        });
        cards.push({ type: "smart_money", signals: normalized.slice(0, 6) });
        text += `\n链上信号(${normalized.length}): ${normalized.map((s: { symbol: string }) => s.symbol).join(", ")}`;
        if (sm.source) text += ` | 数据源: ${sm.source}`;
      } else {
        text += `\n暂无链上信号`;
      }
    }
    // ── Meme scan ──
    if (intentSet.has("meme")) {
      const meme = await mcp("/meme/scan");
      if (meme?.tokens?.length) {
        text += `\nMeme扫链(${meme.tokens.length}): ${meme.tokens.slice(0, 5).map((t: { symbol: string; change_24h: number }) =>
          `${t.symbol}(${t.change_24h > 0 ? "+" : ""}${t.change_24h}%)`).join(", ")}`;
        if (meme.new_launches_24h) text += ` | 新发射: ${meme.new_launches_24h}个`;
        if (meme.note) text += `\n${meme.note}`;
      }
    }
    // ── Bridge info ──
    if (intentSet.has("bridge")) {
      const bridge = await mcp("/bridge/chains");
      if (bridge?.chains) {
        cards.push({ type: "bridge", chains: bridge.chains, protocols: bridge.protocols || [] });
        text += `\n跨链桥: ${bridge.chains.map((c: { name: string }) => c.name).join("→")} | ${(bridge.protocols || []).map((p: { name: string }) => p.name).join("/")}`;
        if (bridge.note) text += `\n${bridge.note}`;
      }
    }
    // ── Gas station ──
    if (intentSet.has("gas") || intentSet.has("transfer") || intentSet.has("wallet")) {
      const gasInfo = await mcp("/gas-station/info");
      if (gasInfo?.supported_chains) {
        cards.push({ type: "gas", chains: gasInfo.supported_chains.map((c: { chain: string; stablecoins: string[] }) =>
          ({ chain: c.chain, coins: (c.stablecoins || []).join("/") })), note: gasInfo.description || "" });
        text += `\nGas站: ${gasInfo.supported_chains.map((c: { chain: string }) => c.chain).join(", ")} | ${gasInfo.description || ""}`;
      }
    }
    // ── Swap: direct execution when user says 换/买/swap ──
    const hasAddr = /0x[a-fA-F0-9]{40}/.test(userMsg);
    const wantsSwap = /换|买|buy|swap|兑换/i.test(userMsg);
    if (intentSet.has("swap") || (hasAddr && wantsSwap)) {
      const sw = intent.swap || {};
      const addrMatch = userMsg.match(/0x[a-fA-F0-9]{40}/);
      const toToken = sw.toToken || (addrMatch ? addrMatch[0] : "");
      const nums = userMsg.match(/\d+(\.\d+)?/g) || [];
      const amount = sw.amount || nums[0] || "1";
      const fromToken = sw.fromToken || "USDT";
      const chainName = sw.chain || "xlayer";
      const chainIndex = CHAIN_NAME_MAP[chainName.toLowerCase()] || 196;

      if (toToken && amount) {
        const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (MCP_API_KEY) fetchHeaders["X-API-Key"] = MCP_API_KEY;
        if (reqHeaders) Object.assign(fetchHeaders, reqHeaders);
        const { data: r } = await safeFetch(`${getMCP()}/dex/swap`, {
          method: "POST", headers: fetchHeaders,
          body: JSON.stringify({ fromToken, toToken, amount, chainIndex }),
          signal: AbortSignal.timeout(60000),
        });
        const res = r as Record<string, unknown>;
        if (res?.ok) {
          const txHash = (res.txHash as string) || "";
          const detail = (res.detail || res.data || "") as string;
          text += `\n✅ 兑换成功`;
          text += `\n数量: ${amount} ${fromToken} → ${toToken}`;
          text += `\n链: ${chainName} (${CHAIN[chainIndex] || chainIndex})`;
          if (txHash) text += `\nTX: \`${txHash}\``;
          if (detail) text += `\n详情: ${detail.slice(0, 300)}`;
        } else {
          const errDetail = String(res?.detail || res?.error || res?.message || "");
          text += `\n❌ 兑换失败`;
          text += `\n${amount} ${fromToken} → ${toToken} @ ${chainName}`;
          text += `\n${errDetail.slice(0, 200)}`;
        }
      } else {
        const quote = await mcp("/swap/quote");
        if (quote && !quote._error) text += `\n报价: ${quote.from_token}→${quote.to_token} | 1:${quote.price}`;
      }
    }

  } else if (agent === "dolphin") {
    if (intentSet.has("wallet") || intentSet.has("transfer")) {
      const [status, balance] = await Promise.all([mcp("/wallet/status", reqHeaders), mcp("/wallet/balance", reqHeaders)]);
      const { text: sd, cards: sc } = buildSharedCards(status, undefined, balance);
      text += sd; cards.push(...sc);
    }
    if (intentSet.has("strategy") || intentSet.has("campaigns")) {
      const [strategies, camps] = await Promise.all([mcp("/agent/strategies"), mcp("/boost/campaigns")]);
      if (strategies?.strategies) text += `\n可用策略: ${strategies.strategies.map((s: { name: string }) => s.name).join(", ")}`;
      if (camps?.campaigns?.length) text += `\n活动: ${camps.campaigns.map((c: { name: string; status: string }) => `${c.name}(${c.status})`).join(", ")}`;
    }

  } else if (agent === "wealth") {
    if (intentSet.has("market")) {
      const [btc, eth, sol] = await Promise.all([
        mcp("/market/analysis/BTC"), mcp("/market/analysis/ETH"), mcp("/market/analysis/SOL"),
      ]);
      const prices: PriceItem[] = [];
      for (const [sym, d] of [["BTC", btc], ["ETH", eth], ["SOL", sol]] as const) {
        if (d && !d._error) {
          const t = d.trends?.["4h"] || {};
          prices.push({ symbol: sym, price: `$${Number(d.price || 0).toLocaleString()}`, change: (t.strength_pct || 0).toFixed(1) });
          const r = d.regime || {};
          text += `\n${sym}: $${d.price} | 24h ${t.strength_pct?.toFixed?.(1) || "?"}% | HURST ${r.hurst}(${r.state}) | 4h ${t.direction}`;
        }
      }
      if (prices.length) cards.push({ type: "price", items: prices });
    }

  } else if (agent === "reward") {
    if (intentSet.has("campaigns")) {
      const camps = await mcp("/boost/campaigns");
      if (camps?.campaigns?.length) {
        text = camps.campaigns.map((c: { name: string; status: string }) => `**${c.name}** — ${c.status}`).join("\n");
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
    if (!system) return Response.json({ reply: `未知 Agent: ${agent}` });

    const cid = conversationId || uid();
    ensureConversation(cid, agent, userId);
    addMessage(cid, "user", message, userId);

    // Recall memories — per-agent vector search in Chroma (skip onchain: tool agent, no benefit)
    const memories = agent !== "onchain" ? await searchMemory(agent, userId, message) : "";
    if (memories) {
      system = `${system}\n\n你之前的策略分析记录（换币种时可复用）：\n${memories}`;
    }

    const dbHistory = getMessages(cid, 20, userId);
    const llmMessages: { role: "user" | "assistant"; content: string }[] = [];
    for (const m of dbHistory) {
      llmMessages.push({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.role === "user" ? cleanHistory(m.content) : m.content,
      });
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
      const msgs = getMessages(id, 100, userId);
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
