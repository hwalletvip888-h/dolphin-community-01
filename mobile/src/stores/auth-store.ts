import { create } from "zustand";
import * as SecureStore from "expo-secure-store"
import { API_BASE, authHeaders } from "@/src/lib/api";

const TOKEN_KEY = "dolphin_token";
const USER_ID_KEY = "dolphin_user_id";

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  loadStoredAuth: () => Promise<void>;
  login: (email: string) => Promise<{ ok: boolean; confirming?: boolean; message?: string; user_id?: string }>;
  verify: (code: string, email: string, userId: string) => Promise<{ ok: boolean; token?: string; message?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  userId: null,
  email: "",
  isLoggedIn: false,
  isLoading: true,

  loadStoredAuth: async () => {
    try {
      const [token, userId] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_ID_KEY),
      ]);
      if (token) set({ token, userId, isLoggedIn: true });
    } catch { /* not stored */ }
    set({ isLoading: false });
  },

  login: async (email: string) => {
    set({ email });
    try {
      const r = await fetch(`${API_BASE}/api/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email }),
      });
      const d = await r.json();
      if (d.ok && d.user_id) {
        set({ userId: d.user_id });
      }
      return d;
    } catch {
      return { ok: false, message: "网络异常，请稍后重试" };
    }
  },

  verify: async (code: string, email: string, userId: string) => {
    try {
      const r = await fetch(`${API_BASE}/api/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code, email, user_id: userId }),
      });
      const d = await r.json();
      if (d.ok && d.token) {
        await Promise.all([
          SecureStore.setItemAsync(TOKEN_KEY, d.token),
          SecureStore.setItemAsync(USER_ID_KEY, d.user_id || userId),
        ]);
        set({ token: d.token, userId: d.user_id || userId, isLoggedIn: true });
      }
      return d;
    } catch {
      return { ok: false, message: "网络异常，请稍后重试" };
    }
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_ID_KEY),
    ]);
    set({ token: null, userId: null, email: "", isLoggedIn: false });
  },
}));
