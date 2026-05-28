import { NextResponse } from "next/server";
import { safeFetch } from "@/lib/fetch";

const CODEX = "https://hwalletvip888-h.github.io/codex/data/signal-paper.json";

export async function GET() {
  try {
    const { data } = await safeFetch(CODEX, { signal: AbortSignal.timeout(10000) });
    if (!data) return NextResponse.json({ ok: false, error: "Codex data unavailable" });

    const d = data as Record<string, unknown>;
    const capital = d.capital as Record<string, unknown> || {};
    const positions = (d.positions as Array<Record<string, unknown>>) || [];
    const config = d.config as Record<string, unknown> || {};

    // Portfolio summary
    const portfolio = {
      initialUsd: capital.initialUsd || 3000,
      equityUsd: capital.equityUsd || 0,
      cashUsd: capital.cashUsd || 0,
      openValueUsd: capital.openValueUsd || 0,
      realizedPnlUsd: capital.realizedPnlUsd || 0,
      unrealizedPnlUsd: capital.unrealizedPnlUsd || 0,
      totalPnlPct: capital.totalPnlPct || 0,
    };

    // Open positions
    const openPositions = positions
      .filter(p => p.status === "open")
      .map(p => ({
        symbol: p.symbol || "?",
        chain: p.chain || "?",
        entryPrice: p.entryPriceUsd,
        lastPrice: p.lastPriceUsd,
        costUsd: p.costBasisUsd,
        valueUsd: p.lastValueUsd,
        pnlPct: p.costBasisUsd ? ((Number(p.lastValueUsd) - Number(p.costBasisUsd)) / Number(p.costBasisUsd) * 100).toFixed(1) : "0",
        openedAt: p.openedAt,
      }));

    // Recent closed positions
    const closedPositions = positions
      .filter(p => p.status === "closed")
      .slice(0, 10)
      .map(p => ({
        symbol: p.symbol || "?",
        chain: p.chain || "?",
        entryPrice: p.entryPriceUsd,
        exitPrice: p.lastPriceUsd,
        pnlUsd: p.realizedPnlUsd,
        openedAt: p.openedAt,
        closedAt: p.lastUpdatedAt,
      }));

    return NextResponse.json({
      ok: true,
      updatedAt: d.updatedAt,
      scanChains: config.scanChains || ["solana", "bsc"],
      portfolio,
      openPositions,
      closedPositions,
      totalPositions: positions.length,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
