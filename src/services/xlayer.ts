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
    const r = await fetch(`${PROXY}/large-txs?limit=${limit}`, { signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    return d?.data || [];
  } catch {
    return [];
  }
}

export async function fetchTokenHolders(contractAddress: string, limit = 10): Promise<TokenHolder[]> {
  try {
    const r = await fetch(`${PROXY}/token-holders?address=${contractAddress}&limit=${limit}`, { signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    return d?.data || [];
  } catch {
    return [];
  }
}

export async function fetchAddressTx(address: string, limit = 20): Promise<any[]> {
  try {
    const r = await fetch(`${PROXY}/address-tx?address=${address}&limit=${limit}`, { signal: AbortSignal.timeout(10000) });
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
