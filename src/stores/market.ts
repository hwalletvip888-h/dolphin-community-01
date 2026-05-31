import { create } from "zustand";
import { subscribe, fetchCandles, type TickerData, type CandleData, type FundingData } from "@/src/services/okx-ws";

export interface HotToken {
  instId: string;
  symbol: string;
  last: string;
  changePct: string;
  vol24h: string;
}

interface MarketState {
  tickers: Record<string, TickerData>;
  candles: Record<string, number[]>;
  funding: Record<string, FundingData>;
  hotTokens: HotToken[];
  connected: boolean;
  start: () => void;
  loadCandles: () => Promise<void>;
  loadHotTokens: () => Promise<void>;
}

const PAIRS = ["BTC-USDT-SWAP", "ETH-USDT-SWAP", "SOL-USDT-SWAP"];
let unsubs: (() => void)[] = [];

export const useMarket = create<MarketState>((set, get) => ({
  tickers: {},
  candles: {},
  funding: {},
  hotTokens: [],
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

  loadHotTokens: async () => {
    try {
      // OKX top volume swap tickers
      const r = await fetch("https://www.okx.com/api/v5/market/tickers?instType=SWAP&limit=20");
      const d = await r.json();
      if (d.code === "0" && d.data) {
        const tokens: HotToken[] = d.data
          .filter((t: any) => t.instId.endsWith("-USDT-SWAP"))
          .sort((a: any, b: any) => parseFloat(b.vol24h) - parseFloat(a.vol24h))
          .slice(0, 8)
          .map((t: any) => ({
            instId: t.instId,
            symbol: t.instId.replace("-USDT-SWAP", ""),
            last: t.last,
            changePct: (((parseFloat(t.last) - parseFloat(t.open24h || t.last)) / parseFloat(t.open24h || t.last)) * 100).toFixed(2),
            vol24h: t.vol24h,
          }));
        set({ hotTokens: tokens });
      }
    } catch {}
  },
}));
