import { NextRequest } from "next/server";
import { addCommunityMessage, getCommunityMessages } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

function getUserId(req: NextRequest): string {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return "anonymous";
    const payload = token.split(".")[1];
    if (!payload) return "anonymous";
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    return decoded.user_id || "anonymous";
  } catch {
    return "anonymous";
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const after = url.searchParams.get("after");
    const msgs = getCommunityMessages(after ? Number(after) : undefined, 50);
    return Response.json({ messages: msgs });
  } catch (e) {
    console.error("[community] GET error:", e);
    return Response.json({ messages: [] });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(`community:${ip}`, 20, 60_000)) {
    return Response.json({ ok: false, message: "发言太频繁，请稍后再试" }, { status: 429 });
  }
  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return Response.json({ ok: false, message: "消息不能为空" }, { status: 400 });
    }
    const userId = getUserId(req) || "anonymous";
    const msg = addCommunityMessage(userId, "user", content.trim().slice(0, 500));
    return Response.json({ ok: true, message: msg });
  } catch (e) {
    console.error("[community] POST error:", e);
    return Response.json({ ok: false, message: "发送失败" }, { status: 500 });
  }
}
