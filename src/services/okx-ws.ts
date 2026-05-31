// OKX Public WebSocket — real-time market data
// Docs: https://www.okx.com/docs-v5/en/#websocket-api-public-channel

type TickerCallback = (data: TickerData) => void;

export interface TickerData {
  instId: string;
  last: string;
  open24h: string;
  high24h: string;
  low24h: string;
  vol24h: string;
  changePct: string; // 24h change %
}

const WS_URL = "wss://ws.okx.com:8443/ws/v5/public";
const PING_INTERVAL = 25000;

let ws: WebSocket | null = null;
let subscribers: Map<string, TickerCallback[]> = new Map();
let pingTimer: ReturnType<typeof setInterval> | null = null;

function connect() {
  if (ws?.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("[OKX WS] connected");
    // Resubscribe all
    for (const [instId] of subscribers) {
      send({ op: "subscribe", args: [{ channel: "tickers", instId }] });
    }
    // Ping every 25s to keep alive
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) ws.send("ping");
    }, PING_INTERVAL);
  };

  ws.onmessage = (event) => {
    if (event.data === "pong") return;
    try {
      const msg = JSON.parse(event.data);
      if (msg.event === "subscribe") return; // ack
      if (msg.arg?.channel === "tickers" && msg.data?.length) {
        const callbacks = subscribers.get(msg.arg.instId) || [];
        const data: TickerData = {
          instId: msg.arg.instId,
          last: msg.data[0].last,
          open24h: msg.data[0].open24h,
          high24h: msg.data[0].high24h,
          low24h: msg.data[0].low24h,
          vol24h: msg.data[0].vol24h,
          changePct: calcChange(msg.data[0].last, msg.data[0].open24h),
        };
        callbacks.forEach((cb) => cb(data));
      }
    } catch { /* skip malformed */ }
  };

  ws.onerror = () => { /* reconnect handled by onclose */ };
  ws.onclose = () => {
    console.log("[OKX WS] disconnected, reconnecting...");
    if (pingTimer) clearInterval(pingTimer);
    setTimeout(connect, 3000);
  };
}

function send(data: object) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function calcChange(last: string, open: string): string {
  const l = parseFloat(last);
  const o = parseFloat(open);
  if (!l || !o) return "0.00";
  return (((l - o) / o) * 100).toFixed(2);
}

export function subscribe(instId: string, cb: TickerCallback) {
  const existing = subscribers.get(instId) || [];
  existing.push(cb);
  subscribers.set(instId, existing);

  if (existing.length === 1) {
    // First subscriber — send subscribe
    if (ws?.readyState === WebSocket.OPEN) {
      send({ op: "subscribe", args: [{ channel: "tickers", instId }] });
    } else {
      connect();
    }
  }

  // Return unsubscribe function
  return () => {
    const cbs = subscribers.get(instId) || [];
    const idx = cbs.indexOf(cb);
    if (idx >= 0) cbs.splice(idx, 1);
    if (cbs.length === 0) {
      subscribers.delete(instId);
      if (ws?.readyState === WebSocket.OPEN) {
        send({ op: "unsubscribe", args: [{ channel: "tickers", instId }] });
      }
    }
  };
}
