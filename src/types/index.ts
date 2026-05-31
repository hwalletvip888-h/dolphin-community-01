// ─── Agent ───
export type AgentId = "worldcup" | "dolphin" | "onchain" | "zhuge" | "wealth" | "reward";

export interface AgentConfig {
  id: AgentId;
  name: string;
  title: string;
  quote: string;
  desc: string;
  skills: string[];
  color: string;
  welcome: string;
  questions: string[];
  unlockLevel: number;
}

// ─── Chat ───
export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  cards?: CardData[];
}

export interface Conversation {
  id: string;
  agent_id: string;
  updated_at: string;
}

// ─── Cards ───
export type CardData =
  | { type: "odds"; items: OddsItem[] }
  | { type: "price"; items: PriceItem[] }
  | { type: "signal"; items: SignalItem[] }
  | { type: "positions"; items: PositionItem[] }
  | { type: "balance"; total: string; tokens: TokenItem[] }
  | { type: "account"; usdc: string; pol: string; positions?: string }
  | { type: "scan"; coins: number; signals: number; top: ScanTopItem[] }
  | { type: "smart_money"; signals: SmartMoneyItem[] }
  | { type: "bridge"; chains: ChainItem[]; protocols: ProtocolItem[] }
  | { type: "backtest"; symbol: string; strategy: string; return_pct: string; win_rate: string; trades: number; sharpe: string }
  | { type: "gas"; chains: GasChainItem[]; note: string }
  | { type: "strategies"; items: StrategyItem[] };

export interface OddsItem { question: string; yes: string; volume: string }
export interface PriceItem { symbol: string; price: string; change: string }
export interface SignalItem { symbol: string; direction: string; entry: string; tp: string; sl: string; rr: string }
export interface PositionItem { symbol: string; side: string; size: string; entry: string; pnl: string }
export interface TokenItem { symbol: string; chain: string; amount: string; usd: string }
export interface ScanTopItem { symbol: string; price: string; rr: string }
export interface SmartMoneyItem { symbol: string; price: string; whale: string; rr: string; trend: string }
export interface ChainItem { name: string; id: string; native: string }
export interface ProtocolItem { name: string; fee: string }
export interface GasChainItem { chain: string; coins: string }
export interface StrategyItem { id: string; name: string; desc: string }

// ─── Signals ───
export interface OnchainSignal {
  symbol: string; name: string; logo: string; price: string;
  mc: string; volume: string; whale: string; action: string;
  time: string; sparkline: number[];
}

// ─── Wallet ───
export interface WalletToken {
  symbol: string; chain: string; amount: string; usd: string;
}
export interface TxRecord {
  time: string; direction: string; amount: string; symbol: string;
  hash: string; status: string;
}
