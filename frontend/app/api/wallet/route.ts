import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { safeFetch } from "@/lib/fetch";
import okx from "@/lib/okx";

const MCP = process.env.MCP_API_URL || "";
const MCP_API_KEY = process.env.MCP_API_KEY || "";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(`wallet:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "请求太频繁" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action, email, code, force, to, amount, tokenSymbol, chainIndex, fromToken, toToken, user_id, address, chains, excludeRiskToken } = body;
    const auth = req.headers.get("Authorization") || "";
    const mcpHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) mcpHeaders["Authorization"] = auth;
    if (MCP_API_KEY) mcpHeaders["X-API-Key"] = MCP_API_KEY;

    // Build auth headers (X-API-Key for MCP, JWT for user)
    const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (MCP_API_KEY) authHeaders["X-API-Key"] = MCP_API_KEY;

    // ── Auth (still via MCP) ──────────────────────────
    if (action === "login") {
      if (!email) return NextResponse.json({ ok: false, message: "请输入邮箱地址" }, { status: 400 });
      const url = force ? `${MCP}/api/h/v1/wallet/login?force=true` : `${MCP}/api/h/v1/wallet/login`;
      const { data } = await safeFetch(url, {
        method: "POST", headers: authHeaders,
        body: JSON.stringify({ email }), signal: AbortSignal.timeout(15000),
      });
      return NextResponse.json(data || { ok: false, message: "登录服务异常" });
    }

    if (action === "verify") {
      if (!code) return NextResponse.json({ ok: false, message: "请输入验证码" }, { status: 400 });
      const { data } = await safeFetch(`${MCP}/api/h/v1/wallet/verify`, {
        method: "POST", headers: authHeaders,
        body: JSON.stringify({ code, email: email || "", user_id: user_id || "" }), signal: AbortSignal.timeout(15000),
      });
      return NextResponse.json(data || { ok: false, message: "验证服务异常" });
    }

    // ── Wallet status (still MCP — returns addresses) ──
    if (action === "status") {
      const { data } = await safeFetch(`${MCP}/api/h/v1/wallet/status`, { headers: mcpHeaders, signal: AbortSignal.timeout(10000) });
      return NextResponse.json(data || { ok: false, logged_in: false });
    }

    if (action === "addresses") {
      const { data } = await safeFetch(`${MCP}/api/h/v1/wallet/addresses`, { headers: mcpHeaders, signal: AbortSignal.timeout(10000) });
      return NextResponse.json(data || { ok: false, addresses: null });
    }

    // ── Transfers (still MCP — Agent Wallet TEE signing) ─
    if (action === "send") {
      if (!to || !amount) return NextResponse.json({ ok: false, error: "缺少地址或金额" }, { status: 400 });
      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) return NextResponse.json({ ok: false, error: "金额不合法" }, { status: 400 });
      if (!/^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(String(to).trim())) {
        return NextResponse.json({ ok: false, error: "地址格式不正确" }, { status: 400 });
      }
      const { data, error } = await safeFetch(`${MCP}/api/h/v1/wallet/send`, {
        method: "POST", headers: mcpHeaders,
        body: JSON.stringify({ to, amount: String(amount), tokenSymbol, chainIndex }),
        signal: AbortSignal.timeout(60000),
      });
      if (error) console.error("[wallet] send error:", error);
      return NextResponse.json(data || { ok: false, error: error || "转账失败" });
    }

    if (action === "swap") {
      if (!amount) return NextResponse.json({ ok: false, error: "请输入金额" }, { status: 400 });
      const swapAmt = Number(amount);
      if (isNaN(swapAmt) || swapAmt <= 0) return NextResponse.json({ ok: false, error: "金额不合法" }, { status: 400 });
      const { data, error } = await safeFetch(`${MCP}/api/h/v1/dex/swap`, {
        method: "POST", headers: mcpHeaders,
        body: JSON.stringify({ fromToken, toToken, amount: String(amount), chainIndex }),
        signal: AbortSignal.timeout(60000),
      });
      if (error) console.error("[wallet] swap error:", error);
      return NextResponse.json(data || { ok: false, error: error || "兑换失败" });
    }

    // ── Balance — OKX Wallet API (direct) ──────────────
    if (action === "totalValue") {
      if (!address || !chains) return NextResponse.json({ ok: false, message: "缺少地址或链参数" }, { status: 400 });
      const { ok, data, error } = await okx.getTotalValue(address, chains);
      if (!ok || !data?.[0]) return NextResponse.json({ ok: false, message: error || "查询失败" });
      return NextResponse.json({ ok: true, totalValue: data[0].totalValue });
    }

    if (action === "balance") {
      if (!address || !chains) return NextResponse.json({ ok: false, message: "缺少地址或链参数" }, { status: 400 });
      const { ok, data, error } = await okx.getAllTokenBalances(address, chains, excludeRiskToken !== false);
      if (!ok || !data?.[0]) return NextResponse.json({ ok: false, message: error || "查询失败" });
      const assets = data[0].tokenAssets || [];
      // Compute total
      const total = assets.reduce((sum, a) => sum + parseFloat(a.tokenPrice || "0") * parseFloat(a.balance || "0"), 0);
      return NextResponse.json({
        ok: true,
        tokens: assets.map(a => ({
          chain: a.chainIndex,
          symbol: a.symbol,
          balance: a.balance,
          usd: a.tokenPrice,
          value: String(parseFloat(a.tokenPrice || "0") * parseFloat(a.balance || "0")),
          address: a.tokenContractAddress,
          isRiskToken: a.isRiskToken,
        })),
        total: String(total),
      });
    }

    // ── Tx history — OKX Wallet API (direct) ────────────
    if (action === "history") {
      if (!address || !chains) return NextResponse.json({ ok: false, message: "缺少地址或链参数" }, { status: 400 });
      const { begin, end, limit } = body;
      const { ok, data, error } = await okx.getTxHistory({
        address,
        chains,
        begin: begin || undefined,
        end: end || undefined,
        limit: limit || "20",
      });
      if (!ok || !data?.[0]) return NextResponse.json({ ok: false, message: error || "查询失败" });
      return NextResponse.json({
        ok: true,
        transactions: data[0].transactions || [],
        cursor: data[0].cursor,
      });
    }

    // ── External address lookup (any address, not just user) ─
    if (action === "lookup") {
      if (!address || !chains) return NextResponse.json({ ok: false, message: "缺少地址或链参数" }, { status: 400 });
      const [totalR, balanceR] = await Promise.all([
        okx.getTotalValue(address, chains),
        okx.getAllTokenBalances(address, chains, true),
      ]);
      return NextResponse.json({
        ok: true,
        address,
        totalValue: totalR.data?.[0]?.totalValue || "0",
        tokens: (balanceR.data?.[0]?.tokenAssets || []).map(a => ({
          chain: a.chainIndex,
          symbol: a.symbol,
          balance: a.balance,
          usd: a.tokenPrice,
          address: a.tokenContractAddress,
          isRiskToken: a.isRiskToken,
        })),
      });
    }

    // ── DeFi — OKX DeFi Product API ────────────────────
    if (action === "defiSearch") {
      const { tokenKeywordList, platformKeywordList, chainIndex: defiChain, productGroup, pageNum } = body;
      if (!tokenKeywordList?.length) return NextResponse.json({ ok: false, message: "请提供代币关键词" }, { status: 400 });
      const { ok, data, error } = await okx.searchDeFiProducts({
        tokenKeywordList,
        platformKeywordList: platformKeywordList || undefined,
        chainIndex: defiChain || undefined,
        productGroup: productGroup || undefined,
        pageNum: pageNum || 1,
      });
      if (!ok) return NextResponse.json({ ok: false, message: error || "查询失败" });
      return NextResponse.json({ ok: true, ...data });
    }

    if (action === "defiDetail") {
      const { investmentId } = body;
      if (!investmentId) return NextResponse.json({ ok: false, message: "缺少 investmentId" }, { status: 400 });
      const { ok, data, error } = await okx.getDeFiProductDetail(investmentId);
      if (!ok) return NextResponse.json({ ok: false, message: error || "查询失败" });
      return NextResponse.json({ ok: true, detail: data });
    }

    return NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[wallet] error:", e);
    return NextResponse.json({ ok: false, message: "服务异常，请稍后重试" }, { status: 500 });
  }
}
