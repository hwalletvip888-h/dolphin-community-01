// Per-user, per-agent semantic memory via Mem0 + Chroma vector DB.
// Facts are extracted by LLM before storage — not raw dialog dumps.
const MEM0 = process.env.MEM0_API_URL || "";
const LLM = "https://api.deepseek.com/anthropic/v1/messages";
const KEY = () => process.env.DEEPSEEK_API_KEY || "";

// ── Fact extraction ─────────────────────────────────────

export async function extractFacts(
  userMsg: string,
  agentReply: string,
): Promise<string[]> {
  if (!KEY()) return [];
  try {
    const r = await fetch(LLM, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": KEY(), "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 200,
        temperature: 0,
        system: `Extract strategic trading knowledge from this conversation. Return ONLY a JSON array of strings, no other text.

Extract ONLY if the conversation contains concrete strategy insights, such as:
- Strategy name, parameters, entry/exit rules
- Backtest results (win rate, Sharpe, drawdown, return %)
- Which market conditions work/don't work for a strategy (trending vs ranging, specific timeframes)
- Cross-token patterns (e.g. "this EMA cross works on BTC and ETH but not SOL")
- Risk management rules that were validated

Do NOT extract:
- User preferences or personality traits
- Conversation summaries
- Generic platitudes
- Price predictions or one-off trade results
- Anything that can't be reused when trading a different token

If nothing qualifies, return [].`,
        messages: [
          { role: "user", content: userMsg.slice(0, 500) },
          { role: "assistant", content: agentReply.slice(0, 500) },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return [];
    const d = await r.json();
    const text = (d.content || []).reduce((t: string, b: { type: string; text: string }) => t + (b.text || ""), "");
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  } catch {
    return [];
  }
}

// ── Store / Search / List / Delete ──────────────────────

export async function addMemory(agentId: string, userId: string, messages: { role: string; content: string }[]) {
  try {
    await fetch(`${MEM0}/mem0/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, user_id: userId, agent_id: agentId }),
      signal: AbortSignal.timeout(10000),
    });
  } catch { /* best-effort */ }
}

export async function addFacts(agentId: string, userId: string, facts: string[]) {
  if (!facts.length) return;
  try {
    const messages = facts.map(f => ({ role: "user" as const, content: f }));
    await fetch(`${MEM0}/mem0/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, user_id: userId, agent_id: agentId }),
      signal: AbortSignal.timeout(10000),
    });
  } catch { /* best-effort */ }
}

export async function searchMemory(agentId: string, userId: string, query: string): Promise<string> {
  try {
    const r = await fetch(`${MEM0}/mem0/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, user_id: userId, agent_id: agentId, limit: 5 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return "";
    const { ok, result } = await r.json();
    if (!ok || !result?.results?.length) return "";
    return result.results
      .filter((m: { score: number }) => m.score > 0.5)
      .map((m: { memory: string }) => `- ${m.memory}`)
      .join("\n");
  } catch {
    return "";
  }
}

export async function listMemories(agentId: string, userId: string): Promise<string[]> {
  try {
    const r = await fetch(`${MEM0}/mem0/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, agent_id: agentId }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return [];
    const { ok, items } = await r.json();
    return ok ? (items || []) : [];
  } catch { return []; }
}

export async function deleteMemory(memoryId: string): Promise<boolean> {
  try {
    const r = await fetch(`${MEM0}/mem0/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory_id: memoryId }),
      signal: AbortSignal.timeout(5000),
    });
    return r.ok;
  } catch { return false; }
}
