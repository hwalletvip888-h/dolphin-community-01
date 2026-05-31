// API configuration
import * as SecureStore from "expo-secure-store";

export const API_BASE = "https://api.hvip.ink";

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync("dolphin_token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export async function apiPost(path: string, body: object): Promise<any> {
  const headers = await authHeaders();
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function apiGet(path: string): Promise<any> {
  const headers = await authHeaders();
  const r = await fetch(`${API_BASE}${path}`, { headers });
  return r.json();
}
