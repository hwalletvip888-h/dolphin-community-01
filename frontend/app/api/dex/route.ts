import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import okx from "@/lib/okx";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(`dex:${ip}`, 15, 60_000)) {
    return NextResponse.json({ ok: false, message: "请求太频繁，请稍后再试" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ── Quote ──────────────────────────────────────────
    if (action === "quote") {
      const { chainIndex, fromTokenAddress, toTokenAddress, amount, slippage, feePercent } = body;
      if (!chainIndex || !fromTokenAddress || !toTokenAddress || !amount) {
        return NextResponse.json({ ok: false, message: "缺少必填参数" }, { status: 400 });
      }
      const { ok, data, error } = await okx.getQuote({
        chainIndex,
        fromTokenAddress,
        toTokenAddress,
        amount,
        slippage: slippage || "0.005",
        feePercent: feePercent || undefined,
      });
      if (!ok || !data) return NextResponse.json({ ok: false, message: error || "报价失败" });
      return NextResponse.json({ ok: true, quote: data });
    }

    // ── Swap data (unsigned tx) ─────────────────────────
    if (action === "swapData") {
      const { chainIndex, fromTokenAddress, toTokenAddress, amount, userWalletAddress, slippagePercent, feePercent } = body;
      if (!chainIndex || !fromTokenAddress || !toTokenAddress || !amount || !userWalletAddress) {
        return NextResponse.json({ ok: false, message: "缺少必填参数" }, { status: 400 });
      }
      const { ok, data, error } = await okx.getSwapData({
        chainIndex,
        fromTokenAddress,
        toTokenAddress,
        amount,
        userWalletAddress,
        slippagePercent: slippagePercent || "0.005",
        feePercent: feePercent || undefined,
      });
      if (!ok || !data) return NextResponse.json({ ok: false, message: error || "获取交易数据失败" });
      return NextResponse.json({ ok: true, swapData: data });
    }

    // ── Broadcast signed tx ────────────────────────────
    if (action === "broadcast") {
      const { signedTx, chainIndex, address, enableMevProtection } = body;
      if (!signedTx || !chainIndex || !address) {
        return NextResponse.json({ ok: false, message: "缺少必填参数" }, { status: 400 });
      }
      const { ok, data, error } = await okx.broadcastTx(signedTx, chainIndex, address, !!enableMevProtection);
      if (!ok || !data) return NextResponse.json({ ok: false, message: error || "广播失败" });

      const result = Array.isArray(data) ? data[0] : data;
      return NextResponse.json({ ok: true, orderId: result?.orderId, txHash: result?.txHash });
    }

    // ── Order status ────────────────────────────────────
    if (action === "orderStatus") {
      const { orderId, chainIndex } = body;
      if (!orderId || !chainIndex) {
        return NextResponse.json({ ok: false, message: "缺少必填参数" }, { status: 400 });
      }
      const { ok, data, error } = await okx.getOrderStatus(orderId, chainIndex);
      if (!ok) return NextResponse.json({ ok: false, message: error || "查询失败" });
      return NextResponse.json({ ok: true, orders: data });
    }

    // ── Simulate ────────────────────────────────────────
    if (action === "simulate") {
      const { chainIndex, fromAddress, toAddress, txAmount, inputData, gasPrice } = body;
      if (!chainIndex || !fromAddress || !toAddress) {
        return NextResponse.json({ ok: false, message: "缺少必填参数" }, { status: 400 });
      }
      const { ok, data, error } = await okx.simulateTx({ chainIndex, fromAddress, toAddress, txAmount, inputData, gasPrice });
      if (!ok) return NextResponse.json({ ok: false, message: error || "模拟失败" });
      return NextResponse.json({ ok: true, simulation: data });
    }

    return NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[dex] error:", e);
    return NextResponse.json({ ok: false, message: "服务异常" }, { status: 500 });
  }
}
