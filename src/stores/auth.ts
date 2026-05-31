import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { walletCall } from "@/src/api/chat";
import type { WalletToken } from "@/src/types";

const CHAIN_NAMES: Record<number, string> = {
  1: "ETH", 10: "Optimism", 56: "BSC", 137: "Polygon",
  196: "X Layer", 324: "zkSync", 8453: "Base", 42161: "Arbitrum", 43114: "Avalanche", 501: "Solana",
};

type AuthState = {
  token: string | null;
  userId: string | null;
  email: string;
  loggedIn: boolean;
  loading: boolean;
  level: number;
  total: number | null;
  tokens: WalletToken[];
  boot: () => Promise<void>;
  login: (email: string) => Promise<any>;
  verifyCode: (code: string, email: string, uid: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshWallet: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  token: null, userId: null, email: "", loggedIn: false, loading: true, level: 1, total: null, tokens: [],

  boot: async () => {
    try {
      const [token, uid] = await Promise.all([
        SecureStore.getItemAsync("dolphin_token"),
        SecureStore.getItemAsync("dolphin_user_id"),
      ]);
      if (token) {
        // Verify stored token is still valid
        try {
          const status = await walletCall("status");
          const detail = typeof status?.detail === "string" ? status.detail : JSON.stringify(status?.detail || "{}");
          if (detail.includes('"loggedIn": true')) {
            set({ token, userId: uid, loggedIn: true });
          } else {
            // Token expired — clear it
            await SecureStore.deleteItemAsync("dolphin_token");
            await SecureStore.deleteItemAsync("dolphin_user_id");
          }
        } catch {
          // Can't verify — assume valid for now
          set({ token, userId: uid, loggedIn: true });
        }
      }
    } catch {}
    set({ loading: false });
  },

  login: async (email) => {
    set({ email });
    try {
      const d = await walletCall("login", { email });
      if (d.ok && d.user_id) set({ userId: d.user_id });
      return d;
    } catch { return { ok: false, message: "网络异常" }; }
  },

  verifyCode: async (code, email, uid) => {
    try {
      const d = await walletCall("verify", { code, email, user_id: uid });
      if (d.ok && d.token) {
        await SecureStore.setItemAsync("dolphin_token", d.token);
        await SecureStore.setItemAsync("dolphin_user_id", d.user_id || uid);
        set({ token: d.token, userId: d.user_id || uid, loggedIn: true });
      }
      return d;
    } catch { return { ok: false, message: "网络异常" }; }
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync("dolphin_token"),
      SecureStore.deleteItemAsync("dolphin_user_id"),
    ]);
    set({ token: null, userId: null, email: "", loggedIn: false, total: null, tokens: [] });
  },

  refreshWallet: async () => {
    try {
      const [status, balance] = await Promise.all([
        walletCall("status"), walletCall("balance"),
      ]);
      if (status?.detail) {
        const detail = typeof status.detail === "string" ? status.detail : JSON.stringify(status.detail);
        const loggedIn = detail.includes('"loggedIn": true');
        if (loggedIn && balance?.balance) {
          const bd = balance.balance?.data || balance.balance;
          const details = bd?.details || [];
          let total = 0;
          const tokens: WalletToken[] = [];
          for (const d of details) {
            for (const t of d?.tokenAssets || []) {
              total += Number(t.usdValue || 0);
              tokens.push({
                symbol: t.symbol || "?", chain: CHAIN_NAMES[Number(t.chainIndex)] || "?",
                amount: String(t.balance || "0"), usd: `$${Number(t.usdValue || 0).toFixed(2)}`,
              });
            }
          }
          set({ loggedIn, total, tokens });
        } else if (!loggedIn) {
          set({ loggedIn: false, total: null, tokens: [] });
        }
      }
    } catch {}
  },
}));
