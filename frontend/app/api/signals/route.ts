import { NextRequest, NextResponse } from "next/server";
import okx from "@/lib/okx";

// Cache TTLs in ms
const LIST_TTL = 30_000;       // 30s — token list
const PRICE_TTL = 10_000;      // 10s — prices

const listCache = new Map<string, { data: SignalItem[]; ts: number }>();
const priceCache = new Map<string, { data: PriceMap; ts: number }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cacheGet(cache: Map<string, any>, key: string, ttl: number) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cacheSet(cache: Map<string, any>, key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

// ── Token list ──────────────────────────────────────────

interface SignalItem {
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
  // Security tags — 0–100 percentages
  security: {
    top10Holdings: number;
    devHoldings: number;
    insiders: number;
    bundlers: number;
    snipers: number;
    freshWallets: number;
    phishing: number;
  };
  // Risk flags
  flags: {
    riskToken: boolean;
    devSoldAll?: boolean;
    communityTakeover: boolean;
    dexScreenerPaid: boolean;
    liveOnPumpFun: boolean;
  };
  // Social
  social: {
    x?: string;
    telegram?: string;
    website?: string;
  };
  bondingPercent: string;
  creatorAddress: string;
}

async function fetchTokenList(chain: string, stage: string): Promise<SignalItem[]> {
  const cacheKey = `list:${chain}:${stage}`;
  const cached = cacheGet(listCache, cacheKey, LIST_TTL);
  if (cached) return cached as SignalItem[];

  const params: Record<string, string> = { chainIndex: chain, stage, sort: "createdTimestamp", order: "desc" };
  const { ok, data } = await okx.getTokenList(params);
  if (!ok || !Array.isArray(data)) return [];

  const items: SignalItem[] = data.map((t) => ({
    chainIndex: t.chainIndex,
    symbol: t.symbol,
    name: t.name,
    logo: t.logoUrl || "",
    volume1h: t.market?.volumeUsd1h || "0",
    buyTx1h: t.market?.buyTxCount1h || "0",
    sellTx1h: t.market?.sellTxCount1h || "0",
    holders: t.tags?.totalHolders || "0",
    marketCap: t.market?.marketCapUsd || "0",
    created: t.createdTimestamp || "",
    security: {
      top10Holdings: parseFloat(t.tags?.top10HoldingsPercent || "0"),
      devHoldings: parseFloat(t.tags?.devHoldingsPercent || "0"),
      insiders: parseFloat(t.tags?.insidersPercent || "0"),
      bundlers: parseFloat(t.tags?.bundlersPercent || "0"),
      snipers: parseFloat(t.tags?.snipersPercent || "0"),
      freshWallets: parseFloat(t.tags?.freshWalletsPercent || "0"),
      phishing: parseFloat(t.tags?.suspectedPhishingWalletPercent || "0"),
    },
    flags: {
      riskToken: false, // determined by additional check
      communityTakeover: t.social?.communityTakeover || false,
      dexScreenerPaid: t.social?.dexScreenerPaid || false,
      liveOnPumpFun: t.social?.liveOnPumpFun || false,
    },
    social: {
      x: t.social?.x || undefined,
      telegram: t.social?.telegram || undefined,
      website: t.social?.website || undefined,
    },
    bondingPercent: t.bondingPercent || "0",
    creatorAddress: t.creatorAddress || "",
  }));

  cacheSet(listCache, cacheKey, items);
  return items;
}

// ── Prices — batch fetch for display ────────────────────

interface PriceMap {
  [key: string]: string;
}

async function fetchPrices(addresses: { chainIndex: string; tokenContractAddress: string }[]): Promise<PriceMap> {
  if (!addresses.length) return {};
  const cacheKey = `prices:${addresses.map(a => `${a.chainIndex}:${a.tokenContractAddress}`).sort().join(",")}`;
  const cached = cacheGet(priceCache, cacheKey, PRICE_TTL);
  if (cached) return cached as PriceMap;

  const { ok, data } = await okx.getPrices(addresses);
  if (!ok || !Array.isArray(data)) return {};

  const map: PriceMap = {};
  for (const p of data) {
    map[`${p.chainIndex}:${p.tokenContractAddress}`] = p.price;
  }
  cacheSet(priceCache, cacheKey, map);
  return map;
}

// ── Main handler ────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const [solNew, solMigrating, solMigrated] = await Promise.all([
      fetchTokenList("501", "NEW"),
      fetchTokenList("501", "MIGRATING"),
      fetchTokenList("501", "MIGRATED"),
    ]);

    // Deduplicate by contract address
    const seen = new Set<string>();
    const all: SignalItem[] = [];
    for (const s of [...solNew, ...solMigrated, ...solMigrating]) {
      const key = `${s.chainIndex}:${s.symbol}`;
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(s);
    }

    // Sort: NEW first (hottest), then by volume
    all.sort((a, b) => {
      if (a.bondingPercent !== b.bondingPercent) return parseFloat(b.bondingPercent) - parseFloat(a.bondingPercent);
      return parseFloat(b.volume1h) - parseFloat(a.volume1h);
    });

    // Batch fetch prices for top items
    const top = all.slice(0, 20);
    const priceAddresses = top
      .filter(s => s.symbol)
      .map(s => ({ chainIndex: s.chainIndex, tokenContractAddress: s.symbol }));
    const prices = await fetchPrices(priceAddresses);

    for (const s of top) {
      const key = `${s.chainIndex}:${s.symbol}`;
      if (prices[key]) s.price = prices[key];
    }

    // Score security: higher = safer
    const topWithScore = top.map(s => {
      const sec = s.security;
      // Lower concentrations and lower bot ratios = safer
      const riskScore = (
        sec.top10Holdings * 0.3 +
        sec.devHoldings * 0.2 +
        sec.insiders * 0.2 +
        sec.bundlers * 0.1 +
        sec.snipers * 0.1 +
        sec.freshWallets * 0.05 +
        sec.phishing * 0.05
      );
      return { ...s, securityScore: Math.max(0, Math.min(100, 100 - riskScore)) };
    });

    return NextResponse.json({
      signals: topWithScore,
      total: topWithScore.length,
      source: "OKX Market API",
    });
  } catch (e) {
    console.error("[signals] error:", e);
    return NextResponse.json({ signals: [], total: 0, error: String(e) });
  }
}
