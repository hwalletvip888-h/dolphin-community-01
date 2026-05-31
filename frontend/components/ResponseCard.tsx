"use client";

import React from "react";
import { Copy, Check, TrendingUp, TrendingDown, Minus, Wallet, BarChart3, Activity, Trophy, Radio, List, Newspaper, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Send, RefreshCw, X } from "lucide-react";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("dolphin_token") || "" : "";
  return token ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } : { "Content-Type": "application/json" };
}

export interface TokenItem {
  chain: string;
  symbol: string;
  amount: string;
  usd: string;
  address: string;
}

export interface PriceItem {
  symbol: string;
  price: string;
  change: string;
  high?: string;
  low?: string;
}

export interface SignalItem {
  symbol?: string;
  direction: string;
  entry: string;
  tp: string;
  sl: string;
  rr?: string;
  strategy?: string;
}

export type CardData =
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-[11px] text-white/70 hover:text-white"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span className="font-mono text-[10px]">
        {text.slice(0, 6)}...{text.slice(-4)}
      </span>
    </button>
  );
}

function TrendIcon({ change }: { change: string }) {
  const v = parseFloat(change);
  if (isNaN(v) || v === 0) return <Minus size={14} className="text-white/40" />;
  if (v > 0) return <TrendingUp size={14} className="text-emerald-400" />;
  return <TrendingDown size={14} className="text-red-400" />;
}

// ── Balance Card ────────────────────────────────────────────
function BalanceCard({ data }: { data: Extract<CardData, { type: "balance" }> }) {
  type Panel = "deposit" | "withdraw" | "swap" | null;
  const [panel, setPanel] = React.useState<Panel>(null);
  const [toAddr, setToAddr] = React.useState("");
  const [sendAmt, setSendAmt] = React.useState("");
  const [swapAmt, setSwapAmt] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [swapping, setSwapping] = React.useState(false);
  const [toast, setToast] = React.useState("");

  const firstToken = data.tokens[0];
  const addr = firstToken?.address || "";
  const symbol = firstToken?.symbol || "";

  const toggle = (p: Panel) => setPanel(panel === p ? null : p);

  const copyAddr = async () => {
    await navigator.clipboard.writeText(addr);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const chainReverse: Record<string, number> = { "X Layer": 196, Ethereum: 1, Optimism: 10, BSC: 56, Polygon: 137, zkSync: 324, Base: 8453, Arbitrum: 42161, Avalanche: 43114, Solana: 501 };
  const chainIndex = chainReverse[firstToken?.chain || ""] || 196;

  const errMsg = (d: Record<string, unknown>): string => {
    if (d.error) return String(d.error).slice(0, 80);
    try { const p = JSON.parse(String(d.detail || "")); if (p.error) return String(p.error).slice(0, 80); } catch { /* */ }
    return "操作失败";
  };

  const handleSend = async () => {
    if (!toAddr.trim() || !sendAmt) return;
    setSending(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: "send", to: toAddr, amount: sendAmt, tokenSymbol: symbol, chainIndex }),
      });
      const data = await res.json();
      if (data.ok) {
        setToast(`✅ 转账已提交 — ${(data.txHash || "").slice(0, 10)}...`);
        setToAddr(""); setSendAmt("");
        setPanel(null);
      } else {
        setToast(`❌ ${errMsg(data)}`);
      }
    } catch {
      setToast("❌ 网络异常，请重试");
    }
    setSending(false);
  };

  const handleSwap = async () => {
    if (!swapAmt) return;
    setSwapping(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: "swap", fromToken: symbol, toToken: "USDT", amount: swapAmt, chainIndex }),
      });
      const data = await res.json();
      if (data.ok) {
        setToast(`✅ 兑换已提交 — ${(data.txHash || "").slice(0, 10)}...`);
        setSwapAmt("");
        setPanel(null);
      } else {
        setToast(`❌ ${errMsg(data)}`);
      }
    } catch {
      setToast("❌ 网络异常，请重试");
    }
    setSwapping(false);
  };

  return (
    <div className="my-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white/80 flex items-center gap-1.5">
          <Wallet size={14} className="text-white/60" />总资产
        </span>
        <span className="text-[20px] font-bold text-[#FBBF24]">{data.total}</span>
      </div>
      {/* Token rows */}
      {data.tokens.map((t, i) => (
        <div
          key={i}
          className={`px-4 py-3 ${i < data.tokens.length - 1 ? "border-b border-white/5" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[13px] font-bold text-white/80 shrink-0">
              {t.symbol.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-white/90">{t.symbol}</div>
              <div className="text-[13px] text-white/60">{t.amount}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[16px] font-semibold text-white/90">{t.usd}</div>
              <div className="text-[11px] text-white/40">{t.chain}</div>
            </div>
          </div>
          <div className="mt-2 ml-[52px]">
            <CopyButton text={t.address} />
          </div>
        </div>
      ))}
      {/* Action buttons */}
      <div className="px-4 py-2.5 border-t border-white/5 grid grid-cols-3 gap-2">
        <ActionBtn icon={<ArrowDownToLine size={15} />} label="充币" active={panel === "deposit"} onClick={() => toggle("deposit")} />
        <ActionBtn icon={<ArrowUpFromLine size={15} />} label="提币" active={panel === "withdraw"} onClick={() => toggle("withdraw")} />
        <ActionBtn icon={<ArrowLeftRight size={15} />} label="兑换" active={panel === "swap"} onClick={() => toggle("swap")} />
      </div>

      {/* ── Deposit Panel ── */}
      {panel === "deposit" && (
        <div className="px-4 py-3 border-t border-white/5 bg-white/[0.03]">
          <div className="text-[12px] text-white/60 mb-2">接收地址</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[12px] text-white/80 bg-black/30 rounded-lg px-3 py-2 truncate font-mono">{addr}</code>
            <button onClick={copyAddr} className="shrink-0 px-3 py-2 rounded-lg bg-[#FBBF24]/20 hover:bg-[#FBBF24]/30 text-[#FBBF24] text-[12px] font-semibold transition-colors">
              {copied ? "已复制" : "复制"}
            </button>
          </div>
        </div>
      )}

      {/* ── Withdraw Panel ── */}
      {panel === "withdraw" && (
        <div className="px-4 py-3 border-t border-white/5 bg-white/[0.03] flex flex-col gap-3">
          <div className="text-[12px] font-semibold text-white/70 flex items-center gap-1.5">
            <Send size={13} /> 转账 {symbol}
          </div>
          <input
            type="text" value={toAddr} onChange={e => setToAddr(e.target.value)}
            placeholder="对方地址 0x..."
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-white/30 outline-none focus:border-[#FBBF24]/50"
          />
          <div className="flex gap-2">
            <input
              type="number" value={sendAmt} onChange={e => setSendAmt(e.target.value)}
              placeholder="金额"
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-white/30 outline-none focus:border-[#FBBF24]/50"
            />
            <button
              disabled={!toAddr.trim() || !sendAmt || sending}
              onClick={handleSend}
              className="shrink-0 px-4 py-2.5 rounded-lg bg-[#FBBF24] text-[#090012] text-[13px] font-bold disabled:opacity-30 transition-opacity"
            >
              {sending ? "提交中…" : "确认转账"}
            </button>
          </div>
        </div>
      )}

      {/* ── Swap Panel ── */}
      {panel === "swap" && (
        <div className="px-4 py-3 border-t border-white/5 bg-white/[0.03] flex flex-col gap-3">
          <div className="text-[12px] font-semibold text-white/70 flex items-center gap-1.5">
            <RefreshCw size={13} /> 兑换代币
          </div>
          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5">
            <span className="text-[13px] text-white/50">支付</span>
            <input
              type="number" value={swapAmt} onChange={e => setSwapAmt(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-[13px] text-white text-right placeholder-white/30 outline-none"
            />
            <span className="text-[13px] font-semibold text-white/80">{symbol}</span>
          </div>
          <div className="flex justify-center">
            <ArrowLeftRight size={16} className="text-white/30" />
          </div>
          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5">
            <span className="text-[13px] text-white/50">获得</span>
            <span className="flex-1 text-right text-[13px] text-white/40">选择代币</span>
          </div>
          <button
            disabled={!swapAmt || swapping}
            onClick={handleSwap}
            className="w-full py-2.5 rounded-lg bg-[#FBBF24] text-[#090012] text-[13px] font-bold disabled:opacity-30 transition-opacity"
          >
            {swapping ? "提交中…" : "确认兑换"}
          </button>
        </div>
      )}

      {/* ── Result Toast ── */}
      {toast && (
        <div className={`mx-4 mb-3 px-3 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2 ${toast.startsWith("✅") ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
          <span>{toast}</span>
          <button onClick={() => setToast("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
        active ? "bg-white/15 text-white" : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// ── Balance Empty Card ──────────────────────────────────────
function BalanceEmptyCard({ data }: { data: Extract<CardData, { type: "balance_empty" }> }) {
  return (
    <div className="my-2 rounded-xl bg-white/5 border border-white/10 p-4 text-center">
      <div className="text-[13px] text-white/50">{data.message}</div>
    </div>
  );
}

// ── Price Card ──────────────────────────────────────────────
function PriceCard({ data }: { data: Extract<CardData, { type: "price" }> }) {
  return (
    <div className="my-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {data.items.map((item, i) => {
        const changeNum = parseFloat(item.change);
        const color = isNaN(changeNum) ? "text-white/60" : changeNum > 0 ? "text-emerald-400" : "text-red-400";
        return (
          <div
            key={i}
            className={`px-4 py-3 flex items-center justify-between ${
              i < data.items.length - 1 ? "border-b border-white/5" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/80">
                {item.symbol.slice(0, 3)}
              </div>
              <span className="text-[14px] font-semibold text-white/90">{item.symbol}</span>
            </div>
            <div className="text-right">
              <div className="text-[16px] font-bold text-white">{item.price}</div>
              <div className={`text-[12px] font-medium flex items-center gap-1 justify-end ${color}`}>
                <TrendIcon change={item.change} />
                {item.change}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Signal Card ─────────────────────────────────────────────
function SignalCard({ data }: { data: Extract<CardData, { type: "signal" }> }) {
  return (
    <div className="my-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5">
        <span className="text-[12px] font-semibold text-white/60 flex items-center gap-1.5"><Activity size={13} className="text-white/50" />交易信号</span>
      </div>
      {data.items.map((item, i) => (
        <div
          key={i}
          className={`px-4 py-3 ${i < data.items.length - 1 ? "border-b border-white/5" : ""}`}
        >
          <div className="flex items-center gap-2 mb-2">
            {item.symbol && (
              <span className="text-[12px] font-semibold text-white/60 bg-white/10 px-2 py-0.5 rounded">
                {item.symbol}
              </span>
            )}
            <span className={`text-[13px] font-bold ${
              item.direction.includes("多") ? "text-emerald-400" : 
              item.direction.includes("空") ? "text-red-400" : "text-white/60"
            }`}>
              {item.direction}
            </span>
            {item.rr && (
              <span className="text-[11px] text-[#FBBF24] ml-auto">RR {item.rr}</span>
            )}
          </div>
          <div className="flex gap-4 text-[12px]">
            <span className="text-white/50">入场 <span className="text-white/80">{item.entry}</span></span>
            <span className="text-white/50">止盈 <span className="text-emerald-400/80">{item.tp}</span></span>
            <span className="text-white/50">止损 <span className="text-red-400/80">{item.sl}</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Odds Card ───────────────────────────────────────────────
function OddsCard({ data }: { data: Extract<CardData, { type: "odds" }> }) {
  return (
    <div className="my-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5">
        <span className="text-[12px] font-semibold text-white/60 flex items-center gap-1.5"><Trophy size={13} className="text-white/50" />预测市场赔率</span>
      </div>
      {data.items.map((item, i) => (
        <div
          key={i}
          className={`px-4 py-3 flex items-center justify-between ${
            i < data.items.length - 1 ? "border-b border-white/5" : ""
          }`}
        >
          <span className="text-[13px] text-white/80 flex-1 mr-3 truncate">{item.question}</span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[14px] font-bold text-[#FBBF24]">{item.yes}</span>
            <span className="text-[11px] text-white/40">{item.volume}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Account Card ────────────────────────────────────────────
function AccountCard({ data }: { data: Extract<CardData, { type: "account" }> }) {
  return (
    <div className="my-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-[13px] text-white/60">USDC.e</span>
        <span className="text-[16px] font-bold text-white">{data.usdc}</span>
      </div>
      <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
        <span className="text-[13px] text-white/60">POL</span>
        <span className="text-[14px] font-semibold text-white/80">{data.pol}</span>
      </div>
      {data.positions && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
          <span className="text-[13px] text-white/60">持仓</span>
          <span className="text-[13px] text-white/80">{data.positions}</span>
        </div>
      )}
    </div>
  );
}

// ── Scan Card ───────────────────────────────────────────────
function ScanCard({ data }: { data: Extract<CardData, { type: "scan" }> }) {
  return (
    <div className="my-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white/60 flex items-center gap-1.5"><Radio size={13} className="text-white/50" />多币扫描</span>
        <span className="text-[11px] text-white/40">{data.coins} 币种 · {data.signals} 信号</span>
      </div>
      {data.top.map((item, i) => (
        <div
          key={i}
          className={`px-4 py-2 flex items-center justify-between ${
            i < data.top.length - 1 ? "border-b border-white/5" : ""
          }`}
        >
          <span className="text-[13px] font-medium text-white/80">{item.symbol}</span>
          <span className="text-[13px] text-white/60">{item.price}</span>
          <span className="text-[12px] text-[#FBBF24]">RR {item.rr}</span>
        </div>
      ))}
    </div>
  );
}

// ── Positions Card ──────────────────────────────────────────
function PositionsCard({ data }: { data: Extract<CardData, { type: "positions" }> }) {
  return (
    <div className="my-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5">
        <span className="text-[12px] font-semibold text-white/60 flex items-center gap-1.5"><List size={13} className="text-white/50" />当前持仓</span>
      </div>
      {data.items.map((item, i) => (
        <div
          key={i}
          className={`px-4 py-3 ${i < data.items.length - 1 ? "border-b border-white/5" : ""}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-semibold text-white/80">{item.symbol}</span>
            <span className={`text-[12px] font-medium ${
              item.side === "long" ? "text-emerald-400" : "text-red-400"
            }`}>
              {item.side === "long" ? "多" : "空"} {item.size}张
            </span>
            <span className={`text-[13px] font-semibold ml-auto ${
              item.pnl.startsWith("-") ? "text-red-400" : "text-emerald-400"
            }`}>
              {item.pnl}
            </span>
          </div>
          <div className="text-[12px] text-white/40">入场 {item.entry}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main Card Renderer ──────────────────────────────────────
// ── Smart Money Card ──────────────────────────────────────
function SmartMoneyCard({ data }: { data: Extract<CardData, { type: "smart_money" }> }) {
  const whaleColors: Record<string, string> = { HIGH: "text-emerald-400", MEDIUM: "text-amber-400", LOW: "text-white/40" };
  return (
    <div className="bg-[#1A0633]/80 backdrop-blur-md border border-[#A78BFA]/30 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className="text-[#A78BFA]" />
        <span className="text-[13px] font-bold text-white/90">聪明钱信号</span>
        <span className="text-[9px] text-emerald-400/70 bg-emerald-400/5 px-1.5 py-0.5 rounded">OnchainOS 链上</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {data.signals.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/5">
            <span className="text-[12px] font-bold text-white w-20 truncate">{s.symbol}</span>
            <span className="text-[11px] text-white/50 w-16 text-right">{s.price}</span>
            <span className="text-[11px] text-white/40 w-20 truncate text-right">{s.trend}</span>
            <span className={`text-[11px] font-bold w-14 text-right ${whaleColors[s.whale] || "text-white/40"}`}>{s.whale}</span>
            <span className="text-[11px] text-white/30 w-10 text-right">{s.rr}个</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bridge Card ──────────────────────────────────────────
function BridgeCard({ data }: { data: Extract<CardData, { type: "bridge" }> }) {
  return (
    <div className="bg-[#1A0633]/80 backdrop-blur-md border border-[#38BDF8]/30 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw size={16} className="text-[#38BDF8]" />
        <span className="text-[13px] font-bold text-white/90">跨链桥</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {data.chains.slice(0, 6).map((c, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">{c.name}</span>
        ))}
        {data.chains.length > 6 && <span className="text-[10px] text-white/40">+{data.chains.length - 6}</span>}
      </div>
      <div className="flex flex-col gap-1">
        {data.protocols.slice(0, 3).map((p, i) => (
          <div key={i} className="flex justify-between text-[11px] py-1 px-2 rounded bg-white/5">
            <span className="text-white/70">{p.name}</span>
            <span className="text-white/50">费率 {p.fee}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Backtest Card ────────────────────────────────────────
function BacktestCard({ data }: { data: Extract<CardData, { type: "backtest" }> }) {
  return (
    <div className="bg-[#1A0633]/80 backdrop-blur-md border border-[#C084FC]/30 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={16} className="text-[#C084FC]" />
        <span className="text-[13px] font-bold text-white/90">回测结果</span>
      </div>
      <div className="text-[12px] text-white/60 mb-3">{data.symbol} · {data.strategy}</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 rounded-xl p-2.5 text-center">
          <div className="text-[18px] font-black text-emerald-400">{data.return_pct}</div>
          <div className="text-[10px] text-white/40">总收益</div>
        </div>
        <div className="bg-white/5 rounded-xl p-2.5 text-center">
          <div className="text-[18px] font-black text-white">{data.win_rate}</div>
          <div className="text-[10px] text-white/40">胜率</div>
        </div>
        <div className="bg-white/5 rounded-xl p-2.5 text-center">
          <div className="text-[18px] font-black text-white">{data.trades}</div>
          <div className="text-[10px] text-white/40">交易笔数</div>
        </div>
        <div className="bg-white/5 rounded-xl p-2.5 text-center">
          <div className="text-[18px] font-black text-[#C084FC]">{data.sharpe}</div>
          <div className="text-[10px] text-white/40">夏普比率</div>
        </div>
      </div>
    </div>
  );
}

// ── Gas Card ─────────────────────────────────────────────
function GasCard({ data }: { data: Extract<CardData, { type: "gas" }> }) {
  return (
    <div className="bg-[#1A0633]/80 backdrop-blur-md border border-[#34D399]/30 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={16} className="text-[#34D399]" />
        <span className="text-[13px] font-bold text-white/90">免Gas转账</span>
      </div>
      <p className="text-[11px] text-white/50 mb-3">{data.note}</p>
      <div className="flex flex-wrap gap-1.5">
        {data.chains.map((c, i) => (
          <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20">
            {c.chain}: {c.coins}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Strategies Card ──────────────────────────────────────
function StrategiesCard({ data }: { data: Extract<CardData, { type: "strategies" }> }) {
  return (
    <div className="bg-[#1A0633]/80 backdrop-blur-md border border-[#C084FC]/30 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <List size={16} className="text-[#C084FC]" />
        <span className="text-[13px] font-bold text-white/90">量化策略</span>
      </div>
      <div className="flex flex-col gap-2">
        {data.items.map((s, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-3">
            <div className="text-[13px] font-bold text-white mb-0.5">{s.name}</div>
            <div className="text-[11px] text-white/50">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Zap = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default function ResponseCard({ data }: { data: CardData }) {
  switch (data.type) {
    case "balance":
      return <BalanceCard data={data} />;
    case "balance_empty":
      return <BalanceEmptyCard data={data} />;
    case "price":
      return <PriceCard data={data} />;
    case "signal":
      return <SignalCard data={data} />;
    case "odds":
      return <OddsCard data={data} />;
    case "account":
      return <AccountCard data={data} />;
    case "scan":
      return <ScanCard data={data} />;
    case "positions":
      return <PositionsCard data={data} />;
    case "smart_money":
      return <SmartMoneyCard data={data} />;
    case "bridge":
      return <BridgeCard data={data} />;
    case "backtest":
      return <BacktestCard data={data} />;
    case "gas":
      return <GasCard data={data} />;
    case "strategies":
      return <StrategiesCard data={data} />;
    default:
      return null;
  }
}
