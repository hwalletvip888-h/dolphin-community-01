"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, ChevronRight, MessageSquare, Send, LayoutGrid, Users,
  Plus, Zap, Sparkles, Brain,
  Edit3, Crown, Coins, History, BarChart2, Bell, Search, X,
  Wallet, Copy, DollarSign, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ResponseCard, { type CardData } from "@/components/ResponseCard";

// Preserved original local asset imports
const BabyDolphinImg = "/agents/agent-dolphin.jpg";
const OnChainHunterImg = "/agents/agent-onchain.jpg";
const ZhuGeImg = "/agents/agent-zhuge.jpg";
const BgImg = "/agents/agent-wealth.jpg"; // 稳盈管家
const LuckyStarImg = "/agents/agent-reward.jpg"; // 派奖福星
const MainAgentImg = "/agents/agent-worldcup.jpg"; // AI预言帝
const ImpactBgImg = "/images/impact-bg.png";

type AgentId = "worldcup" | "dolphin" | "onchain" | "zhuge" | "wealth" | "reward";
type ChatTab = "chat" | "community";
type OnchainTab = "chat" | "positions" | "simtrade" | "signals";
type AIModel = "H 1.6 Lite" | "H1.6" | "H1.6 Max";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  cards?: CardData[];
}

const AGENTS = [
  {
    id: "worldcup",
    name: "AI预言帝",
    title: "预测市场",
    quote: "赔率我都看透了",
    desc: "专注 Polymarket 预测市场，赔率分析+下单+持仓管理全覆盖，世界杯知识库信手拈来",
    skills: ["赔率分析", "预测下单", "账户管理", "世界杯百科"],
    colors: {
      hex: "#FBBF24",
      gradient: "from-[#FBBF24] to-[#D97706]", 
      glow: "shadow-[0_0_40px_rgba(251,191,36,0.4)]",
    },
    img: MainAgentImg,
    welcome: "世界杯我早看穿了！Polymarket 链上赔率实时追踪，预测下单、账户管理一站式。想看赔率还是直接下场？⚽",
    quickQuestions: ["🏆 夺冠赔率排行", "📋 查看我的持仓", "💰 如何充值下单", "🔍 搜索预测市场"]
  },

  {
    id: "dolphin",
    name: "小海豚",
    title: "新手引导",
    quote: "别怕，我带你玩",
    desc: "阳光温暖，像邻家姐姐一样耐心，把复杂的东西拆成一步步",
    skills: ["新手教程", "平台指南", "竞猜教学", "操作指引"],
    colors: {
      hex: "#38BDF8",
      gradient: "from-[#38BDF8] to-[#2563EB]",
      glow: "shadow-[0_0_40px_rgba(56,189,248,0.4)]",
    },
    img: BabyDolphinImg,
    welcome: "嗨！我是小海豚 🐬 别怕，我带你玩。简单易懂，只需一句话，其他交给我。平台规则，链上赚币，合约策略，盈亏分析，都可以来告诉我~",
    quickQuestions: ["社区介绍", "新手指南", "设置中心", "生活助手"]
  },
  {
    id: "onchain",
    name: "链上猎手",
    title: "全链侦察",
    quote: "链上没有我不知道的",
    desc: "Onchain OS 全能侦察兵。钱包查询、聪明钱追踪、Meme扫链、安全检测，只负责链上数据",
    skills: ["钱包查询", "聪明钱追踪", "DEX Swap", "安全检测"],
    colors: {
      hex: "#A78BFA",
      gradient: "from-[#A78BFA] to-[#7C3AED]", 
      glow: "shadow-[0_0_40px_rgba(167,139,250,0.4)]",
    },
    img: OnChainHunterImg,
    welcome: "全链侦察就位。钱包查询、聪明钱追踪、Meme扫链、跨链桥、安全检测 — 链上没有我不知道的。说吧，查什么？🔍",
    quickQuestions: ["💰 查询余额", "🔍 搜索代币", "🐋 聪明钱信号", "🛡️ 安全检测"]
  },

  {
    id: "zhuge",
    name: "诸葛策略",
    title: "合约军师",
    quote: "运筹帷幄，弹无虚发",
    desc: "OKX合约策略师。HURST趋势+布林带+Pivot三策略共振，关键指标一目了然，每步都有数据支撑",
    skills: ["BTC/ETH/SOL分析", "HURST趋势", "多币信号", "VBT回测"],
    colors: {
      hex: "#C084FC",
      gradient: "from-[#C084FC] to-[#7E22CE]", 
      glow: "shadow-[0_0_40px_rgba(192,132,252,0.4)]",
    },
    img: ZhuGeImg,
    welcome: "运筹帷幄，弹无虚发。BTC/ETH/SOL 三大主力合约深度分析，HURST趋势+布林带+Pivot三策略共振。说出币种，我给你作战计划。📊",
    quickQuestions: ["📊 BTC 深度分析", "🔍 多币信号扫描", "📋 当前持仓", "📈 策略回测"]
  },

  {
    id: "wealth",
    name: "稳盈管家",
    title: "收益护航",
    quote: "睡得着才是好投资",
    desc: "保守稳重的老管家，不求暴富只求安稳，每一分钱都算得明明白白",
    skills: ["稳定币理财", "蓝筹定投", "DeFi 收益", "低风险策略"],
    colors: {
      hex: "#34D399",
      gradient: "from-[#34D399] to-[#0D9488]", 
      glow: "shadow-[0_0_40px_rgba(52,211,153,0.4)]",
    },
    img: BgImg,
    welcome: "睡得着才是好投资。稳定币理财、蓝筹定投、DeFi 收益、低风险策略——每一分钱都算得明明白白。",
    quickQuestions: ["🛡️ 稳定币收益排行", "💎 蓝筹定投计划", "📊 低风险组合", "🏦 DeFi收益对比"]
  },
  {
    id: "reward",
    name: "派奖福星",
    title: "好运派奖",
    quote: "你的运气我承包了",
    desc: "喜庆热闹的气氛组，像过年塞红包的长辈，热情又大方",
    skills: ["活动奖励", "竞赛排行", "空投领取", "邀请返佣"],
    colors: {
      hex: "#FB923C",
      gradient: "from-[#FB923C] to-[#EC4899]",
      glow: "shadow-[0_0_40px_rgba(251,146,60,0.4)]",
    },
    img: LuckyStarImg,
    welcome: "你的运气我承包了！活动奖励、竞赛排行、空投领取、邀请返佣——哪里有奖哪里就有我，好运不断！🎁",
    quickQuestions: ["🎁 最新活动", "🏅 我的排名", "💸 领取空投", "👥 邀请好友"]
  }
];

const MODELS = [
  { id: "H 1.6 Lite", icon: Zap, desc: "极速响应，日常对话" },
  { id: "H1.6", icon: Sparkles, desc: "平衡模式，最佳体验" },
  { id: "H1.6 Max", icon: Brain, desc: "深度推理，复杂逻辑" }
] as const;

// ── Auth helpers ──────────────────────────────────────────
function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("dolphin_token") || "";
}
function getUserId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("dolphin_user_id") || "";
}
function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } : { "Content-Type": "application/json" };
}

// ── SimTrade Panel ──────────────────────────────────────
function SimTradePanel() {
  const [data, setData] = useState<{ portfolio?: { equityUsd: number; totalPnlPct: number; realizedPnlUsd: number; openValueUsd: number; cashUsd: number }; openPositions?: Array<{ symbol: string; chain: string; costUsd: number; valueUsd: number; pnlPct: string }>; closedPositions?: Array<{ symbol: string; chain: string; pnlUsd: number }>; updatedAt?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/simtrade").then(r => r.json()).then(d => {
      if (d.ok) setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center text-white/30 text-[13px]">加载模拟数据...</div>;
  if (!data?.portfolio) return (
    <div className="flex-1 overflow-y-auto px-4 pt-8 pb-2 no-scrollbar">
      <div className="bg-[#1A1230]/60 rounded-2xl border border-[#A78BFA]/20 p-6 text-center">
        <Zap className="w-8 h-8 text-[#A78BFA]/40 mx-auto mb-3" />
        <p className="text-[13px] text-white/40">模拟交易数据待更新</p>
        <a href="https://hwalletvip888-h.github.io/codex/" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#A78BFA] mt-2 inline-block">查看完整看板 →</a>
      </div>
    </div>
  );

  const p = data.portfolio;
  const isProfit = p.totalPnlPct >= 0;
  const timeAgo = data.updatedAt ? Math.floor((Date.now() - new Date(data.updatedAt).getTime()) / 60000) : 0;

  return (
    <motion.div key="simtrade-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto px-4 pt-4 pb-2 no-scrollbar"
    >
      {/* Portfolio Summary */}
      <div className={`rounded-2xl p-4 mb-4 ${isProfit ? 'bg-[#34D399]/10 border border-[#34D399]/20' : 'bg-[#FB923C]/10 border border-[#FB923C]/20'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-white/50">模拟盘总权益</span>
          <span className="text-[11px] text-white/30">{timeAgo > 0 ? `${timeAgo}分前更新` : '刚刚更新'}</span>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[32px] font-black text-white">${p.equityUsd.toFixed(2)}</span>
          <span className={`text-[16px] font-bold ${isProfit ? 'text-[#34D399]' : 'text-[#FB923C]'}`}>
            {isProfit ? '+' : ''}{p.totalPnlPct.toFixed(1)}%
          </span>
        </div>
        <div className="flex gap-4 text-[12px] text-white/50">
          <span>已实现: <span className={p.realizedPnlUsd >= 0 ? 'text-[#34D399]' : 'text-[#FB923C]'}>${p.realizedPnlUsd.toFixed(0)}</span></span>
          <span>持仓: ${p.openValueUsd.toFixed(0)}</span>
          <span>现金: ${p.cashUsd.toFixed(0)}</span>
        </div>
      </div>

      {/* Open Positions */}
      {data.openPositions && data.openPositions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[13px] font-bold text-white/80 mb-2">当前持仓 ({data.openPositions.length})</h4>
          <div className="space-y-2">
            {data.openPositions.map((pos, i) => (
              <div key={i} className="bg-[#1A1230]/60 rounded-xl p-3 border border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[14px] font-bold text-white">{pos.symbol}</span>
                    <span className="text-[11px] text-white/40 ml-2">{pos.chain}</span>
                  </div>
                  <span className={`text-[13px] font-bold ${Number(pos.pnlPct) >= 0 ? 'text-[#34D399]' : 'text-[#FB923C]'}`}>
                    {Number(pos.pnlPct) >= 0 ? '+' : ''}{pos.pnlPct}%
                  </span>
                </div>
                <div className="flex justify-between text-[12px] text-white/40 mt-1">
                  <span>成本 ${pos.costUsd.toFixed(0)}</span>
                  <span>现值 ${pos.valueUsd.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Closed */}
      {data.closedPositions && data.closedPositions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[13px] font-bold text-white/80 mb-2">已平仓 ({data.closedPositions.length})</h4>
          <div className="space-y-1">
            {data.closedPositions.slice(0, 5).map((pos, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-white/[0.02]">
                <div>
                  <span className="text-[13px] text-white/80">{pos.symbol}</span>
                  <span className="text-[11px] text-white/30 ml-2">{pos.chain}</span>
                </div>
                <span className={`text-[13px] font-bold ${Number(pos.pnlUsd) >= 0 ? 'text-[#34D399]' : 'text-[#FB923C]'}`}>
                  {Number(pos.pnlUsd) >= 0 ? '+' : ''}${Number(pos.pnlUsd).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <a href="https://hwalletvip888-h.github.io/codex/" target="_blank" rel="noopener noreferrer"
        className="block text-center py-2.5 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/20 text-[12px] font-bold text-[#A78BFA] hover:bg-[#A78BFA]/20 transition-colors">
        查看完整模拟交易看板 →
      </a>
    </motion.div>
  );
}

export default function App() {
  const [route, setRoute] = useState<"selector" | "chat">("selector");
  const [activeAgentId, setActiveAgentId] = useState<AgentId>("worldcup");
  const [chatTab, setChatTab] = useState<ChatTab>("chat");
  const [onchainTab, setOnchainTab] = useState<OnchainTab>("chat");
  
  // Selector State
  const [activeIndex, setActiveIndex] = useState(0);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Feature States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>("H1.6");
  const [nickname, setNickname] = useState("Web3_Explorer");
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  // Conversation history
  const [conversations, setConversations] = useState<{ id: string; agent_id: string; updated_at: string }[]>([]);

  // Wallet asset state
  const [walletTotal, setWalletTotal] = useState<number | null>(null);
  const [walletTokens, setWalletTokens] = useState<{ symbol: string; chain: string; amount: string; usd: string }[]>([]);
  const [walletEmail, setWalletEmail] = useState("");
  const [walletLoggedIn, setWalletLoggedIn] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState("");

  // Modal states for direct operations (no AI)
  const [activeModal, setActiveModal] = useState<"deposit" | "withdraw" | "swap" | "connect" | null>(null);
  const [depositAddresses, setDepositAddresses] = useState<{ chain: string; address: string }[]>([]);
  // Swap form
  const [swapFrom, setSwapFrom] = useState("USDT");
  const [swapTo, setSwapTo] = useState("ETH");
  const [swapAmount, setSwapAmount] = useState("");
  // Withdraw form
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawToken, setWithdrawToken] = useState("USD₮0");
  const [withdrawChain, setWithdrawChain] = useState(196);
  // Operation status
  const [opLoading, setOpLoading] = useState(false);
  const [opResult, setOpResult] = useState("");

  // Signal page state
  const [signals, setSignals] = useState<{
    symbol: string; name: string; logo: string; price: string; mc: string; volume: string;
    whale: string; action: string; time: string; sparkline: number[];
  }[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);

  const fetchSignals = async () => {
    setSignalsLoading(true);
    try {
      const res = await fetch("/api/signals");
      const data = await res.json();
      setSignals(data.signals || []);
    } catch { /* */ }
    setSignalsLoading(false);
  };

  useEffect(() => { if (onchainTab === "signals") fetchSignals(); }, [onchainTab]);

  // Transaction history
  const [txHistory, setTxHistory] = useState<{ time: string; direction: string; amount: string; symbol: string; hash: string; status: string }[]>([]);
  const fetchTxHistory = async () => {
    try {
      const res = await fetch("/api/wallet", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ action: "history", limit: 10 }),
      });
      const data = await res.json();
      const txs: typeof txHistory = [];
      if (data?.ok) {
        for (const block of (data.history?.data || [])) {
          for (const tx of (block.orderList || [])) {
            txs.push({
              time: new Date(Number(tx.txTime || 0)).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }),
              direction: tx.direction === "IN" ? "转入" : "转出",
              amount: (Number(tx.coinAmount || 0) / 1e6).toFixed(4),
              symbol: tx.coinSymbol || "?",
              hash: tx.txHash || "",
              status: tx.txStatus === "SUCCESS" ? "成功" : tx.txStatus || "?",
            });
          }
        }
      }
      setTxHistory(txs);
    } catch { /* */ }
  };
  useEffect(() => { if (isSidebarOpen && walletLoggedIn) fetchTxHistory(); }, [isSidebarOpen]);

  const activeAgent = AGENTS.find(a => a.id === activeAgentId) || AGENTS[0];

  useEffect(() => {
    if (route === "chat") {
      const urlParams = new URLSearchParams(window.location.search);
      const agentParam = urlParams.get('agent');
      if (agentParam) {
        const id = agentParam.replace('agent-', '') as AgentId;
        const index = AGENTS.findIndex(a => a.id === id);
        if (index !== -1) {
          setActiveAgentId(id);
          setActiveIndex(index);
        }
      }
    }
  }, [route]);

  useEffect(() => {
    if (messagesEndRef.current && chatTab === "chat") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, chatTab]);

  // --- Selector Logic ---
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 40;
    if (info.offset.x < -swipeThreshold && activeIndex < AGENTS.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else if (info.offset.x > swipeThreshold && activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  const handleStartChat = (id: AgentId) => {
    setActiveAgentId(id);
    setMessages([]);
    setConversationId("");
    setChatTab("chat");
    setOnchainTab("chat");
    setRoute("chat");
    window.history.pushState({}, '', `/app?agent=agent-${id}`);
  };

  // --- Chat Logic (streaming SSE) ---
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsgId = Date.now().toString();
    const agentMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: userMsgId, role: "user", content: text.trim() }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          message: text.trim(),
          agent: activeAgentId,
          conversationId: conversationId || undefined,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) throw new Error("No stream");

      // Add empty agent message placeholder
      setMessages(prev => [...prev, { id: agentMsgId, role: "agent", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.cards) {
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, cards: parsed.cards } : m
              ));
            }
            if (parsed.token) {
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, content: m.content + parsed.token } : m
              ));
            }
            if (parsed.done) {
              if (parsed.conversationId && !conversationId) {
                setConversationId(parsed.conversationId);
              }
              // Finalize — remove placeholder if empty
              setMessages(prev => {
                const final = prev.find(m => m.id === agentMsgId);
                if (final && !final.content.trim()) {
                  return prev.filter(m => m.id !== agentMsgId);
                }
                return prev;
              });
            }
            if (parsed.error) {
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, content: "抱歉，出了点问题，请再试一次。" } : m
              ));
            }
          } catch { /* skip unparseable */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { id: agentMsgId, role: "agent", content: `${activeAgent.name}就绪。收到：「${text.trim()}」。` }]);
    }
    setIsTyping(false);
  };

  // --- Conversation History ---
  const loadConversations = async () => {
    try {
      const r = await fetch("/api/chat", { headers: authHeaders() });
      const d = await r.json();
      setConversations(d.conversations || []);
    } catch { /* silent */ }
  };

  const switchConversation = async (convId: string, agentId: string) => {
    setIsSidebarOpen(false);
    setConversationId(convId);
    setActiveAgentId(agentId as AgentId);
    setChatTab("chat");
    setRoute("chat");
    try {
      const r = await fetch(`/api/chat?id=${convId}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.messages) {
        setMessages(d.messages.map((m: { role: string; content: string }, i: number) => ({
          id: `${convId}-${i}`,
          role: m.role as "user" | "agent",
          content: m.content,
        })));
      }
    } catch { /* silent */ }
  };

  const CHAIN_NAMES: Record<number, string> = {
    1: "Ethereum", 10: "Optimism", 56: "BSC", 137: "Polygon",
    196: "X Layer", 324: "zkSync", 8453: "Base", 42161: "Arbitrum",
    43114: "Avalanche", 501: "Solana", 250: "Fantom", 100: "Gnosis",
  };

  const [walletLoading, setWalletLoading] = useState(true);
  const [connectEmail, setConnectEmail] = useState("");
  const [connectCode, setConnectCode] = useState("");
  const [connectSending, setConnectSending] = useState(false);
  const [connectVerifying, setConnectVerifying] = useState(false);
  const [connectMsg, setConnectMsg] = useState("");
  const fetchWallet = async () => {
    try {
      const [statusRes, balanceRes] = await Promise.all([
        fetch("/api/wallet", { method: "POST", headers: authHeaders(), body: JSON.stringify({ action: "status" }) }),
        fetch("/api/wallet", { method: "POST", headers: authHeaders(), body: JSON.stringify({ action: "balance" }) }),
      ]);
      // Check HTTP status before parsing JSON
      if (!statusRes.ok) {
        console.warn("[fetchWallet] status HTTP", statusRes.status);
        setWalletLoggedIn(false);
        setWalletLoading(false);
        return;
      }
      const status = await statusRes.json();
      const balance = await balanceRes.json();

      if (status?.detail) {
        const ds = typeof status.detail === "string" ? status.detail : JSON.stringify(status.detail);
        const loggedIn = ds.match(/"loggedIn"\s*:\s*(true|false)/)?.[1] === "true";
        const email = ds.match(/"email"\s*:\s*"([^"]*)"/)?.[1] || "";
        setWalletLoggedIn(loggedIn);
        setWalletEmail(email);

        if (loggedIn && balance?.balance) {
          const bd = balance.balance?.data || balance.balance;
          const details = bd?.details || [];
          let total = 0;
          const tokens: { symbol: string; chain: string; amount: string; usd: string }[] = [];
          for (const d of details) {
            for (const t of (d?.tokenAssets || [])) {
              const ci = Number(t.chainIndex || 0);
              total += Number(t.usdValue || 0);
              tokens.push({
                symbol: t.symbol || "?",
                chain: CHAIN_NAMES[ci] || `Chain ${ci}`,
                amount: String(t.balance || "0"),
                usd: `$${Number(t.usdValue || 0).toFixed(2)}`,
              });
            }
          }
          setWalletTotal(total);
          setWalletTokens(tokens);
        } else if (!loggedIn) {
          // Clear stale wallet state if not logged in
          setWalletTotal(null);
          setWalletTokens([]);
        }
      } else {
        // No detail field — MCP may have returned an error
        console.warn("[fetchWallet] no detail in status:", JSON.stringify(status).slice(0, 200));
        setWalletLoggedIn(false);
        setWalletTotal(null);
        setWalletTokens([]);
      }
    } catch (e) {
      console.error("[fetchWallet] error:", e);
      setWalletLoggedIn(false);
      setWalletTotal(null);
      setWalletTokens([]);
    }
    setWalletLoading(false);
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "addresses" }),
      });
      const data = await res.json();
      const addrs: { chain: string; address: string }[] = [];
      if (data?.addresses) {
        try {
          const parsed = typeof data.addresses === "string" ? JSON.parse(data.addresses) : data.addresses;
          if (Array.isArray(parsed)) {
            parsed.forEach((a: any) => {
              if (typeof a === "string") addrs.push({ chain: "Address", address: a });
              else addrs.push({ chain: a.chain || "Address", address: a.address || a });
            });
          }
        } catch { addrs.push({ chain: "Address", address: String(data.addresses) }); }
      }
      setDepositAddresses(addrs);
    } catch { /* */ }
  };

  const handleSwap = async () => {
    if (!swapAmount) return;
    setOpLoading(true); setOpResult("");
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "swap", fromToken: swapFrom, toToken: swapTo, amount: swapAmount, chainIndex: 196 }),
      });
      const data = await res.json();
      setOpResult(data?.txHash ? `兑换成功! TX: ${data.txHash.slice(0, 20)}...` : (data?.detail || data?.error || "兑换失败"));
    } catch { setOpResult("网络错误"); }
    setOpLoading(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawTo || !withdrawAmount) return;
    setOpLoading(true); setOpResult("");
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "send", to: withdrawTo, amount: withdrawAmount, tokenSymbol: withdrawToken, chainIndex: withdrawChain }),
      });
      const data = await res.json();
      setOpResult(data?.txHash ? `提币成功! TX: ${data.txHash.slice(0, 20)}...` : (data?.detail || data?.message || "提币失败"));
    } catch { setOpResult("网络错误"); }
    setOpLoading(false);
  };

  // Fetch wallet on mount & periodically
  useEffect(() => { fetchWallet(); fetchAddresses(); }, []);
  useEffect(() => { if (isSidebarOpen) { loadConversations(); fetchWallet(); fetchAddresses(); } }, [isSidebarOpen]);
  // Poll wallet status every 30s
  useEffect(() => { const t = setInterval(fetchWallet, 30000); return () => clearInterval(t); }, []);

  const requireLogin = (action: string) => {
    if (!walletLoggedIn) {
      setActiveModal("connect");
      return false;
    }
    return true;
  };

  const handleConnectSendCode = async () => {
    if (!connectEmail || connectSending) return;
    setConnectSending(true); setConnectMsg("");
    try {
      const r = await fetch("/api/wallet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: connectEmail }),
      });
      const d = await r.json();
      if (d.ok) {
        setConnectMsg("验证码已发送");
        if (d.user_id) localStorage.setItem("dolphin_user_id", d.user_id);
      } else {
        setConnectMsg(d.message || "发送失败");
      }
    } catch { setConnectMsg("网络错误"); }
    setConnectSending(false);
  };

  const handleConnectVerify = async () => {
    if (!connectCode || connectVerifying) return;
    setConnectVerifying(true); setConnectMsg("");
    const uid = localStorage.getItem("dolphin_user_id") || "";
    try {
      const r = await fetch("/api/wallet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: connectCode, email: connectEmail, user_id: uid }),
      });
      const d = await r.json();
      if (d.ok) {
        if (d.token) localStorage.setItem("dolphin_token", d.token);
        if (d.user_id) localStorage.setItem("dolphin_user_id", d.user_id);
        setConnectMsg("钱包已连接！");
        setTimeout(() => { setActiveModal(null); setWalletLoading(true); fetchWallet(); }, 800);
      } else {
        setConnectMsg(d.message || "验证失败");
      }
    } catch { setConnectMsg("网络错误"); }
    setConnectVerifying(false);
  };

  // ── Safe rich-text renderer (no dangerouslySetInnerHTML) ──
  function RichText({ text }: { text: string }) {
    const segments = text.split(/(\*\*.*?\*\*)/);
    return (
      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
        {segments.map((seg, i) => {
          if (seg.startsWith("**") && seg.endsWith("**")) {
            return <strong key={i}>{seg.slice(2, -2)}</strong>;
          }
          return <span key={i}>{seg}</span>;
        })}
      </p>
    );
  }

  // ==========================================
  // RENDER: Chat View

  // ==========================================
  if (route === "chat") {
    return (
      <div className="min-h-screen bg-[#090012] text-[#FFF5D9] flex flex-col items-center overflow-hidden relative font-sans">
        
        {/* Base Background Image */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${ImpactBgImg})` }}
        />
        
        {/* Dynamic Agent Theme Tint applied to the whole background */}
        <div 
          className="fixed inset-0 z-0 pointer-events-none mix-blend-screen transition-colors duration-700"
          style={{ backgroundColor: activeAgent.colors.hex, opacity: 0.08 }} 
        />
        <div className="fixed inset-0 bg-[#090012]/80 z-0 pointer-events-none" />
        
        {/* Top Glow mapped to Agent Color */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[200px] blur-[80px] z-0 pointer-events-none transition-all duration-700"
          style={{ background: `radial-gradient(circle, ${activeAgent.colors.hex} 0%, transparent 70%)` }}
        />

        <div className="w-full max-w-[480px] mx-auto h-dvh flex flex-col relative z-10 shadow-2xl bg-[#090012]/30 backdrop-blur-md">
          
          {/* Header */}
          <div 
            className="flex justify-between items-center w-full px-4 py-2 h-[68px] shrink-0 backdrop-blur-2xl z-20 border-b transition-colors duration-500"
            style={{ 
              backgroundColor: `${activeAgent.colors.hex}08`,
              borderColor: `${activeAgent.colors.hex}25` 
            }}
          >
            {/* Left: Balance + Sidebar */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/30 hover:bg-black/50 border transition-all shadow-inner"
                style={{ borderColor: `${activeAgent.colors.hex}40` }}
              >
                <LayoutGrid className="w-[16px] h-[16px]" style={{ color: activeAgent.colors.hex }} />
                {walletTotal !== null && (
                  <span className="text-[11px] font-bold text-white/80">
                    ${walletTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                )}
              </button>
            </div>
            
            {/* Center: Tabs */}
            <div
              className="flex items-center bg-black/40 p-1 rounded-full border shadow-inner"
              style={{ borderColor: `${activeAgent.colors.hex}30` }}
            >
              <button
                onClick={() => { setChatTab("chat"); setOnchainTab("chat"); }}
                className={`px-6 py-1.5 rounded-full text-[13px] font-bold transition-all ${chatTab === 'chat' ? 'text-[#090012] shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white'}`}
                style={chatTab === 'chat' ? { background: `linear-gradient(135deg, ${activeAgent.colors.hex}, ${activeAgent.colors.hex}cc)` } : {}}
              >
                对话
              </button>
              <button
                onClick={() => setChatTab("community")}
                className={`px-6 py-1.5 rounded-full text-[13px] font-bold transition-all ${chatTab === 'community' ? 'text-[#090012] shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white'}`}
                style={chatTab === 'community' ? { background: `linear-gradient(135deg, ${activeAgent.colors.hex}, ${activeAgent.colors.hex}cc)` } : {}}
              >
                社区
              </button>
            </div>

            {/* Right: AI Avatar -> Switch Agent */}
            <div className="relative">
              <button 
                onClick={() => setShowAgentMenu(!showAgentMenu)}
                className="relative w-[42px] h-[42px] rounded-full p-[2px] shadow-lg shrink-0 cursor-pointer hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(135deg, ${activeAgent.colors.hex}, transparent)` }}
                title="Switch Agent"
              >
                <img src={activeAgent.img} className="w-full h-full rounded-full border-[2px] border-[#090012] object-cover" alt={activeAgent.name} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#10B981] rounded-full border-[2px] border-[#090012] flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-full h-full rounded-full bg-[#10B981] opacity-50"
                  />
                </div>
              </button>

              <AnimatePresence>
                {showAgentMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAgentMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-[52px] right-0 w-[220px] bg-[#1A0633]/95 backdrop-blur-xl border border-[#8A3FFC]/40 rounded-[20px] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-1"
                    >
                      <div className="text-[11px] text-white/40 px-3 py-1.5 font-bold uppercase tracking-wider">切换专属 Agent</div>
                      {AGENTS.map((agent) => {
                        const isSelected = activeAgentId === agent.id;
                        return (
                          <button
                            key={agent.id}
                            onClick={() => {
                              handleStartChat(agent.id as AgentId);
                              setShowAgentMenu(false);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-[12px] transition-all text-left ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            style={isSelected ? { backgroundColor: `${agent.colors.hex}20`, border: `1px solid ${agent.colors.hex}50` } : { border: '1px solid transparent' }}
                          >
                            <div className="w-8 h-8 rounded-full p-[1px] shrink-0" style={{ background: `linear-gradient(135deg, ${agent.colors.hex}, transparent)` }}>
                              <img src={agent.img} className="w-full h-full rounded-full border border-[#090012] object-cover" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className={`text-[13px] font-bold truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>{agent.name}</span>
                              <span className="text-[10px] truncate" style={{ color: agent.colors.hex }}>{agent.title}</span>
                            </div>
                          </button>
                        )
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Login Banner */}
          {!walletLoggedIn && !walletLoading && (
            <div className="mx-4 mt-2 px-4 py-2.5 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/30 flex items-center justify-between">
              <span className="text-[12px] text-[#FBBF24] font-bold">钱包未连接 — 无法使用链上功能</span>
              <button onClick={() => setActiveModal("connect")} className="text-[12px] font-bold text-[#090012] bg-[#FBBF24] px-3 py-1 rounded-full hover:bg-[#FDE047] transition-colors">
                连接钱包
              </button>
            </div>
          )}

          {/* Onchain sub-tabs — inside chat content */}
          {activeAgentId === "onchain" && chatTab === "chat" && (
            <div className="flex items-center gap-1 px-4 pt-3 pb-0">
              {(["chat", "positions", "simtrade", "signals"] as OnchainTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setOnchainTab(tab); if (tab === "signals") fetchSignals(); }}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                    onchainTab === tab ? 'text-[#090012]' : 'text-white/50 hover:text-white/80'
                  }`}
                  style={onchainTab === tab ? { background: `linear-gradient(135deg, ${activeAgent.colors.hex}, ${activeAgent.colors.hex}cc)` } : {}}
                >
                  {tab === "chat" ? "链上猎手" : tab === "positions" ? "当前持仓" : tab === "simtrade" ? "模拟交易" : "信号"}
                </button>
              ))}
            </div>
          )}

          {/* Content Area */}
          <div className={`flex-1 overflow-y-auto px-4 flex flex-col relative no-scrollbar ${activeAgentId === "onchain" && chatTab === "chat" ? "pt-2" : "py-5"}`}>
            
            <AnimatePresence mode="popLayout">
              {activeAgentId === "onchain" && onchainTab === "simtrade" ? (
                /* --- SimTrade Tab --- */
                <SimTradePanel />
              ) : activeAgentId === "onchain" && onchainTab === "signals" ? (
                /* --- Signals Tab --- */
                <motion.div
                  key="signals-tab"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 overflow-y-auto px-4 pt-4 pb-2 no-scrollbar"
                >

                  {signalsLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
                    </div>
                  ) : (
                    <>
                      {/* Section A: Trading Signals — horizontal scroll */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[15px] font-bold text-white/90">信号</span>
                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </div>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                          {signals.slice(0, 8).map((s, i) => (
                            <div
                              key={i}
                              className="shrink-0 w-[100px] rounded-2xl bg-[#1A1230] border p-3 flex flex-col items-center gap-2"
                              style={{ borderColor: s.action.includes("卖") ? '#ef444420' : '#22c55e20' }}
                            >
                              {s.logo ? (
                                <img src={s.logo} alt={s.symbol} className="w-[56px] h-[56px] rounded-xl object-cover" />
                              ) : (
                                <div className="w-[56px] h-[56px] rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/60">
                                  {s.symbol.slice(0, 4)}
                                </div>
                              )}
                              <span className="text-[11px] font-bold text-white text-center truncate w-full">{s.symbol}</span>
                              <span className={`text-[10px] font-bold ${s.action.includes("卖") ? "text-red-400" : "text-emerald-400"}`}>
                                {s.whale}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section C: Scanning Signals — vertical list */}
                      <div className="mb-4">
                        <span className="text-[15px] font-bold text-white/90 block mb-3">信号列表</span>
                        <div className="flex flex-col gap-2">
                          {signals.map((s, i) => (
                            <div key={i} className="bg-[#1A1230]/80 rounded-2xl p-3.5 border border-white/5">
                              {/* Row 1: Logo + Name + Sparkline */}
                              <div className="flex items-center gap-3 mb-2">
                                {s.logo ? (
                                  <img src={s.logo} alt={s.symbol} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/50 shrink-0">
                                    {s.symbol.slice(0, 3)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-[14px] font-bold text-white truncate">{s.symbol}</div>
                                  <div className="text-[11px] text-white/40">{s.name}</div>
                                </div>
                                <div className="w-[80px] h-[28px]">
                                  <svg viewBox="0 0 80 28" className="w-full h-full">
                                    <polyline
                                      points={s.sparkline.map((v: number, j: number) => `${j*4},${28-(v/Math.max(...s.sparkline))*24}`).join(' ')}
                                      fill="none"
                                      stroke={s.action.includes("卖") ? "#ef4444" : "#22c55e"}
                                      strokeWidth="1.5"
                                    />
                                  </svg>
                                </div>
                              </div>
                              {/* Row 2: Tags */}
                              <div className="flex items-center gap-2 mb-2.5">
                                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{s.time}</span>
                                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">{s.whale}</span>
                                <span className={`text-[10px] font-bold ${s.action.includes("卖") ? "text-red-400" : "text-emerald-400"}`}>{s.action}</span>
                              </div>
                              {/* Row 3: Metrics */}
                              <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-lg">市值 {s.mc}</span>
                                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-lg">成交 {s.volume}</span>
                                </div>
                                {/* Row 4: Action button */}
                                <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                  <Zap className="w-4 h-4 text-[#090012]" fill="currentColor" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : chatTab === "community" ? (
                /* --- Community Tab --- */
                <motion.div
                  key="community-tab"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-6 mt-[-40px]"
                >
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-full mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3)] border border-white/10"
                    style={{ backgroundColor: `${activeAgent.colors.hex}20` }}
                  >
                    <Users className="w-10 h-10" style={{ color: activeAgent.colors.hex }} />
                  </motion.div>
                  <h3 className="text-[20px] font-black text-white mb-3 tracking-wider">
                    【{activeAgent.name}】专属社区
                  </h3>
                  <div 
                    className="px-4 py-1.5 rounded-full border mb-6 text-[11px] font-bold"
                    style={{ borderColor: `${activeAgent.colors.hex}50`, color: activeAgent.colors.hex, backgroundColor: `${activeAgent.colors.hex}10` }}
                  >
                    正在紧急建设中
                  </div>
                  <p className="text-[14px] text-white/60 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5">
                    这里是汇聚所有同道中人的加密阵地。<br/>
                    赛事讨论、策略分享、聪明钱追踪等<br/>高能内容即将上线，敬请期待！
                  </p>
                </motion.div>

              ) : messages.length === 0 ? (
                /* --- Chat Tab: Empty State --- */
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="flex-1 flex flex-col items-center justify-center w-full max-w-[360px] mx-auto mt-[-20px]"
                >
                  <div 
                    className="relative w-[100px] h-[100px] rounded-full p-[2px] mb-4 shadow-[0_0_40px_rgba(0,0,0,0.4)] cursor-pointer"
                    style={{ background: `linear-gradient(135deg, ${activeAgent.colors.hex}, transparent)` }}
                    onClick={() => setShowAgentMenu(!showAgentMenu)}
                  >
                    <img src={activeAgent.img} className="w-full h-full rounded-full border-[3px] border-[#090012] object-cover" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-[8px] border border-dashed rounded-full opacity-40"
                      style={{ borderColor: activeAgent.colors.hex }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-[22px] font-black text-white">{activeAgent.name}</h2>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold border"
                      style={{ backgroundColor: `${activeAgent.colors.hex}15`, borderColor: `${activeAgent.colors.hex}50`, color: activeAgent.colors.hex }}
                    >
                      {activeAgent.title}
                    </span>
                  </div>
                  
                  <p className="text-[14px] text-white/80 text-center leading-relaxed mb-8">
                    {activeAgent.welcome}
                  </p>

                  <div className="w-full grid grid-cols-2 gap-3">
                    {activeAgent.quickQuestions.map((q, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSendMessage(q)}
                        className="text-left px-3 py-3 rounded-[14px] bg-black/40 backdrop-blur-md border hover:bg-black/60 shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center"
                        style={{ borderColor: `${activeAgent.colors.hex}30` }}
                      >
                        <span 
                          className="text-[12px] font-medium transition-colors line-clamp-2 text-center"
                          style={{ color: `${activeAgent.colors.hex}cc` }}
                        >
                          {q}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* --- Chat Tab: Messages State --- */
                <motion.div 
                  key="chat-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4 pb-2"
                >
                  {messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex w-full ${isUser ? 'justify-end' : 'flex-col'}`}
                      >
                        {isUser ? (
                          <div 
                            className="max-w-[80%] rounded-[20px] rounded-br-[4px] px-4 py-2.5 shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${activeAgent.colors.hex}, ${activeAgent.colors.hex}90)`, color: '#090012' }}
                          >
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                          </div>
                        ) : (
                          <>
                            {/* Card: full width, no bubble */}
                            {msg.cards && msg.cards.length > 0 && (
                              <div className="w-full mb-1">
                                {msg.cards.map((card, i) => (
                                  <ResponseCard key={i} data={card} />
                                ))}
                              </div>
                            )}
                            {/* Text: inside bubble */}
                            {!msg.cards && msg.content.trim() && (
                              <div 
                                className="max-w-[80%] rounded-[20px] rounded-bl-[4px] backdrop-blur-md border px-4 py-2.5 shadow-lg"
                                style={{ backgroundColor: `${activeAgent.colors.hex}15`, borderColor: `${activeAgent.colors.hex}30`, color: 'rgba(255,255,255,0.9)' }}
                              >
                                <RichText text={msg.content} />
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                  
                  {isTyping && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex w-full justify-start"
                    >
                      <div 
                        className="backdrop-blur-md border rounded-[20px] rounded-bl-[4px] px-4 py-3.5 shadow-lg flex items-center gap-1.5 h-[40px]"
                        style={{ backgroundColor: `${activeAgent.colors.hex}15`, borderColor: `${activeAgent.colors.hex}30` }}
                      >
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeAgent.colors.hex }} />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeAgent.colors.hex }} />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeAgent.colors.hex }} />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} className="h-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Input Area with AI Model Selector */}
          <AnimatePresence>
            {chatTab === "chat" && (activeAgentId !== "onchain" || onchainTab === "chat") && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="px-4 py-4 w-full backdrop-blur-2xl border-t shrink-0 z-20 pb-6 transition-colors duration-500 relative"
                style={{ 
                  backgroundColor: `${activeAgent.colors.hex}08`,
                  borderColor: `${activeAgent.colors.hex}25` 
                }}
              >
                
                {/* Model Selector Popover */}
                <AnimatePresence>
                  {showModelMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-4 mb-2 w-[220px] bg-[#1A0633]/90 backdrop-blur-xl border border-[#8A3FFC]/40 rounded-[20px] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-30"
                    >
                      <div className="text-[11px] text-white/40 px-3 py-1.5 font-bold uppercase tracking-wider">切换 AI 引擎</div>
                      <div className="flex flex-col gap-1">
                        {MODELS.map((model) => {
                          const Icon = model.icon;
                          const isSelected = selectedModel === model.id;
                          return (
                            <button
                              key={model.id}
                              onClick={() => { setSelectedModel(model.id); setShowModelMenu(false); }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all text-left ${isSelected ? 'bg-[#8A3FFC]/20 border border-[#8A3FFC]/50' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                              <div className={`p-1.5 rounded-full ${isSelected ? 'bg-[#8A3FFC]' : 'bg-white/10'}`}>
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-white/60'}`} />
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[13px] font-bold ${isSelected ? 'text-[#C063FF]' : 'text-white/80'}`}>{model.id}</span>
                                <span className="text-[10px] text-white/40">{model.desc}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div 
                  className="flex items-center gap-2 bg-black/50 border rounded-full pr-1.5 pl-2 py-1.5 focus-within:bg-black/70 transition-all shadow-[0_5px_20px_rgba(0,0,0,0.3)]"
                  style={{ borderColor: `${activeAgent.colors.hex}40` }}
                >
                  {/* Plus Button to toggle Models */}
                  <button 
                    onClick={() => setShowModelMenu(!showModelMenu)}
                    className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all ${showModelMenu ? 'bg-[#8A3FFC]/30 rotate-45' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    <Plus className="w-5 h-5" style={{ color: activeAgent.colors.hex }} />
                  </button>

                  <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                    placeholder="畅所欲言，只需要一句话，其他交给Agent"
                    className="flex-1 bg-transparent text-[14px] text-white placeholder-white/40 outline-none py-2 px-1"
                  />
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isTyping}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0"
                    style={inputValue.trim() && !isTyping 
                      ? { background: `linear-gradient(135deg, ${activeAgent.colors.hex}, ${activeAgent.colors.hex}90)`, boxShadow: `0 0 15px ${activeAgent.colors.hex}60` }
                      : { backgroundColor: `${activeAgent.colors.hex}20` }
                    }
                  >
                    <Send className={`w-[18px] h-[18px] ${inputValue.trim() && !isTyping ? 'text-[#090012]' : 'opacity-60'}`} style={!inputValue.trim() || isTyping ? { color: activeAgent.colors.hex } : {}} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================== */}
        {/* OPERATION MODALS (deposit / withdraw / swap) */}
        {/* ========================================== */}
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center font-sans">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveModal(null)}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-[360px] max-h-[80vh] bg-[#120025] border border-[#8A3FFC]/30 rounded-[24px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-y-auto z-10"
              >
                <button onClick={() => setActiveModal(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10">
                  <X className="w-5 h-5 text-white/60" />
                </button>

                {/* ── Deposit Modal ── */}
                {activeModal === "deposit" && (
                  <>
                    <h3 className="text-[18px] font-black text-white mb-1">充币</h3>
                    <p className="text-[12px] text-white/50 mb-4">向以下地址转账即可到账</p>
                    {depositAddresses.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {depositAddresses.map((a, i) => (
                          <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/10">
                            <div className="text-[11px] text-white/40 mb-1">{a.chain}</div>
                            <div className="flex items-center gap-2">
                              <code className="text-[12px] text-white/80 break-all flex-1">{a.address}</code>
                              <button
                                onClick={() => { navigator.clipboard.writeText(a.address); setCopiedAddr(a.address); setTimeout(() => setCopiedAddr(""), 2000); }}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 shrink-0"
                              >
                                {copiedAddr === a.address ? <span className="text-[10px] text-green-400">已复制</span> : <Copy className="w-4 h-4 text-white/60" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-white/40 text-[13px]">
                        {walletLoggedIn ? "正在获取地址..." : "请先登录钱包"}
                      </div>
                    )}
                  </>
                )}

                {/* ── Withdraw Modal ── */}
                {activeModal === "withdraw" && (
                  <>
                    <h3 className="text-[18px] font-black text-white mb-1">提币</h3>
                    <p className="text-[12px] text-white/50 mb-4">输入接收地址和金额</p>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text" placeholder="接收地址"
                        value={withdrawTo} onChange={e => setWithdrawTo(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#FBBF24]/50"
                      />
                      <input
                        type="text" placeholder="金额"
                        value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#FBBF24]/50"
                      />
                      <button
                        onClick={handleWithdraw}
                        disabled={opLoading || !withdrawTo || !withdrawAmount}
                        className="w-full py-2.5 rounded-xl bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[14px] font-bold text-[#FBBF24] disabled:opacity-30 hover:bg-[#FBBF24]/30 transition-all"
                      >
                        {opLoading ? "处理中..." : "确认提币"}
                      </button>
                      {opResult && <div className="text-[12px] text-white/70 bg-black/30 rounded-xl p-3 break-all">{opResult}</div>}
                    </div>
                  </>
                )}

                {/* ── Swap Modal ── */}
                {activeModal === "swap" && (
                  <>
                    <h3 className="text-[18px] font-black text-white mb-1">兑换</h3>
                    <p className="text-[12px] text-white/50 mb-4">X Layer 链上 DEX 兑换</p>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text" placeholder="金额"
                        value={swapAmount} onChange={e => setSwapAmount(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#A78BFA]/50"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text" value={swapFrom} onChange={e => setSwapFrom(e.target.value)}
                          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#A78BFA]/50"
                          placeholder="卖出"
                        />
                        <ArrowLeftRight className="w-4 h-4 text-white/30 shrink-0" />
                        <input
                          type="text" value={swapTo} onChange={e => setSwapTo(e.target.value)}
                          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#A78BFA]/50"
                          placeholder="买入"
                        />
                      </div>
                      <button
                        onClick={handleSwap}
                        disabled={opLoading || !swapAmount}
                        className="w-full py-2.5 rounded-xl bg-[#A78BFA]/20 border border-[#A78BFA]/40 text-[14px] font-bold text-[#A78BFA] disabled:opacity-30 hover:bg-[#A78BFA]/30 transition-all"
                      >
                        {opLoading ? "处理中..." : "确认兑换"}
                      </button>
                      {opResult && <div className="text-[12px] text-white/70 bg-black/30 rounded-xl p-3 break-all">{opResult}</div>}
                    </div>
                  </>
                )}

                {/* ── Connect Wallet Modal ── */}
                {activeModal === "connect" && (
                  <>
                    <h3 className="text-[18px] font-black text-white mb-1">连接钱包</h3>
                    <p className="text-[12px] text-white/50 mb-4">输入邮箱接收验证码，一步完成平台登录和钱包连接</p>
                    <div className="space-y-3">
                      <input
                        type="email" value={connectEmail} onChange={e => setConnectEmail(e.target.value)}
                        placeholder="请输入邮箱地址"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#FBBF24]/50"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text" maxLength={6} value={connectCode} onChange={e => setConnectCode(e.target.value)}
                          placeholder="验证码"
                          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#FBBF24]/50"
                        />
                        <button
                          onClick={handleConnectSendCode}
                          disabled={connectSending || !connectEmail}
                          className="px-4 py-2.5 rounded-xl bg-[#FBBF24]/20 border border-[#FBBF24]/30 text-[13px] font-bold text-[#FBBF24] disabled:opacity-30 hover:bg-[#FBBF24]/30 transition-all whitespace-nowrap"
                        >
                          {connectSending ? "发送中..." : "发送验证码"}
                        </button>
                      </div>
                      <button
                        onClick={handleConnectVerify}
                        disabled={!connectCode || connectVerifying}
                        className="w-full py-2.5 rounded-xl bg-[#FBBF24] text-[14px] font-bold text-[#090012] disabled:opacity-30 hover:bg-[#FDE047] transition-all"
                      >
                        {connectVerifying ? "验证中..." : "连接钱包"}
                      </button>
                      {connectMsg && <div className="text-[12px] text-center text-[#FBBF24]">{connectMsg}</div>}
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================== */}
        {/* SIDEBAR / DRAWER MODAL (FULL SCREEN) */}
        {/* ========================================== */}
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 flex justify-center font-sans pointer-events-none">
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
              />

              {/* Sidebar Content (Full Screen) */}
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-[480px] h-full bg-[#0D001A] shadow-[20px_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden pointer-events-auto"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
                >
                  <X className="w-6 h-6 text-white/70" />
                </button>

                {/* Asset Panel */}
                <div className="pt-16 px-5 pb-6 border-b border-[#8A3FFC]/20 bg-gradient-to-b from-[#8A3FFC]/10 to-transparent relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C063FF] blur-[80px] opacity-20 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Wallet className="w-5 h-5 text-[#A78BFA]" />
                      <span className="text-[15px] font-bold text-white/90">
                        {walletLoggedIn ? (walletEmail || "已登录") : "资产面板"}
                      </span>
                    </div>

                    {/* Total Balance */}
                    <div className="mb-4">
                      <span className="text-[11px] text-white/40 uppercase tracking-wider">总资产价值</span>
                      <div className="text-[36px] font-black text-white tracking-tight">
                        {walletTotal !== null ? `$${walletTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
                      </div>
                    </div>

                    {/* Token List */}
                    {walletTokens.length > 0 ? (
                      <div className="flex flex-col gap-1.5 mb-3">
                        {walletTokens.map((t, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/80">
                                {t.symbol.slice(0, 3)}
                              </div>
                              <div>
                                <div className="text-[13px] font-bold text-white">{t.symbol}</div>
                                <div className="text-[10px] text-white/40">{t.chain}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[13px] font-bold text-white">{t.amount.slice(0, 8)}</div>
                              <div className="text-[11px] text-white/60">{t.usd}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-[13px] text-white/30 mb-3">
                        {walletLoading ? "加载中..." : walletLoggedIn ? "暂无资产" : <button onClick={() => { setWalletLoading(true); fetchWallet(); }} className="text-[#F7D56D] hover:underline">点击连接钱包</button>}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons — always visible */}
                  <div className="grid grid-cols-3 gap-2 relative z-10 mt-3">
                    <button
                      onClick={() => { if (!requireLogin("deposit")) return; fetchAddresses(); setActiveModal("deposit"); }}
                      disabled={!walletLoggedIn}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[13px] font-bold transition-all ${walletLoggedIn ? 'bg-[#38BDF8]/15 border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/25' : 'bg-white/5 border-white/10 text-white/25 cursor-not-allowed'}`}
                    >
                      <ArrowDownToLine className="w-4 h-4" /> 充币
                    </button>
                    <button
                      onClick={() => { if (!requireLogin("withdraw")) return; setOpResult(""); setActiveModal("withdraw"); }}
                      disabled={!walletLoggedIn}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[13px] font-bold transition-all ${walletLoggedIn ? 'bg-[#FBBF24]/15 border-[#FBBF24]/30 text-[#FBBF24] hover:bg-[#FBBF24]/25' : 'bg-white/5 border-white/10 text-white/25 cursor-not-allowed'}`}
                    >
                      <ArrowUpFromLine className="w-4 h-4" /> 提币
                    </button>
                    <button
                      onClick={() => { if (!requireLogin("swap")) return; setOpResult(""); setActiveModal("swap"); }}
                      disabled={!walletLoggedIn}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[13px] font-bold transition-all ${walletLoggedIn ? 'bg-[#A78BFA]/15 border-[#A78BFA]/30 text-[#A78BFA] hover:bg-[#A78BFA]/25' : 'bg-white/5 border-white/10 text-white/25 cursor-not-allowed'}`}
                    >
                      <ArrowLeftRight className="w-4 h-4" /> 兑换
                    </button>
                  </div>
                </div>

                {/* Nav Items - Same Row Grid */}
                <div className="px-5 py-6 grid grid-cols-3 gap-3 shrink-0">
                  <button className="flex flex-col items-center justify-center gap-3 py-5 px-2 rounded-[18px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                    <History className="w-7 h-7 text-[#8A3FFC] group-hover:text-[#C063FF] transition-colors" />
                    <span className="text-[13px] font-bold text-white/80 group-hover:text-white transition-colors">近期对话</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-3 py-5 px-2 rounded-[18px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                    <BarChart2 className="w-7 h-7 text-[#38BDF8] group-hover:text-[#7DD3FC] transition-colors" />
                    <span className="text-[13px] font-bold text-white/80 group-hover:text-white transition-colors">数据分析</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-3 py-5 px-2 rounded-[18px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                    <div className="relative">
                      <Bell className="w-7 h-7 text-[#FBBF24] group-hover:text-[#FDE047] transition-colors" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-[2px] border-[#0D001A]" />
                    </div>
                    <span className="text-[13px] font-bold text-white/80 group-hover:text-white transition-colors">消息通知</span>
                  </button>
                </div>
                
                {/* Transaction History */}
                {walletLoggedIn && txHistory.length > 0 && (
                  <div className="px-5 py-3 border-t border-white/5">
                    <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2 px-1">交易记录</h3>
                    <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto no-scrollbar">
                      {txHistory.slice(0, 8).map((tx, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.02]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[10px] font-bold shrink-0 ${tx.direction === "转入" ? "text-emerald-400" : "text-red-400"}`}>
                              {tx.direction}
                            </span>
                            <span className="text-[11px] text-white/70 truncate">{tx.amount} {tx.symbol}</span>
                          </div>
                          <span className="text-[10px] text-white/30 shrink-0 ml-2">{tx.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation History */}
                <div className="flex-1 px-5 py-3 overflow-y-auto">
                  <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-3 px-1">最近对话</h3>
                  {conversations.length === 0 ? (
                    <div className="w-full rounded-[20px] border border-dashed border-[#8A3FFC]/20 flex flex-col items-center justify-center py-16 opacity-50 bg-[#1A0633]/20">
                      <History className="w-8 h-8 text-[#A78BFA] mb-2" />
                      <span className="text-[13px] text-[#A78BFA] tracking-wider">暂无对话记录</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {conversations.map((conv) => {
                        const agentInfo = AGENTS.find(a => a.id === conv.agent_id);
                        const isActive = conv.id === conversationId;
                        return (
                          <button
                            key={conv.id}
                            onClick={() => switchConversation(conv.id, conv.agent_id)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-[14px] transition-all text-left ${
                              isActive ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full p-[1px] shrink-0" style={{ background: `linear-gradient(135deg, ${agentInfo?.colors.hex || '#8A3FFC'}, transparent)` }}>
                              <div className="w-full h-full rounded-full bg-[#0D001A] flex items-center justify-center text-[11px] font-bold" style={{ color: agentInfo?.colors.hex || '#8A3FFC' }}>
                                {agentInfo?.name?.charAt(0) || '?'}
                              </div>
                            </div>
                            <div className="flex flex-col overflow-hidden flex-1">
                              <span className="text-[13px] font-bold text-white/80 truncate">{agentInfo?.name || '对话'}</span>
                              <span className="text-[10px] text-white/40 mt-0.5">{conv.updated_at?.slice(0, 16).replace('T', ' ')}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Search */}
                <div className="p-6 border-t border-[#8A3FFC]/20 bg-[#0D001A]/80 backdrop-blur-md shrink-0">
                  <div className="flex items-center gap-2 bg-black/40 border border-[#8A3FFC]/30 rounded-2xl p-2 focus-within:border-[#C063FF] transition-colors shadow-inner">
                    <input 
                      type="text" 
                      placeholder="搜索全局记录..." 
                      className="flex-1 bg-transparent text-[15px] text-white placeholder-white/30 px-3 outline-none"
                    />
                    <button className="w-10 h-10 rounded-[12px] bg-[#8A3FFC]/20 flex items-center justify-center hover:bg-[#8A3FFC]/40 transition-colors">
                      <Search className="w-5 h-5 text-[#C063FF]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  }


  // ==========================================
  // RENDER: Selector View
  // ==========================================
  const selectorAgent = AGENTS[activeIndex];
  
  return (
    <div className="min-h-screen bg-[#090012] text-[#FFF5D9] flex flex-col items-center overflow-x-hidden relative font-sans selection:bg-[#8A3FFC]/40">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: `url(${ImpactBgImg})` }}
      />
      <div className="fixed inset-0 bg-[#090012]/50 z-0 pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-[150px] bg-gradient-to-b from-[#090012] via-[#090012]/80 to-transparent z-0 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-[#090012] via-[#090012]/90 to-transparent z-0 pointer-events-none" />

      <motion.div 
        key={`ambient-${activeIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35, scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[120px] z-0 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${selectorAgent.colors.hex} 0%, transparent 70%)` }}
      />

      <div className="w-full max-w-[480px] mx-auto h-screen flex flex-col relative z-10 py-5 overflow-hidden touch-none">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center w-full px-5 mb-2 shrink-0"
        >
          {/* Back button removed or disabled here as it's the root screen, but we keep it for consistency if needed */}
          <button className="flex items-center justify-center w-10 h-10 bg-[#1A0633]/70 border border-[#8A3FFC]/50 rounded-full backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:bg-[#1A0633] transition-colors opacity-0 pointer-events-none">
            <ChevronLeft className="w-5 h-5 text-[#F7D56D]" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-[18px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#C063FF] to-[#F7D56D]">
              选择你的专属 Agent
            </h1>
            <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-0.5">Select Partner</span>
          </div>
          <div className="w-10 h-10" />
        </motion.div>

        <div className="relative w-full flex-1 flex items-center justify-center mt-4 mb-4">
          {AGENTS.map((agent, index) => {
            const offset = index - activeIndex;
            const isCenter = offset === 0;
            const zIndex = AGENTS.length - Math.abs(offset);

            return (
              <motion.div
                key={agent.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                animate={{
                  x: offset * 240,
                  scale: isCenter ? 1 : 0.82,
                  opacity: isCenter ? 1 : (Math.abs(offset) === 1 ? 0.45 : 0),
                  zIndex: zIndex
                }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className={`absolute top-1/2 -mt-[210px] left-1/2 -ml-[140px] w-[280px] h-[420px] ${isCenter ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => {
                  if (!isCenter) setActiveIndex(index);
                  else handleStartChat(agent.id as AgentId);
                }}
              >
                <div 
                  className="w-full h-full bg-[#1A0633]/85 backdrop-blur-2xl border-[2px] rounded-[32px] p-6 flex flex-col items-center relative overflow-hidden transition-all duration-500 shadow-2xl select-none"
                  style={isCenter ? { borderColor: agent.colors.hex, boxShadow: `0 0 40px ${agent.colors.hex}60` } : { borderColor: 'rgba(138,63,252,0.3)' }}
                >
                  
                  {isCenter && (
                    <div 
                      className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 opacity-20 blur-[40px] pointer-events-none" 
                      style={{ background: `linear-gradient(to bottom, ${agent.colors.hex}, transparent)` }}
                    />
                  )}

                  <motion.div 
                    animate={{ scale: isCenter ? 1 : 0.9, y: isCenter ? 0 : 10 }}
                    className="relative w-[110px] h-[110px] rounded-full p-[3px] mb-5 shadow-[0_5px_20px_rgba(0,0,0,0.5)] z-10 shrink-0"
                    style={{ background: `linear-gradient(135deg, ${agent.colors.hex}, ${agent.colors.hex}40)` }}
                  >
                    <img src={agent.img} className="w-full h-full rounded-full border-[3px] border-[#090012] object-cover" draggable={false} />
                    {isCenter && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 1.2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -inset-[6px] rounded-full border border-dashed border-white/40 animate-[spin_10s_linear_infinite]"
                      />
                    )}
                  </motion.div>

                  <div className="flex flex-col items-center mb-4 z-10 shrink-0">
                    <h3 className="text-[24px] font-black text-white tracking-wider mb-1.5 drop-shadow-md">{agent.name}</h3>
                    <div 
                      className="px-4 py-1 rounded-full border border-white/20"
                      style={{ background: `linear-gradient(to right, ${agent.colors.hex}, ${agent.colors.hex}aa)` }}
                    >
                      <span className="text-[12px] font-black text-[#090012] drop-shadow-sm tracking-widest">{agent.title}</span>
                    </div>
                  </div>

                  <p 
                    className="text-[14px] font-bold italic mb-4 text-center drop-shadow-sm shrink-0"
                    style={{ color: agent.colors.hex }}
                  >
                    "{agent.quote}"
                  </p>

                  <p className="text-[13px] text-white/70 text-center leading-relaxed mb-5 line-clamp-3 px-1 shrink-0">
                    {agent.desc}
                  </p>

                  <div className="mt-auto w-full z-10 px-1">
                    <motion.div 
                      initial={false}
                      animate={{ height: isCenter ? 'auto' : '30px', opacity: isCenter ? 1 : 0 }}
                      className="grid grid-cols-2 gap-2 overflow-hidden"
                    >
                      {agent.skills.map((skill, i) => (
                        <span key={i} className="text-[11px] font-medium py-1.5 rounded-lg border border-[#8A3FFC]/40 bg-[#090012]/80 text-[rgba(235,216,255,0.9)] whitespace-nowrap shadow-inner text-center flex items-center justify-center">
                          {skill}
                        </span>
                      ))}
                    </motion.div>
                  </div>

                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full px-6 pb-6 flex flex-col items-center shrink-0 z-20"
        >
          <div className="flex items-center justify-center gap-2.5 mb-6">
            {AGENTS.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveIndex(i)}
                className={`transition-all duration-300 rounded-full ${activeIndex === i ? 'w-8 h-2 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
                style={activeIndex === i ? { backgroundColor: selectorAgent.colors.hex } : {}}
              />
            ))}
            <span className="ml-3 text-[13px] font-black font-mono bg-[#1A0633]/80 px-2.5 py-0.5 rounded border border-[#8A3FFC]/30 shadow-inner" style={{ color: selectorAgent.colors.hex }}>
              {activeIndex + 1} / {AGENTS.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.button
              key={`btn-${activeIndex}`}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[340px] h-[64px] rounded-[22px] flex items-center justify-center gap-2.5 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group"
              style={{ background: `linear-gradient(to right, ${selectorAgent.colors.hex}, ${selectorAgent.colors.hex}aa)` }}
              onClick={() => handleStartChat(selectorAgent.id as AgentId)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              
              <MessageSquare className="w-6 h-6 text-[#090012] drop-shadow-sm" fill="currentColor" fillOpacity={0.2} />
              <span className="text-[#090012] text-[18px] font-black tracking-[0.15em] drop-shadow-sm">
                开启专属对话
              </span>
            </motion.button>
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}
