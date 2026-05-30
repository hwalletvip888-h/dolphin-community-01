import { create } from "zustand";
import { API_BASE, authHeaders } from "@/src/lib/api";

export interface SignalItem {
  chainIndex: string;
  symbol: string;
  name: string;
  logo: string;
  price?: string;
  volume1h: string;
  buyTx1h: string;
  sellTx1h: string;
  holders: string;
  marketCap: string;
  created: string;
  security: {
    top10Holdings: number;
    devHoldings: number;
    insiders: number;
    bundlers: number;
    snipers: number;
    freshWallets: number;
    phishing: number;
  };
  flags: {
    devSoldAll?: boolean;
    communityTakeover: boolean;
    dexScreenerPaid: boolean;
    liveOnPumpFun: boolean;
  };
  social: {
    x?: string;
    telegram?: string;
    website?: string;
  };
  bondingPercent: string;
  creatorAddress: string;
  securityScore: number;
}

interface SignalState {
  signals: SignalItem[];
  loading: boolean;
  error: string;
  fetchSignals: () => Promise<void>;
}

export const useSignalStore = create<SignalState>((set) => ({
  signals: [],
  loading: false,
  error: "",

  fetchSignals: async () => {
    set({ loading: true, error: "" });
    try {
      const headers = await authHeaders();
      const r = await fetch(`${API_BASE}/api/signals`, { headers });
      const d = await r.json();
      if (Array.isArray(d.signals)) set({ signals: d.signals });
    } catch {
      set({ error: "信号数据加载失败" });
    }
    set({ loading: false });
  },
}));
