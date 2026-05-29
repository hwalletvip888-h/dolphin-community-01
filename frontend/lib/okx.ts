import { createHmac } from "crypto";

const API_BASE = "https://web3.okx.com";
const API_KEY = process.env.OKX_API_KEY || "";
const SECRET_KEY = process.env.OKX_SECRET_KEY || "";
const PASSPHRASE = process.env.OKX_PASSPHRASE || "";
const PROJECT_ID = process.env.OKX_PROJECT_ID || "";

function sign(
  timestamp: string,
  method: string,
  path: string,
  body: string,
): string {
  const prehash = timestamp + method + path + body;
  return createHmac("sha256", SECRET_KEY).update(prehash).digest("base64");
}

function headers(
  method: string,
  path: string,
  body: string,
): Record<string, string> {
  const ts = new Date().toISOString();
  return {
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": API_KEY,
    "OK-ACCESS-SIGN": sign(ts, method, path, body),
    "OK-ACCESS-PASSPHRASE": PASSPHRASE,
    "OK-ACCESS-TIMESTAMP": ts,
    "OK-ACCESS-PROJECT-ID": PROJECT_ID,
  };
}

async function okxGet<T = unknown>(
  path: string,
  timeoutMs = 10_000,
): Promise<{ ok: boolean; data: T; error?: string }> {
  const url = API_BASE + path;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, {
      method: "GET",
      headers: headers("GET", path, ""),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const text = await r.text();
    if (!text) return { ok: false, data: null as T, error: `Empty response (${r.status})` };
    const json = JSON.parse(text);
    if (json.code !== "0" && json.code !== 0) {
      return { ok: false, data: null as T, error: json.msg || `OKX error code=${json.code}` };
    }
    return { ok: true, data: json.data ?? json };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, data: null as T, error: "Request timeout" };
    }
    return { ok: false, data: null as T, error: String(e).slice(0, 300) };
  }
}

async function okxPost<T = unknown>(
  path: string,
  body: unknown,
  timeoutMs = 10_000,
): Promise<{ ok: boolean; data: T; error?: string }> {
  const url = API_BASE + path;
  const raw = JSON.stringify(body);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, {
      method: "POST",
      headers: headers("POST", path, raw),
      body: raw,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const text = await r.text();
    if (!text) return { ok: false, data: null as T, error: `Empty response (${r.status})` };
    const json = JSON.parse(text);
    if (json.code !== "0" && json.code !== 0) {
      return { ok: false, data: null as T, error: json.msg || `OKX error code=${json.code}` };
    }
    return { ok: true, data: json.data ?? json };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, data: null as T, error: "Request timeout" };
    }
    return { ok: false, data: null as T, error: String(e).slice(0, 300) };
  }
}

// ────────────────────────────────────
// Market API
// ────────────────────────────────────

export interface OKXTokenItem {
  chainIndex: string;
  protocolId: string;
  tokenContractAddress: string;
  symbol: string;
  name: string;
  logoUrl: string;
  createdTimestamp: string;
  market: {
    marketCapUsd: string;
    volumeUsd1h: string;
    txCount1h: string;
    buyTxCount1h: string;
    sellTxCount1h: string;
  };
  bondingPercent: string;
  tags: {
    top10HoldingsPercent: string;
    devHoldingsPercent: string;
    insidersPercent: string;
    bundlersPercent: string;
    snipersPercent: string;
    freshWalletsPercent: string;
    suspectedPhishingWalletPercent: string;
    totalHolders: string;
  };
  social: {
    x: string;
    telegram: string;
    website: string;
    dexScreenerPaid: boolean;
    communityTakeover: boolean;
    liveOnPumpFun: boolean;
  };
  creatorAddress: string;
  aped: string;
}

export interface OKXTokenListResult {
  cursor: string;
  items: OKXTokenItem[];
}

export interface OKXPriceResult {
  chainIndex: string;
  tokenContractAddress: string;
  time: string;
  price: string;
}

// ────────────────────────────────────
// Wallet / Balance API
// ────────────────────────────────────

export interface OKXTokenAsset {
  chainIndex: string;
  tokenContractAddress: string;
  address: string;
  symbol: string;
  balance: string;
  rawBalance: string;
  tokenPrice: string;
  isRiskToken: boolean;
}

export interface OKXTotalValueResult {
  totalValue: string;
}

export interface OKXTxRecord {
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
  itype: string;
}

// ────────────────────────────────────
// DEX Aggregator API
// ────────────────────────────────────

export interface OKXQuoteParams {
  chainIndex: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  slippage?: string;
  feePercent?: string;
}

export interface OKXQuoteResult {
  chainIndex: string;
  fromToken: { symbol: string; decimals: string; tokenContractAddress: string };
  toToken: { symbol: string; decimals: string; tokenContractAddress: string };
  fromTokenAmount: string;
  toTokenAmount: string;
  priceImpactPercent: string;
  estimateGasFee: string;
  dexRouterList: { name: string }[];
}

export interface OKXSwapDataResult {
  routerResult: unknown;
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas?: string;
    gasPrice?: string;
  };
}

export interface OKXBroadcastResult {
  orderId: string;
  txHash: string;
}

// ────────────────────────────────────
// DeFi Product API
// ────────────────────────────────────

export interface OKXDeFiProduct {
  investmentId: number;
  name: string;
  platformName: string;
  rate: string;
  tvl: string;
  chainIndex: string;
  productGroup: string;
}

export interface OKXDeFiProductDetail {
  investmentId: number;
  investmentName: string;
  platformName: string;
  platformLogo: string;
  chainIndex: string;
  network: string;
  rate: string;
  rateTypeDesc: string;
  tvl: string;
  isInvestable: boolean;
  isSupportRedeem: boolean;
  isSupportClaim: boolean;
  underlyingToken: { tokenSymbol: string; tokenAddress: string; tokenLogo?: string }[];
  rateDetails: { rate: string; title: string }[];
  aboutToken: { tokenSymbol: string; price: string; marketCap: string }[];
}

// ── Hot Tokens / Ranking ────────────────────

export interface OKXHotToken {
  chainIndex: string;
  tokenSymbol: string;
  tokenLogoUrl: string;
  tokenContractAddress: string;
  price: string;
  change: string;
  volume: string;
  marketCap: string;
  liquidity: string;
  holders: string;
  uniqueTraders: string;
  txs: string;
  txsBuy: string;
  txsSell: string;
  inflowUsd: string;
  riskLevelControl: string;
  devHoldPercent: string;
  top10HoldPercent: string;
  insiderHoldPercent: string;
  bundleHoldPercent: string;
  vibeScore: string;
  mentionsCount: string;
}

export interface OKXHolderInfo {
  holderWalletAddress: string;
  holdAmount: string;
  holdPercent: string;
  nativeTokenBalance: string;
  boughtAmount: string;
  avgBuyPrice: string;
  totalSellAmount: string;
  avgSellPrice: string;
  totalPnlUsd: string;
  realizedPnlUsd: string;
  unrealizedPnlUsd: string;
  fundingSource: string;
}

export interface OKXTopTrader {
  holderWalletAddress: string;
  holdAmount: string;
  holdPercent: string;
  nativeTokenBalance: string;
  boughtAmount: string;
  avgBuyPrice: string;
  soldAmount: string;
  avgSellPrice: string;
  totalPnlUsd: string;
  realizedPnlUsd: string;
  unrealizedPnlUsd: string;
  fundingSource: string;
}

// ────────────────────────────────────
// Exported Methods
// ────────────────────────────────────

interface OKXHotTokenParams {
  rankingType: "4" | "5";
  chainIndex?: string;
  rankBy?: string;
  rankingTimeFrame?: "1" | "2" | "3" | "4";
  riskFilter?: boolean;
  limit?: string;
}

const okx = {
  // Market
  getTokenList(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    return okxGet<OKXTokenItem[]>(`/api/v6/dex/market/memepump/tokenList?${qs}`);
  },
  searchTokens(options: { chains: string; search: string; cursor?: string; limit?: string }) {
    const qs = new URLSearchParams({ chains: options.chains, search: options.search });
    if (options.cursor) qs.set("cursor", options.cursor);
    if (options.limit) qs.set("limit", options.limit);
    return okxGet<unknown[]>(`/api/v6/dex/market/token/search?${qs}`);
  },
  getPrices(tokens: { chainIndex: string; tokenContractAddress: string }[]) {
    return okxPost<OKXPriceResult[]>("/api/v6/dex/market/price", tokens);
  },

  // Balance
  getTotalValue(address: string, chains: string) {
    return okxGet<OKXTotalValueResult[]>(
      `/api/v6/dex/balance/total-value-by-address?address=${address}&chains=${chains}`,
    );
  },
  getAllTokenBalances(address: string, chains: string, excludeRisk = true) {
    const risk = excludeRisk ? "0" : "1";
    return okxGet<{ tokenAssets: OKXTokenAsset[] }[]>(
      `/api/v6/dex/balance/all-token-balances-by-address?address=${address}&chains=${chains}&excludeRiskToken=${risk}`,
    );
  },
  getTxHistory(params: {
    address: string;
    chains: string;
    tokenContractAddress?: string;
    begin?: string;
    end?: string;
    cursor?: string;
    limit?: string;
  }) {
    const qs = new URLSearchParams({ address: params.address, chains: params.chains });
    if (params.tokenContractAddress) qs.set("tokenContractAddress", params.tokenContractAddress);
    if (params.begin) qs.set("begin", params.begin);
    if (params.end) qs.set("end", params.end);
    if (params.cursor) qs.set("cursor", params.cursor);
    if (params.limit) qs.set("limit", params.limit);
    return okxGet<{ cursor: string; transactions: OKXTxRecord[] }[]>(
      `/api/v6/dex/post-transaction/transactions-by-address?${qs}`,
    );
  },

  // DEX Aggregator
  getQuote(params: OKXQuoteParams) {
    const qs = new URLSearchParams({
      chainIndex: params.chainIndex,
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      amount: params.amount,
    });
    if (params.slippage) qs.set("slippage", params.slippage);
    if (params.feePercent) qs.set("feePercent", params.feePercent);
    return okxGet<OKXQuoteResult>(`/api/v6/dex/aggregator/quote?${qs}`);
  },
  getSwapData(params: {
    chainIndex: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    userWalletAddress: string;
    slippagePercent: string;
    feePercent?: string;
  }) {
    const qs = new URLSearchParams({
      chainIndex: params.chainIndex,
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      amount: params.amount,
      userWalletAddress: params.userWalletAddress,
      slippagePercent: params.slippagePercent,
    });
    if (params.feePercent) qs.set("feePercent", params.feePercent);
    return okxGet<OKXSwapDataResult>(`/api/v6/dex/aggregator/swap?${qs}`);
  },
  broadcastTx(signedTx: string, chainIndex: string, address: string, enableMevProtection = false) {
    const body: Record<string, unknown> = {
      chainIndex,
      address,
      signedTx,
      extraData: JSON.stringify({ enableMevProtection }),
    };
    return okxPost<OKXBroadcastResult[]>(
      "/api/v6/dex/pre-transaction/broadcast-transaction",
      body,
    );
  },
  getOrderStatus(orderId: string, chainIndex: string) {
    return okxGet<unknown[]>(
      `/api/v6/dex/pre-transaction/orders?orderId=${orderId}&chainIndex=${chainIndex}`,
    );
  },
  simulateTx(tx: {
    chainIndex: string;
    fromAddress: string;
    toAddress: string;
    txAmount?: string;
    inputData?: string;
    gasPrice?: string;
  }) {
    return okxPost<unknown>("/api/v6/dex/pre-transaction/simulate-transaction", tx);
  },

  // DeFi
  searchDeFiProducts(params: {
    tokenKeywordList: string[];
    platformKeywordList?: string[];
    chainIndex?: string;
    productGroup?: string;
    pageNum?: number;
  }) {
    return okxPost<{ total: number; list: OKXDeFiProduct[] }>(
      "/api/v6/defi/product/search",
      params,
    );
  },
  getDeFiProductDetail(investmentId: number) {
    return okxGet<OKXDeFiProductDetail>(
      `/api/v6/defi/product/detail?investmentId=${investmentId}`,
    );
  },

  // ── Hot Tokens / Ranking ─────────────────────

  getHotTokens(params: OKXHotTokenParams) {
    const qs = new URLSearchParams({ rankingType: params.rankingType });
    if (params.chainIndex) qs.set("chainIndex", params.chainIndex);
    if (params.rankBy) qs.set("rankBy", params.rankBy);
    if (params.rankingTimeFrame) qs.set("rankingTimeFrame", params.rankingTimeFrame);
    if (params.riskFilter !== undefined) qs.set("riskFilter", String(params.riskFilter));
    if (params.limit) qs.set("limit", params.limit);
    return okxGet<OKXHotToken[]>(`/api/v6/dex/market/token/hot-token?${qs}`);
  },

  // ── Token Holder Analysis ────────────────────

  getTokenHolders(chainIndex: string, tokenContractAddress: string, tagFilter?: string, limit?: string) {
    const qs = new URLSearchParams({ chainIndex, tokenContractAddress });
    if (tagFilter) qs.set("tagFilter", tagFilter);
    if (limit) qs.set("limit", limit);
    return okxGet<OKXHolderInfo[]>(`/api/v6/dex/market/token/holder?${qs}`);
  },

  getTokenTopTraders(chainIndex: string, tokenContractAddress: string, tagFilter?: string, limit?: string) {
    const qs = new URLSearchParams({ chainIndex, tokenContractAddress });
    if (tagFilter) qs.set("tagFilter", tagFilter);
    if (limit) qs.set("limit", limit);
    return okxGet<OKXTopTrader[]>(`/api/v6/dex/market/token/top-trader?${qs}`);
  },
};

export default okx;
