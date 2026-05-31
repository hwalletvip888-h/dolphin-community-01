import { create } from "zustand";
import { subscribe, fetchCandles, type TickerData, type CandleData, type FundingData } from "@/src/services/okx-ws";

export interface MemeToken {
  symbol: string;
  name: string;
  chain: string;
  price: string;
  changePct: string;
  volume24h: string;
  marketCap: string;
}

interface MarketState {
  tickers: Record<string, TickerData>;
  candles: Record<string, number[]>;
  funding: Record<string, FundingData>;
  memeTokens: MemeToken[];
  connected: boolean;
  start: () => void;
  loadCandles: () => Promise<void>;
  loadMemeTokens: () => Promise<void>;
}

const PAIRS = ["BTC-USDT-SWAP", "ETH-USDT-SWAP", "SOL-USDT-SWAP"];
let unsubs: (() => void)[] = [];

export const useMarket = create<MarketState>((set, get) => ({
  tickers: {},
  candles: {},
  funding: {},
  memeTokens: [],
  connected: false,

  start: () => {
    if (get().connected) return;

    PAIRS.forEach((instId) => {
      // Ticker
      unsubs.push(subscribe("tickers", instId, (d: TickerData) => {
        set((s) => ({ tickers: { ...s.tickers, [instId]: d }, connected: true }));
      }));

      // Live candle (append to array)
      unsubs.push(subscribe("candle1m", instId, (d: CandleData) => {
        set((s) => {
          const existing = s.candles[instId] || [];
          const next = [...existing];
          if (d.confirmed && next.length > 0) {
            next[next.length - 1] = parseFloat(d.c);
          } else if (!d.confirmed) {
            // Snapshot — push new close
            next.push(parseFloat(d.c));
            if (next.length > 60) next.shift();
          }
          return { candles: { ...s.candles, [instId]: next } };
        });
      }));

      // Funding rate
      unsubs.push(subscribe("funding-rate", instId, (d: FundingData) => {
        set((s) => ({ funding: { ...s.funding, [instId]: d } }));
      }));
    });
  },

  loadCandles: async () => {
    const map: Record<string, number[]> = {};
    for (const instId of PAIRS) {
      map[instId] = await fetchCandles(instId, "1m", 60);
    }
    set((s) => ({ candles: { ...s.candles, ...map } }));
  },

  loadMemeTokens: async () => {
    try {
      // OnchainOS memepump scan via MCP
      const r = await fetch("http://154.12.55.135:3000/api/h/v1/meme/scan?chain=solana&limit=20", { signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      const tokens: MemeToken[] = [];
      const raw = d?.data || d?.tokens || d?.results || [];
      if (Array.isArray(raw)) {
        for (const t of raw.slice(0, 8)) {
          tokens.push({
            symbol: t.symbol || t.token || "?",
            name: t.name || t.symbol || "",
            chain: t.chain || "Solana",
            price: t.price || "—",
            changePct: t.change || t.change24h || "0",
            volume24h: t.volume24h || t.volume || "0",
            marketCap: t.marketCap || t.mc || "0",
          });
        }
      }
      if (tokens.length > 0) set({ memeTokens: tokens });
    } catch {}
  },
}));
