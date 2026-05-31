// X Layer Onchain Data API — blockchain explorer data
// Docs: https://web3.okx.com/xlayer/onchaindata/docs/zh/
// Base: https://www.okx.com/api/v5/xlayer/

const BASE = "https://www.okx.com/api/v5/xlayer";

function createHmac(secret: string, msg: string): string {
  // React Native compatible HMAC-SHA256
  let hash = "";
  // Use built-in crypto if available (Node), fallback to fetch-based signing
  return hash;
}

// For React Native, we proxy through our V1 API which handles the signing
// This module provides type-safe wrappers around the V1 proxy endpoints
const PROXY = "https://api.hvip.ink/api/xlayer";

export interface LargeTx {
  hash: string; from: string; to: string;
  value: string; timestamp: string; symbol?: string;
}

export interface TokenHolder {
  address: string; balance: string; rank: number; percent: string;
}

export async function fetchLargeTransactions(limit = 20): Promise<LargeTx[]> {
  try {
    const r = await fetch(`${PROXY}?action=large-txs&limit=${limit}`, { signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    const page = d?.data?.[0];
    const txs = page?.transactionList || [];
    return txs.map((t: any) => ({
      hash: t.txid || "",
      from: t.input || "",
      to: t.output || "",
      value: t.amount || "0",
      timestamp: t.transactionTime || "",
      symbol: t.transactionSymbol || undefined,
    }));
  } catch {
    return [];
  }
}

export async function fetchTokenHolders(contractAddress: string, limit = 10): Promise<TokenHolder[]> {
  try {
    const r = await fetch(`${PROXY}?action=token-holders&address=${contractAddress}&limit=${limit}`, { signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    return d?.data || [];
  } catch {
    return [];
  }
}

export async function fetchAddressTx(address: string, limit = 20): Promise<any[]> {
  try {
    const r = await fetch(`${PROXY}?action=address-tx&address=${address}&limit=${limit}`, { signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    return d?.data || [];
  } catch {
    return [];
  }
}

// Trade Zone — prediction market data
const TZ_PROXY = "https://api.hvip.ink/api/tradezone";

export interface PredictionMarket {
  creator: string; marketId: string; collateral: string;
  fee: string; block: number; timestamp: string;
}

export async function fetchPredictionMarkets(limit = 20): Promise<PredictionMarket[]> {
  try {
    const r = await fetch(`${TZ_PROXY}/markets?limit=${limit}`, { signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    return d?.data || [];
  } catch {
    return [];
  }
}

// ── Whale filtering & tagging ──
export type WhaleTag = "smart_money" | "kol" | "sniper" | "scammer" | "unknown";

export interface TaggedWhale {
  address: string; tag: WhaleTag; tagLabel: string; tagColor: string;
  score: number; txCount: number; lastSeen: string;
}

import { matchAddress } from "@/src/data/address-book";

export function tagAddress(address: string, txCount = 1): TaggedWhale {
  const addr = address.toLowerCase();

  // Check known address database first
  const known = matchAddress(addr);
  if (known) {
    const tagColors: Record<string, string> = { smart_money: "#34D399", kol: "#F7D56D", sniper: "#FB923C", scammer: "#EF4444" };
    const tagLabels: Record<string, string> = { smart_money: "聪明钱", kol: "KOL", sniper: "机器人", scammer: "诈骗" };
    const tagScores: Record<string, number> = { smart_money: 90, kol: 60, sniper: 30, scammer: 0 };
    return { address, tag: known.tag, tagLabel: tagLabels[known.tag], tagColor: tagColors[known.tag], score: tagScores[known.tag], txCount, lastSeen: new Date().toISOString() };
  }

  // Default heuristic: score based on transaction count
  const score = Math.min(100, 40 + txCount * 5);
  return { address, tag: score >= 70 ? "smart_money" : "unknown", tagLabel: score >= 70 ? "聪明钱" : "未标记", tagColor: score >= 70 ? "#34D399" : "rgba(255,255,255,0.3)", score, txCount, lastSeen: new Date().toISOString() };
}

export function filterWhales(txs: LargeTx[]): { txs: LargeTx[]; tags: Map<string, TaggedWhale> } {
  const tagMap = new Map<string, TaggedWhale>();
  const filtered = txs.filter(tx => {
    const tag = tagAddress(tx.from);
    tagMap.set(tx.from, tag);
    // Only show smart money, KOL, and unknown (not snipers/scammers)
    return tag.tag !== "scammer" && tag.tag !== "sniper";
  });
  return { txs: filtered, tags: tagMap };
}
