import { NextRequest, NextResponse } from "next/server";
import { safeFetch } from "@/lib/fetch";

const MCP = process.env.MCP_API_URL || "";

// Cache kline data for 5 minutes to avoid rate limits
const klineCache = new Map<string, { data: number[]; ts: number }>();

async function getSparkline(symbol: string): Promise<number[]> {
  const key = symbol.toUpperCase();
  const cached = klineCache.get(key);
  if (cached && Date.now() - cached.ts < 300000) return cached.data;
  try {
    const { data } = await safeFetch(`${MCP}/market/kline/${key}?timeframe=15m&limit=20`, { signal: AbortSignal.timeout(5000) });
    const candles = (data as { candles?: number[][] })?.candles || [];
    const prices = candles.map((c: number[]) => c[4]); // close price
    if (prices.length) {
      klineCache.set(key, { data: prices, ts: Date.now() });
      return prices;
    }
  } catch { /* fall through */ }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const [ethRes, solRes] = await Promise.all([
      safeFetch(`${MCP}/signals/smart-money?chain=ethereum&limit=30`, { signal: AbortSignal.timeout(15000) }),
      safeFetch(`${MCP}/signals/smart-money?chain=solana&limit=10`, { signal: AbortSignal.timeout(15000) }),
    ]);

    const ethSignals = (ethRes.data as Record<string, unknown>)?.signals as Array<Record<string, unknown>> || [];
    const solSignals = (solRes.data as Record<string, unknown>)?.signals as Array<Record<string, unknown>> || [];
    const allSignals = [...ethSignals, ...solSignals];

    // Fetch real klines for sparklines (batch, non-blocking)
    const symbols = [...new Set(allSignals.map(s => {
      const tk = s.token as Record<string, unknown> | undefined;
      return ((tk?.symbol as string) || "").toUpperCase();
    }).filter(Boolean))];
    const sparklineMap = new Map<string, number[]>();
    await Promise.all(symbols.slice(0, 10).map(async (sym) => {
      sparklineMap.set(sym, await getSparkline(sym));
    }));

    const signals = allSignals.map((s) => {
      const tk = s.token as Record<string, unknown> | undefined;
      const symbol = (tk?.symbol as string || s.symbol as string || "?").slice(0, 12);
      const name = (tk?.name as string || symbol).slice(0, 20);
      const logo = (tk?.logo as string) || "";
      const mc = Number(tk?.marketCapUsd || s.price || 0);
      const mcStr = mc > 1e9 ? `$${(mc/1e9).toFixed(2)}B` : mc > 1e6 ? `$${(mc/1e6).toFixed(2)}M` : `$${mc.toLocaleString()}`;
      const amt = Number(s.amountUsd || 0);
      const volStr = amt > 1000 ? `$${(amt/1000).toFixed(1)}K` : `$${amt.toFixed(0)}`;
      const ratio = Number(s.soldRatioPercent || 0);
      const action = ratio > 80 ? "大量卖出" : ratio > 50 ? "减仓" : ratio > 0 ? "部分卖出" : "买入";
      const wt = Number(s.walletType || 0);
      const whale = wt === 1 ? "聪明钱" : wt === 2 ? "KOL" : wt === 3 ? "巨鲸" : "信号";
      const ts = Number(s.timestamp || 0);
      const mins = ts ? Math.floor((Date.now() - ts) / 60000) : 0;
      const time = mins < 1 ? "刚刚" : mins < 60 ? `${mins}分` : `${Math.floor(mins/60)}时`;
      const sparkline = sparklineMap.get(symbol.toUpperCase()) || [];
      return { symbol, name, logo, price: mcStr, mc: mcStr, volume: volStr, whale, action, time, sparkline };
    });

    const seen = new Set<string>();
    const unique = signals.filter((s) => { if (seen.has(s.symbol)) return false; seen.add(s.symbol); return true; });

    const trading = unique.filter((s) => s.whale !== "信号").slice(0, 8);
    const tradingSymbols = new Set(trading.map(s => s.symbol));
    const scanning = unique.filter((s) => !tradingSymbols.has(s.symbol));

    return NextResponse.json({
      signals: unique.slice(0, 20),
      trading: trading.length ? trading : unique.slice(0, 6),
      scanning: scanning.length ? scanning : unique.slice(6),
      source: "OnchainOS",
    });
  } catch (e) {
    return NextResponse.json({ signals: [], trading: [], scanning: [], error: String(e) });
  }
}
