import * as SecureStore from "expo-secure-store";

export const BASE = "https://api.hvip.ink";

async function headers(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync("dolphin_token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function post(path: string, body: Record<string, unknown>) {
  const r = await fetch(`${BASE}${path}`, { method: "POST", headers: await headers(), body: JSON.stringify(body) });
  return r.json();
}

export async function get(path: string) {
  const r = await fetch(`${BASE}${path}`, { headers: await headers() });
  return r.json();
}
