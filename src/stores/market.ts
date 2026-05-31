import { create } from "zustand";
import { subscribe, type TickerData } from "@/src/services/okx-ws";

interface MarketState {
  tickers: Record<string, TickerData>;
  connected: boolean;
  start: () => void;
  stop: () => void;
}

const PAIRS = ["BTC-USDT-SWAP", "ETH-USDT-SWAP", "SOL-USDT-SWAP"];
let unsubs: (() => void)[] = [];

export const useMarket = create<MarketState>((set, get) => ({
  tickers: {},
  connected: false,

  start: () => {
    if (get().connected) return;

    PAIRS.forEach((instId) => {
      const unsub = subscribe(instId, (data) => {
        set((s) => ({
          tickers: { ...s.tickers, [instId]: data },
          connected: true,
        }));
      });
      unsubs.push(unsub);
    });
  },

  stop: () => {
    unsubs.forEach((fn) => fn());
    unsubs = [];
    set({ connected: false });
  },
}));
