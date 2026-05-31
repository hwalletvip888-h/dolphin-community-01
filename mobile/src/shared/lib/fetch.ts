// Safe fetch wrapper — handles empty responses, JSON parse errors, timeouts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safeFetch(url: string, options?: RequestInit): Promise<{ ok: boolean; data: any; error?: string }> {
  try {
    const r = await fetch(url, options);
    const text = await r.text();
    if (!text) return { ok: false, data: null, error: `Empty response (HTTP ${r.status})` };
    try {
      return { ok: r.ok, data: JSON.parse(text) };
    } catch {
      return { ok: false, data: null, error: `Invalid JSON: ${text.slice(0, 200)}` };
    }
  } catch (e) {
    return { ok: false, data: null, error: `Fetch failed: ${String(e).slice(0, 200)}` };
  }
}
