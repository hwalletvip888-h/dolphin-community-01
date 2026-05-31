// OKX Public WebSocket — real-time market data
// Docs: https://www.okx.com/docs-v5/en/#websocket-api-public-channel

export interface TickerData {
  instId: string;
  last: string;
  open24h: string;
  high24h: string;
  low24h: string;
  vol24h: string;
  changePct: string;
}

export interface CandleData {
  instId: string;
  ts: string;
  o: string;
  h: string;
  l: string;
  c: string;
  vol: string;
  confirmed: boolean;
}

export interface FundingData {
  instId: string;
  fundingRate: string;
  nextFundingTime: string;
}

type ChannelType = "tickers" | "candle1m" | "funding-rate";
type Callback = (data: any) => void;

const WS_URL = "wss://ws.okx.com:8443/ws/v5/public";
const PING_INTERVAL = 25000;

let ws: WebSocket | null = null;
let subscribers: Map<string, Callback[]> = new Map();
let pingTimer: ReturnType<typeof setInterval> | null = null;

function connect() {
  if (ws?.readyState === WebSocket.OPEN) return;
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("[OKX WS] connected");
    for (const [key] of subscribers) {
      const [channel, instId] = key.split("|");
      send({ op: "subscribe", args: [{ channel, instId }] });
    }
    pingTimer = setInterval(() => { if (ws?.readyState === WebSocket.OPEN) ws.send("ping"); }, PING_INTERVAL);
  };

  ws.onmessage = (event) => {
    if (event.data === "pong") return;
    try {
      const msg = JSON.parse(event.data);
      if (msg.event === "subscribe" || msg.event === "error") return;
      if (!msg.arg?.channel || !msg.data?.length) return;

      const key = `${msg.arg.channel}|${msg.arg.instId}`;
      const cbs = subscribers.get(key) || [];

      if (msg.arg.channel === "tickers") {
        const d = msg.data[0];
        cbs.forEach((cb) => cb({
          instId: msg.arg.instId,
          last: d.last, open24h: d.open24h, high24h: d.high24h, low24h: d.low24h,
          vol24h: d.vol24h, changePct: calcChange(d.last, d.open24h),
        } as TickerData));
      } else if (msg.arg.channel === "candle1m") {
        const [ts, o, h, l, c, _, vol] = msg.data[0];
        cbs.forEach((cb) => cb({ instId: msg.arg.instId, ts, o, h, l, c, vol, confirmed: true } as CandleData));
      } else if (msg.arg.channel === "funding-rate") {
        const d = msg.data[0];
        cbs.forEach((cb) => cb({ instId: msg.arg.instId, fundingRate: d.fundingRate, nextFundingTime: d.nextFundingTime } as FundingData));
      }
    } catch { /* skip */ }
  };

  ws.onclose = () => { console.log("[OKX WS] reconnecting..."); if (pingTimer) clearInterval(pingTimer); setTimeout(connect, 3000); };
}

function send(data: object) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); }

function calcChange(last: string, open: string): string {
  const l = parseFloat(last), o = parseFloat(open);
  if (!l || !o) return "0.00";
  return (((l - o) / o) * 100).toFixed(2);
}

export function subscribe(channel: ChannelType, instId: string, cb: Callback) {
  const key = `${channel}|${instId}`;
  const existing = subscribers.get(key) || [];
  existing.push(cb);
  subscribers.set(key, existing);

  if (existing.length === 1) {
    if (ws?.readyState === WebSocket.OPEN) {
      send({ op: "subscribe", args: [{ channel, instId }] });
    } else {
      connect();
    }
  }

  return () => {
    const cbs = subscribers.get(key) || [];
    const idx = cbs.indexOf(cb);
    if (idx >= 0) cbs.splice(idx, 1);
    if (cbs.length === 0) {
      subscribers.delete(key);
      if (ws?.readyState === WebSocket.OPEN) send({ op: "unsubscribe", args: [{ channel, instId }] });
    }
  };
}

// ── REST: fetch historical candles ──
export async function fetchCandles(instId: string, bar = "1m", limit = 60): Promise<number[]> {
  try {
    const r = await fetch(`https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`);
    const d = await r.json();
    if (d.code === "0" && d.data) {
      return d.data.map((c: string[]) => parseFloat(c[4])).reverse(); // close prices
    }
  } catch {}
  return [];
}
