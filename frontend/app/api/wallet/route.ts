import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { safeFetch } from "@/lib/fetch";

const MCP = process.env.MCP_API_URL || "";
const MCP_API_KEY = process.env.MCP_API_KEY || "";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(`wallet:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "请求太频繁" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const { action, email, code, force, to, amount, tokenSymbol, chainIndex, fromToken, toToken, user_id } = body;
    const auth = req.headers.get("Authorization") || "";
    const mcpHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) mcpHeaders["Authorization"] = auth;
    if (MCP_API_KEY) mcpHeaders["X-API-Key"] = MCP_API_KEY;

    if (action === "login") {
      if (!email) return NextResponse.json({ ok: false, message: "请输入邮箱地址" }, { status: 400 });
      const url = force ? `${MCP}/wallet/login?force=true` : `${MCP}/wallet/login`;
      const { data } = await safeFetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }), signal: AbortSignal.timeout(15000),
      });
      return NextResponse.json(data || { ok: false, message: "登录服务异常" });
    }

    if (action === "verify") {
      if (!code) return NextResponse.json({ ok: false, message: "请输入验证码" }, { status: 400 });
      const { data } = await safeFetch(`${MCP}/wallet/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email: email || "", user_id: user_id || "" }), signal: AbortSignal.timeout(15000),
      });
      return NextResponse.json(data || { ok: false, message: "验证服务异常" });
    }

    if (action === "send") {
      if (!to || !amount) return NextResponse.json({ ok: false, error: "缺少地址或金额" }, { status: 400 });
      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) return NextResponse.json({ ok: false, error: "金额不合法" }, { status: 400 });
      // Basic address format check (EVM 0x... or Solana base58)
      if (!/^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(String(to).trim())) {
        return NextResponse.json({ ok: false, error: "地址格式不正确" }, { status: 400 });
      }
      const { ok, data, error } = await safeFetch(`${MCP}/wallet/send`, {
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
      const { ok, data, error } = await safeFetch(`${MCP}/dex/swap`, {
        method: "POST", headers: mcpHeaders,
        body: JSON.stringify({ fromToken, toToken, amount: String(amount), chainIndex }),
        signal: AbortSignal.timeout(60000),
      });
      if (error) console.error("[wallet] swap error:", error);
      return NextResponse.json(data || { ok: false, error: error || "兑换失败" });
    }

    if (action === "status") {
      const { data } = await safeFetch(`${MCP}/wallet/status`, { headers: mcpHeaders, signal: AbortSignal.timeout(10000) });
      return NextResponse.json(data || { ok: false, logged_in: false });
    }

    if (action === "balance") {
      const { data } = await safeFetch(`${MCP}/wallet/balance`, { headers: mcpHeaders, signal: AbortSignal.timeout(15000) });
      return NextResponse.json(data || { ok: false, balance: null });
    }

    if (action === "addresses") {
      const { data } = await safeFetch(`${MCP}/wallet/addresses`, { headers: mcpHeaders, signal: AbortSignal.timeout(10000) });
      return NextResponse.json(data || { ok: false, addresses: null });
    }

    if (action === "history") {
      const { chain, limit } = body;
      const qs = [chain ? `chain=${chain}` : "", limit ? `limit=${limit}` : "limit=10"].filter(Boolean).join("&");
      const { data } = await safeFetch(`${MCP}/wallet/history?${qs}`, { headers: mcpHeaders, signal: AbortSignal.timeout(15000) });
      return NextResponse.json(data || { ok: false, history: [] });
    }

    return NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[wallet] error:", e);
    return NextResponse.json({ ok: false, message: "服务异常，请稍后重试" }, { status: 500 });
  }
}
