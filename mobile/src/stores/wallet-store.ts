import { create } from "zustand";
import { API_BASE, authHeaders } from "@/src/lib/api";

export interface TokenItem {
  chain: string;
  symbol: string;
  balance: string;
  usd: string;
  value: string;
  address: string;
  isRiskToken?: boolean;
}

export interface TxRecord {
  chainIndex: string;
  txHash: string;
  txTime: string;
  from: { address: string; amount: string }[];
  to: { address: string; amount: string }[];
  tokenContractAddress: string;
  amount: string;
  symbol: string;
  txFee: string;
  txStatus: string;
  hitBlacklist: boolean;
  tag?: string;
}

interface WalletState {
  total: string;
  tokens: TokenItem[];
  addresses: { chain: string; address: string }[];
  transactions: TxRecord[];
  email: string;
  loggedIn: boolean;
  loading: boolean;
  txLoading: boolean;
  evmAddress: string;
  solAddress: string;
  fetchWallet: (address?: string, chains?: string) => Promise<void>;
  fetchAddresses: () => Promise<void>;
  fetchTxHistory: (address?: string) => Promise<void>;
  lookupAddress: (address: string, chains: string) => Promise<TokenItem[]>;
  sendToken: (to: string, amount: string, tokenSymbol: string, chainIndex: number) => Promise<string>;
  swapToken: (from: string, to: string, amount: string, chainIndex: number) => Promise<string>;
}
export const useWalletStore = create<WalletState>((set, get) => ({
  total: "0",
  tokens: [],
  addresses: [],
  transactions: [],
  email: "",
  loggedIn: false,
  loading: true,
  txLoading: false,
  evmAddress: "",
  solAddress: "",

  fetchWallet: async (address?: string, chains?: string) => {
    set({ loading: true });
    try {
      const headers = await authHeaders();
      const [statusRes, balanceRes] = await Promise.all([
        fetch(`${API_BASE}/api/wallet`, { method: "POST", headers, body: JSON.stringify({ action: "status" }) }),
        fetch(`${API_BASE}/api/wallet`, {
          method: "POST", headers,
          body: JSON.stringify({
            action: "balance",
            address: address || "",
            chains: chains || "1,10,56,137,196,324,8453,42161,43114,501",
            excludeRiskToken: false,
          }),
        }),
      ]);
      const statusData = await statusRes.json();
      const balanceData = await balanceRes.json();

      if (statusData.ok || balanceData.ok) {
        // Extract EVM and Solana addresses from status
        const addr0 = statusData.address || statusData.evm_address || "";
        const addr1 = statusData.sol_address || "";

        const tokens: TokenItem[] = (balanceData.tokens || []).map((t: Record<string, unknown>) => ({
          chain: String(t.chain || ""),
          symbol: String(t.symbol || ""),
          balance: String(t.balance || "0"),
          usd: String(t.usd || "0"),
          value: String(t.value || "0"),
          address: String(t.address || ""),
          isRiskToken: !!t.isRiskToken,
        }));

        set({
          loggedIn: true,
          tokens,
          total: balanceData.total || "0",
          email: statusData.email || "",
          evmAddress: addr0,
          solAddress: addr1,
          loading: false,
        });
      } else {
        set({ loggedIn: false, total: "0", tokens: [], loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchAddresses: async () => {
    try {
      const headers = await authHeaders();
      const r = await fetch(`${API_BASE}/api/wallet`, { method: "POST", headers, body: JSON.stringify({ action: "addresses" }) });
      const d = await r.json();
      set({ addresses: d.addresses || [] });
    } catch { /* silent */ }
  },

  fetchTxHistory: async (address?: string) => {
    set({ txLoading: true });
    try {
      const headers = await authHeaders();
      const addr = address || get().evmAddress;
      const r = await fetch(`${API_BASE}/api/wallet`, {
        method: "POST", headers,
        body: JSON.stringify({ action: "history", address: addr, chains: "1,10,56,137,196,8453,42161,501", limit: "20" }),
      });
      const d = await r.json();
      if (d.ok) set({ transactions: d.transactions || [] });
    } catch { /* silent */ }
    set({ txLoading: false });
  },

  lookupAddress: async (address: string, chains: string) => {
    try {
      const headers = await authHeaders();
      const r = await fetch(`${API_BASE}/api/wallet`, {
        method: "POST", headers,
        body: JSON.stringify({ action: "lookup", address, chains }),
      });
      const d = await r.json();
      if (d.ok) {
        return (d.tokens || []).map((t: Record<string, unknown>) => ({
          chain: String(t.chain || ""),
          symbol: String(t.symbol || ""),
          balance: String(t.balance || "0"),
          usd: String(t.usd || "0"),
          value: String(t.usd || "0"), // value = balance * usd
          address: String(t.address || ""),
          isRiskToken: !!t.isRiskToken,
        }));
      }
    } catch { /* silent */ }
    return [];
  },

  sendToken: async (to, amount, tokenSymbol, chainIndex) => {
    const headers = await authHeaders();
    const r = await fetch(`${API_BASE}/api/wallet`, { method: "POST", headers, body: JSON.stringify({ action: "send", to, amount, tokenSymbol, chainIndex }) });
    const d = await r.json();
    if (d.ok) get().fetchWallet();
    return d.message || (d.ok ? "发送成功" : "发送失败");
  },

  swapToken: async (from, to, amount, chainIndex) => {
    const headers = await authHeaders();
    const r = await fetch(`${API_BASE}/api/wallet`, { method: "POST", headers, body: JSON.stringify({ action: "swap", fromToken: from, toToken: to, amount, chainIndex }) });
    const d = await r.json();
    if (d.ok) get().fetchWallet();
    return d.message || (d.ok ? "兑换成功" : "兑换失败");
  },
}));
