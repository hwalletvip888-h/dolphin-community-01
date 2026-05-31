import { create } from "zustand";
import { subscribe, fetchCandles, type TickerData, type CandleData, type FundingData } from "@/src/services/okx-ws";

interface MarketState {
  tickers: Record<string, TickerData>;
  candles: Record<string, number[]>;  // close prices array
  funding: Record<string, FundingData>;
  connected: boolean;
  start: () => void;
  loadCandles: () => Promise<void>;
}

const PAIRS = ["BTC-USDT-SWAP", "ETH-USDT-SWAP", "SOL-USDT-SWAP"];
let unsubs: (() => void)[] = [];

export const useMarket = create<MarketState>((set, get) => ({
  tickers: {},
  candles: {},
  funding: {},
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
}));
