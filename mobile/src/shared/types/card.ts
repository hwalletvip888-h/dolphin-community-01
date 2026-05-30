// Card data types — shared between web and mobile
// Source: frontend/components/ResponseCard.tsx

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
