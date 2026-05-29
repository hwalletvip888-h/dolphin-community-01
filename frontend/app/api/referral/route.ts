import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import {
  generateInviteCode, getUserInviteCode, claimInviteReward,
  getUserInviteStats, getLeaderboard, getUserRewards,
  getCampaigns, claimReward,
} from "@/lib/db";

function getUserId(req: NextRequest): string {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return "anonymous";
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return payload.user_id || "anonymous";
  } catch { return "anonymous"; }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`referral:${ip}`, 20, 60_000)) {
    return NextResponse.json({ ok: false, message: "请求太频繁" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const userId = getUserId(req);

    // ---- Invite Code ----
    if (action === "generateCode") {
      if (userId === "anonymous") return NextResponse.json({ ok: false, message: "请先登录" }, { status: 401 });
      let code = getUserInviteCode(userId);
      if (!code) code = generateInviteCode(userId);
      return NextResponse.json({ ok: true, code });
    }

    if (action === "getCode") {
      const code = getUserInviteCode(userId);
      return NextResponse.json({ ok: true, code });
    }

    if (action === "claimInvite") {
      const { inviteCode, inviteeUserId } = body;
      if (!inviteCode || !inviteeUserId) return NextResponse.json({ ok: false, message: "缺少参数" }, { status: 400 });
      const result = claimInviteReward(inviteCode, inviteeUserId);
      return NextResponse.json(result);
    }

    if (action === "stats") {
      const stats = getUserInviteStats(userId);
      return NextResponse.json({ ok: true, ...stats });
    }

    // ---- Rewards ----
    if (action === "leaderboard") {
      const limit = body.limit || 20;
      const board = getLeaderboard(limit);
      return NextResponse.json({ ok: true, leaderboard: board });
    }

    if (action === "myRewards") {
      const rewards = getUserRewards(userId);
      return NextResponse.json({ ok: true, rewards });
    }

    if (action === "campaigns") {
      return NextResponse.json({ ok: true, campaigns: getCampaigns() });
    }

    if (action === "claimReward") {
      const { rewardId } = body;
      if (!rewardId) return NextResponse.json({ ok: false, message: "缺少奖励ID" }, { status: 400 });
      return NextResponse.json(claimReward(rewardId, userId));
    }

    return NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[referral] error:", e);
    return NextResponse.json({ ok: false, message: "服务异常" }, { status: 500 });
  }
}
