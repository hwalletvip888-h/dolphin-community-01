import json, requests, os as _os, subprocess, os, sys, asyncio, shutil as _shutil, hashlib, secrets

from pathlib import Path as _Path

try:
    import numpy as np
except ImportError:
    np = None
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── JWT (lightweight, no external deps) ─────────────────
_JWT_SECRET = _os.environ.get("JWT_SECRET", "")
if not _JWT_SECRET:
    _JWT_SECRET = "dev-secret-dolphin-community"  # MUST be set via env in production!
    import sys
    print("⚠️  WARNING: JWT_SECRET not set — using insecure default. All tokens invalidated on restart!", file=sys.stderr)
_HMAC_ALGO = "sha256"

def _b64url(data: bytes) -> str:
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _jwt_sign(payload: dict) -> str:
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    body = _b64url(json.dumps(payload, separators=(",", ":")).encode())
    msg = f"{header}.{body}".encode()
    import hmac
    sig = hmac.new(_JWT_SECRET.encode() if isinstance(_JWT_SECRET, str) else _JWT_SECRET, msg, _HMAC_ALGO).digest()
    return f"{header}.{body}.{_b64url(sig)}"

def _jwt_verify(token: str) -> dict | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        msg = f"{header}.{body}".encode()
        import base64
        expected = base64.urlsafe_b64decode(sig + "=" * (4 - len(sig) % 4))
        import hmac
        actual = hmac.new(_JWT_SECRET.encode() if isinstance(_JWT_SECRET, str) else _JWT_SECRET, msg, _HMAC_ALGO).digest()
        if not hmac.compare_digest(expected, actual):
            return None
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (4 - len(body) % 4)))
        # Check expiration
        exp = payload.get("exp", 0)
        if exp and exp < int(datetime.now(timezone.utc).timestamp()):
            return None
        return payload
    except Exception:
        return None

def _user_hash(email: str) -> str:
    return hashlib.sha256(email.encode()).hexdigest()[:16]

# ── API Key auth (checked in middleware below) ──────────
_MCP_API_KEY = _os.environ.get("MCP_API_KEY", "")

# ── Wallet session isolation ────────────────────────────
_SESSIONS_DIR = _os.environ.get("ONCHAINOS_SESSIONS_DIR", "/data/onchainos-sessions")

# ==================== WORK LOG SYSTEM ====================

_LOGS_DIR = _Path(_os.environ.get("AGENT_LOG_DIR", "/var/log/dolphin-agents"))
_LOGS_DIR.mkdir(parents=True, exist_ok=True)
_LOGS_FILE = _LOGS_DIR / "agent_logs.json"
_agent_logs: dict = {}

def _load_logs():
    global _agent_logs
    try:
        if _LOGS_FILE.exists():
            _agent_logs = json.loads(_LOGS_FILE.read_text())
    except Exception:
        _agent_logs = {}

def _save_logs():
    try:
        _LOGS_FILE.write_text(json.dumps(_agent_logs, ensure_ascii=False, indent=2, default=str))
    except Exception:
        pass

def _log_action(agent_id: str, action: str, result: str, ts: str = ""):
    """Record an agent work log entry. Auto-persists to file."""
    if agent_id not in _agent_logs:
        _agent_logs[agent_id] = []
    t = ts or datetime.now(timezone.utc).isoformat()
    _agent_logs[agent_id].append({"action": action, "result": result[:500], "timestamp": t})
    if len(_agent_logs[agent_id]) > 1000:
        _agent_logs[agent_id] = _agent_logs[agent_id][-1000:]
    _save_logs()
    return _agent_logs[agent_id][-1]

_load_logs()

class AgentLogReq(BaseModel):
    agent_id: str
    action: str
    result: str
    timestamp: str = ""

# ── Backtest storage ─────────────────────────────────────
_BACKTESTS_DIR = _Path(_os.environ.get("BACKTEST_DIR", "/var/log/dolphin-agents/backtests"))
_BACKTESTS_DIR.mkdir(parents=True, exist_ok=True)

def _save_backtest(bt: dict):
    _BACKTESTS_DIR.mkdir(parents=True, exist_ok=True)
    fname = bt.get("id", f"bt_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}")
    (_BACKTESTS_DIR / f"{fname}.json").write_text(json.dumps(bt, ensure_ascii=False, indent=2, default=str))

def _load_backtests(limit: int = 10) -> list[dict]:
    files = sorted(_BACKTESTS_DIR.glob("*.json"), key=lambda f: f.stat().st_mtime, reverse=True)[:limit]
    results = []
    for f in files:
        try:
            results.append(json.loads(f.read_text()))
        except Exception:
            pass
    return results

# ── New request models ───────────────────────────────────
class TradeReq(BaseModel):
    market_id: str = ""
    market_slug: str = ""
    side: str = "yes"    # "yes" or "no"
    amount_usd: float = 10.0
    outcome: str = "yes"

class BacktestReq(BaseModel):
    symbol: str = "BTC"
    strategy: str = "h1-bb-regression"  # h1-bb-regression | h3-pivot-support
    days: int = 90
    initial_capital: float = 10000

class SwapReq(BaseModel):
    from_token: str = "ETH"
    to_token: str = "USDT"
    amount: float = 1.0
    chain: str = "eth"

class BridgeReq(BaseModel):
    from_chain: str = "ethereum"
    to_chain: str = "arbitrum"
    token: str = "USDC"
    amount: float = 1000

class SecurityReq(BaseModel):
    address: str = ""
    symbol: str = ""
    chain: str = "eth"

# ── Public paths (no JWT required) ──────────────────────
_PUBLIC_PATHS = {"/health", "/api/h/v1/", "/api/h/v1/wallet/login", "/api/h/v1/wallet/verify", "/api/h/v1/wallet/create-user"}

app = FastAPI(title="H Wallet MCP API", version="4.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["https://api.hvip.ink", "http://localhost:3000"], allow_methods=["GET","POST"], allow_headers=["Content-Type", "X-API-Key", "Authorization"])

# ── Auth middleware (API Key + JWT user extraction) ──────
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Health check — always open
    if request.url.path == "/health":
        return await call_next(request)
    # API Key check for all /api/h/v1/ routes
    if _MCP_API_KEY and request.url.path.startswith("/api/h/v1/"):
        key = request.headers.get("X-API-Key", "")
        if key != _MCP_API_KEY:
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    # JWT user extraction (best-effort, skippable for public paths)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        payload = _jwt_verify(auth.removeprefix("Bearer "))
        if payload:
            request.state.user_id = payload.get("user_id", "")
            request.state.email = payload.get("email", "")
    elif request.url.path not in _PUBLIC_PATHS:
        return JSONResponse(status_code=401, content={"error": "Missing Authorization header"})
    return await call_next(request)

try:
    import ccxt
    _okx = ccxt.okx({"enableRateLimit": True, "options": {"defaultType": "swap"}})
except Exception:
    _okx = None

DEFAULT_SYMBOLS = ["BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK", "XRP", "ADA"]

# ==================== UTILS ====================

def ema(data, n):
    k = 2 / (n + 1)
    result = [float(data[0])]
    for i in range(1, len(data)):
        result.append(float(data[i]) * k + result[-1] * (1 - k))
    return result

def hurst(ts, max_lag=20):
    """HURST exponent: >0.55=trending, <0.45=mean-reverting"""
    lags = range(2, min(max_lag, len(ts) // 2))
    tau = [np.sqrt(np.std(np.subtract(ts[lag:], ts[:-lag]))) for lag in lags]
    if not tau or min(tau) <= 0:
        return 0.5
    poly = np.polyfit(np.log(list(lags)), np.log(tau), 1)
    return round(float(poly[0]), 4)

def compute_bollinger(closes, window=20, mult=2.0):
    """Bollinger Bands"""
    ma = ema(closes, window)
    std = np.std(closes[-window:])
    return {"upper": round(ma[-1] + mult * std, 2), "middle": round(ma[-1], 2), "lower": round(ma[-1] - mult * std, 2)}

def compute_pivot(high, low, close):
    pp = (high + low + close) / 3
    return {"pp": round(pp, 2), "r1": round(2*pp - low, 2), "r2": round(pp + (high - low), 2),
            "s1": round(2*pp - high, 2), "s2": round(pp - (high - low), 2)}

# ==================== SYSTEM ====================

@app.get("/api/h/v1/")
def h_status():
    return {"status": "ok", "app": "H Wallet MCP API", "version": "4.0.0", "ccxt_ok": _okx is not None}

@app.get("/health")
def health():
    return {"status": "ok", "ts": datetime.now(timezone.utc).isoformat()}

# ==================== RAW MARKET DATA ====================

@app.get("/api/h/v1/market/ticker/{symbol}")
def h_ticker(symbol: str):
    if not _okx:
        return {"_error": "CCXT unavailable"}
    try:
        t = _okx.fetch_ticker(f"{symbol.upper()}/USDT:USDT")
        return {"symbol": symbol.upper(), "price": t["last"], "change24h": t["percentage"],
                "high": t["high"], "low": t["low"], "volume": t["baseVolume"]}
    except Exception as e:
        return {"_error": str(e)[:200]}

@app.get("/api/h/v1/market/candles/{symbol}")
def h_candles(symbol: str, timeframe: str = "4h", limit: int = 100):
    if not _okx:
        return {"_error": "CCXT unavailable"}
    try:
        candles = _okx.fetch_ohlcv(f"{symbol.upper()}/USDT:USDT", timeframe=timeframe, limit=limit)
        return {"symbol": symbol.upper(), "timeframe": timeframe, "candles": [
            {"time": c[0], "open": c[1], "high": c[2], "low": c[3], "close": c[4], "vol": c[5]}
            for c in candles
        ]}
    except Exception as e:
        return {"_error": str(e)[:200]}

# ==================== DECISION ENGINE ====================

@app.get("/api/h/v1/market/analysis/{symbol}")
def h_analysis(symbol: str):
    """
    Full market analysis for one symbol.
    HURST regime + EMA trends + Pivot levels + Bollinger Bands + trading signals.
    This is what the AI calls to make trading decisions.
    """
    if not _okx:
        return {"_error": "CCXT unavailable"}
    try:
        sym = symbol.upper()

        # Fetch multi-timeframe candles
        d4h = _okx.fetch_ohlcv(f"{sym}/USDT:USDT", timeframe="4h", limit=200)
        d1h = _okx.fetch_ohlcv(f"{sym}/USDT:USDT", timeframe="1h", limit=100)
        d15m = _okx.fetch_ohlcv(f"{sym}/USDT:USDT", timeframe="15m", limit=100)

        closes_4h = [c[4] for c in d4h]
        closes_1h = [c[4] for c in d1h]
        closes_15m = [c[4] for c in d15m]

        highs_4h = [c[2] for c in d4h]
        lows_4h = [c[3] for c in d4h]

        curr = closes_4h[-1]
        high_20 = max(highs_4h[-20:])
        low_20 = min(lows_4h[-20:])

        # HURST
        h = hurst(closes_4h[-100:])

        # EMA trends
        e20_4h = ema(closes_4h, 20)
        e50_4h = ema(closes_4h, 50)
        e20_1h = ema(closes_1h, 20)
        e50_1h = ema(closes_1h, 50)
        e20_15m = ema(closes_15m, 20)
        e50_15m = ema(closes_15m, 50)

        trend_4h = "BULLISH" if e20_4h[-1] > e50_4h[-1] else "BEARISH"
        trend_1h = "BULLISH" if e20_1h[-1] > e50_1h[-1] else "BEARISH"
        trend_15m = "BULLISH" if e20_15m[-1] > e50_15m[-1] else "BEARISH"

        # Bollinger Bands (H1 strategy)
        bb = compute_bollinger(closes_15m, window=20, mult=2.0)

        # Pivot (H3 strategy)
        pivot = compute_pivot(high_20, low_20, curr)

        # Market regime
        if h > 0.55:
            regime = "TRENDING"
            recommendation = "优先 H2 趋势策略。顺 EMA 方向，回调入场。"
        elif h < 0.45:
            regime = "MEAN_REVERTING"
            recommendation = "优先 H1 均值回归。布林带上下轨反向操作。"
        else:
            regime = "RANDOM_WALK"
            recommendation = "趋势不明朗，轻仓或观望。等权分配。"

        # Signal detection
        signals = []
        # H1: price vs bollinger
        if curr <= bb["lower"]:
            signals.append({"strategy": "H1_BB", "direction": "LONG", "reason": f"价格跌破布林下轨 ${bb['lower']}",
                           "entry": round(curr, 2), "tp": round(bb["middle"], 2),
                           "sl": round(curr * 0.985, 2), "rr": round((bb["middle"]-curr)/(curr*0.015), 2)})
        elif curr >= bb["upper"]:
            signals.append({"strategy": "H1_BB", "direction": "SHORT", "reason": f"价格突破布林上轨 ${bb['upper']}",
                           "entry": round(curr, 2), "tp": round(bb["middle"], 2),
                           "sl": round(curr * 1.015, 2), "rr": round((curr-bb["middle"])/(curr*0.015), 2)})

        # H3: price vs pivot
        if curr <= pivot["s1"] * 1.01:
            signals.append({"strategy": "H3_PIVOT", "direction": "LONG", "reason": f"价格触及 S1 支撑 ${pivot['s1']}",
                           "entry": round(curr, 2), "tp": round(pivot["pp"], 2),
                           "sl": round(pivot["s2"], 2), "rr": round((pivot["pp"]-curr)/(curr-pivot["s2"]), 2)})
        elif curr >= pivot["r1"] * 0.99:
            signals.append({"strategy": "H3_PIVOT", "direction": "SHORT", "reason": f"价格触及 R1 阻力 ${pivot['r1']}",
                           "entry": round(curr, 2), "tp": round(pivot["pp"], 2),
                           "sl": round(pivot["r2"], 2), "rr": round((curr-pivot["pp"])/(pivot["r2"]-curr), 2)})

        # Position relative to key levels
        s1_dist = round((curr - pivot["s1"]) / pivot["s1"] * 100, 2)
        r1_dist = round((pivot["r1"] - curr) / pivot["r1"] * 100, 2)

        # Prediction: combine regime + trend alignment + S/R proximity
        bias = "NEUTRAL"
        confidence = 0
        pred_reason = []

        # Regime-based bias
        if regime == "MEAN_REVERTING":
            # Mean-reverting: bet against the trend
            if trend_4h == "BEARISH" and curr <= bb["lower"] * 1.02:
                bias = "BULLISH_BIAS"
                confidence += 30
                pred_reason.append("震荡市+价格在布林下轨=均值回归向上")
            elif trend_4h == "BULLISH" and curr >= bb["upper"] * 0.98:
                bias = "BEARISH_BIAS"
                confidence += 30
                pred_reason.append("震荡市+价格在布林上轨=均值回归向下")
            elif curr <= pivot["s1"] * 1.02:
                bias = "BULLISH_BIAS"
                confidence += 25
                pred_reason.append(f"价格接近S1支撑 ${pivot['s1']}")
            elif curr >= pivot["r1"] * 0.98:
                bias = "BEARISH_BIAS"
                confidence += 25
                pred_reason.append(f"价格接近R1阻力 ${pivot['r1']}")
        elif regime == "TRENDING":
            # Trending: follow the trend
            if trend_4h == trend_1h == "BULLISH":
                bias = "BULLISH_BIAS"
                confidence += 35
                pred_reason.append("趋势市+4h/1h共振看涨")
            elif trend_4h == trend_1h == "BEARISH":
                bias = "BEARISH_BIAS"
                confidence += 35
                pred_reason.append("趋势市+4h/1h共振看跌")
        else:
            pred_reason.append("随机游走=方向不确定")

        # Multi-TF alignment bonus
        if trend_4h == trend_1h == trend_15m:
            confidence += 15
            pred_reason.append("三时间框架趋势一致")
        else:
            confidence -= 10
            pred_reason.append("时间框架趋势不一致")

        # Cap confidence
        confidence = max(0, min(100, confidence))

        return {
            "symbol": sym,
            "price": round(curr, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "prediction": {
                "bias": bias,
                "confidence": confidence,
                "reasons": pred_reason,
            },
            "regime": {"hurst": h, "state": regime, "recommendation": recommendation},
            "trends": {
                "4h": {"ema20": round(e20_4h[-1], 2), "ema50": round(e50_4h[-1], 2), "direction": trend_4h,
                       "strength_pct": round((e20_4h[-1]/e50_4h[-1]-1)*100, 2)},
                "1h": {"ema20": round(e20_1h[-1], 2), "ema50": round(e50_1h[-1], 2), "direction": trend_1h,
                       "strength_pct": round((e20_1h[-1]/e50_1h[-1]-1)*100, 2)},
                "15m": {"ema20": round(e20_15m[-1], 2), "ema50": round(e50_15m[-1], 2), "direction": trend_15m,
                        "strength_pct": round((e20_15m[-1]/e50_15m[-1]-1)*100, 2)},
            },
            "levels": {
                "bollinger": bb,
                "pivot": pivot,
                "s1_distance_pct": s1_dist,
                "r1_distance_pct": r1_dist,
            },
            "signals": signals,
            "risk_note": "单笔≤10%总资金 | SL≥1.5% | 每单必带OCO | 4h EMA定方向 | 不混持多空"
        }
    except Exception as e:
        return {"_error": str(e)[:300]}

@app.get("/api/h/v1/market/scan")
def h_scan(symbols: str = "BTC,ETH,SOL,DOGE,AVAX,LINK,XRP,ADA"):
    """
    Multi-coin signal scan. Runs H1 BB and H3 Pivot for all specified coins.
    Returns coins sorted by signal quality (RR ratio).
    """
    if not _okx:
        return {"_error": "CCXT unavailable"}
    try:
        sym_list = [s.strip().upper() for s in symbols.split(",")]
        results = []
        for sym in sym_list:
            try:
                analysis = h_analysis(sym)
                if "_error" in analysis:
                    results.append({"symbol": sym, "_error": analysis["_error"]})
                    continue
                sig_count = len(analysis.get("signals", []))
                best_rr = max([s.get("rr", 0) for s in analysis.get("signals", [])]) if sig_count > 0 else 0
                results.append({
                    "symbol": sym,
                    "price": analysis["price"],
                    "hurst": analysis["regime"]["hurst"],
                    "regime": analysis["regime"]["state"],
                    "trend_4h": analysis["trends"]["4h"]["direction"],
                    "signals_count": sig_count,
                    "signals": analysis["signals"],
                    "best_rr": best_rr,
                })
            except Exception as e:
                results.append({"symbol": sym, "_error": str(e)[:100]})

        # Sort: coins with signals first, then by best RR
        results.sort(key=lambda x: (x.get("signals_count", 0), x.get("best_rr", 0)), reverse=True)

        return {
            "scan_time": datetime.now(timezone.utc).isoformat(),
            "coins_scanned": len(results),
            "coins_with_signals": sum(1 for r in results if r.get("signals_count", 0) > 0),
            "results": results
        }
    except Exception as e:
        return {"_error": str(e)[:300]}

# ==================== STRATEGIES ====================

@app.get("/api/h/v1/agent/strategies")
def h_strategies():
    return {"strategies": [
        {"id": "h1-bb-regression", "name": "H1 BB均值回归", "timeframe": "15m", "type": "mean_reversion",
         "desc": "布林带/Keltner通道均值回归。价格突破上下轨后反向操作。震荡市优先。"},
        {"id": "h2-trend-pullback", "name": "H2 趋势回调", "timeframe": "4h", "type": "trend_following",
         "desc": "EMA20/50 趋势确认后等回调入场。趋势市优先。"},
        {"id": "h3-pivot-support", "name": "H3 支撑狙击", "timeframe": "4h", "type": "support_resistance",
         "desc": "Pivot S1/S2 支撑做多，R1/R2阻力做空。高盈亏比。"},
    ], "count": 3}

@app.get("/api/h/v1/agent/strategies/{sid}/plan")
def h_strategy_plan(sid: str):
    plans = {
        "h1-bb-regression": {"timeframe": "15m", "indicators": ["BBANDS", "RSI"],
                             "params": {"window": 20, "multiplier": 2.0, "rr_min": 0.5}},
        "h2-trend-pullback": {"timeframe": "4h", "indicators": ["EMA20", "EMA50"],
                              "params": {"trend_threshold_pct": 2.0}},
        "h3-pivot-support": {"timeframe": "4h", "indicators": ["PivotPoints"],
                             "params": {"sl_distance_pct": 1.5, "rr_min": 1.0}},
    }
    p = plans.get(sid)
    if not p:
        raise HTTPException(404, f"Strategy {sid} not found")
    return {"id": sid, "plan": p}

@app.get("/api/h/v1/agent/runner")
def h_runner():
    return {"runner": "dolphin-quant-v2.3", "status": "active", "auto_scan_interval": "15min"}

# ==================== POLYMARKET (Gamma API + CLI fallback) ====================

GAMMA_API = "https://gamma-api.polymarket.com"
POLYMARKET_BIN = _os.environ.get("POLYMARKET_BIN", _shutil.which("polymarket-plugin") or "")


# ── Cache for Gamma API responses (60s TTL) ─────────────────
_gamma_cache: dict[str, tuple[float, dict]] = {}

def _gamma(path: str, timeout: int = 10) -> dict | None:
    """Call Polymarket Gamma API. Cached for 60 seconds."""
    url = f"{GAMMA_API}{path}"
    now = datetime.now(timezone.utc).timestamp()
    if url in _gamma_cache:
        ts, data = _gamma_cache[url]
        if now - ts < 60:
            return data
    try:
        r = requests.get(url, timeout=timeout, headers={"User-Agent": "dolphin-community/4.0"})
        if r.status_code == 200:
            data = r.json()
            _gamma_cache[url] = (now, data)
            return data
        print(f"[gamma] HTTP {r.status_code} for {url}", file=sys.stderr)
    except Exception as e:
        print(f"[gamma] error: {e}", file=sys.stderr)
    return None

def _polymarket(*args):
    """Run polymarket-plugin CLI. Returns parsed JSON or None."""
    try:
        r = subprocess.run([POLYMARKET_BIN] + list(args), capture_output=True, text=True, timeout=15)
        if r.returncode == 0:
            return json.loads(r.stdout)
        print(f"[polymarket] non-zero exit: {r.returncode} stderr={r.stderr[:200]}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"[polymarket] error: {e}", file=sys.stderr)
        return None

def _gamma_market_to_dict(m: dict) -> dict:
    """Normalize Gamma API market object to our standard format."""
    outcomes = json.loads(m.get("outcomes", "[]")) if isinstance(m.get("outcomes"), str) else m.get("outcomes", [])
    prices = json.loads(m.get("outcomePrices", "[]")) if isinstance(m.get("outcomePrices"), str) else m.get("outcomePrices", [])
    yes_price = float(prices[0]) if len(prices) > 0 else 0.0
    no_price = float(prices[1]) if len(prices) > 1 else 0.0
    return {
        "question": m.get("question", m.get("title", "")),
        "yes_price": yes_price,
        "no_price": no_price,
        "volume_24hr": float(m.get("volume", 0) or 0),
        "liquidity": float(m.get("liquidity", 0) or 0),
        "volume_num": float(m.get("volumeNum", 0) or 0),
        "end_date": m.get("endDate", m.get("closeTime", "")),
        "market_slug": m.get("slug", ""),
        "condition_id": m.get("conditionId", ""),
        "closed": m.get("closed", False),
    }

@app.get("/api/h/v1/polymarket/worldcup-odds")
def pm_worldcup_odds():
    """World Cup 2026 odds — Gamma markets API primary (most reliable), events fallback."""
    markets = []
    worldcup_keywords = ["fifa world cup", "2026 fifa", "win the 2026 fifa", "world cup 2026"]
    
    try:
        # ── Primary: Gamma /markets (broad scan, most reliable) ──
        broad = _gamma("/markets?closed=false&limit=200&order=volume24hr&ascending=false")
        if broad:
            for m in broad[:120]:
                q = (m.get("question", "") or "").lower()
                if any(kw in q for kw in worldcup_keywords):
                    markets.append(_gamma_market_to_dict(m))
        
        # ── Also try events search ──
        if len(markets) < 8:
            for event_query in ["world+cup+2026", "fifa+world+cup", "2026+winner"]:
                events_data = _gamma(f"/events?title={event_query}&limit=10&closed=false")
                if events_data:
                    for evt in events_data[:5]:
                        slug = evt.get("slug", "")
                        if slug:
                            mkts = _gamma(f"/events/{slug}?limit=30")
                            for m in (mkts.get("markets", []) if mkts else [])[:10]:
                                if not m.get("closed"):
                                    markets.append(_gamma_market_to_dict(m))
                    break  # One successful event query is enough
    except Exception as e:
        print(f"[worldcup-odds] gamma error: {e}", file=sys.stderr)
    
    # ── CLI fallback (last resort) ──
    if not markets:
        data = _polymarket("list-markets", "--keyword", "win the 2026", "--limit", "40")
        if data:
            raw_markets = data.get("data", {}).get("markets", [])
            for m in raw_markets[:15]:
                markets.append({
                    "question": m.get("question"),
                    "yes_price": float(m.get("yes_price", 0)),
                    "no_price": float(m.get("no_price", 0)),
                    "volume_24hr": m.get("volume_24hr", 0),
                    "liquidity": m.get("liquidity", 0),
                    "end_date": m.get("end_date"),
                })
    
    # Sort by volume
    markets.sort(key=lambda x: x.get("volume_24hr", 0), reverse=True)
    
    # Deduplicate by question
    seen = set()
    unique = []
    for m in markets:
        key = m["question"][:80]
        if key not in seen:
            seen.add(key)
            unique.append(m)
    
    return {
        "source": "Polymarket Gamma API (real-time)",
        "markets": unique[:15],
        "count": len(unique),
        "updated": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/h/v1/polymarket/search")
def pm_search(q: str, limit: int = 20):
    """Search Polymarket markets — Gamma API primary."""
    results = []
    try:
        # Search via Gamma
        data = _gamma(f"/markets?closed=false&limit=50&order=volume24hr&ascending=false")
        if data:
            q_lower = q.lower()
            for m in data:
                question = m.get("question", "").lower()
                if any(t in question for t in q_lower.split()):
                    results.append(_gamma_market_to_dict(m))
                    if len(results) >= limit:
                        break
            
            # If not enough, try event search
            if len(results) < limit:
                evts = _gamma(f"/events?title={requests.utils.quote(q, safe='')}&limit=20&closed=false")

                if evts:
                    for evt in evts[:5]:
                        slug = evt.get("slug", "")
                        if slug:
                            mkts = _gamma(f"/events/{slug}?limit=20")
                            if mkts:
                                for m in mkts.get("markets", [])[:10]:
                                    results.append(_gamma_market_to_dict(m))
                                    if len(results) >= limit:
                                        break
    except Exception as e:
        print(f"[pm/search] gamma error: {e}", file=sys.stderr)
    
    # CLI fallback
    if not results:
        data = _polymarket("list-markets", "--keyword", q, "--limit", str(limit))
        if data:
            raw = data.get("data", {}).get("markets", [])
            for m in raw[:limit]:
                results.append({"question": m.get("question"), "yes_price": m.get("yes_price"),
                               "no_price": m.get("no_price"), "volume_24hr": m.get("volume_24hr", 0)})
    
    return {
        "query": q,
        "results": results[:limit],
        "count": len(results[:limit]),
        "source": "Polymarket Gamma API"
    }

# ── Polymarket Account (CLI required — wallet operations) ─────────────────────
@app.get("/api/h/v1/polymarket/balance")
def pm_balance():
    """Get Polymarket account balance (POL + USDC.e + pUSD)."""
    data = _polymarket("balance")
    if not data:
        return {
            "ok": False, 
            "error": "Polymarket plugin not available",
            "hint": "Install polymarket-plugin CLI or configure OKX wallet for on-chain balance queries.",
            "fallback": "Please use 'onchainos wallet balance' to check your wallet balances across chains."
        }
    return data

@app.get("/api/h/v1/polymarket/positions")
def pm_positions(address: str = ""):
    """Get open Polymarket positions for the active wallet."""
    args = ["get-positions"]
    if address:
        args += ["--address", address]
    data = _polymarket(*args)
    if not data:
        return {
            "ok": False,
            "error": "Polymarket plugin not available",
            "hint": "Install polymarket-plugin CLI to view on-chain positions."
        }
    return data

@app.get("/api/h/v1/polymarket/orders")
def pm_orders():
    """List open orders on Polymarket."""
    data = _polymarket("orders")
    if not data:
        return {
            "ok": False,
            "error": "Polymarket plugin not available",
            "hint": "Install polymarket-plugin CLI to view open orders."
        }
    return data

@app.get("/api/h/v1/polymarket/account")
def pm_account():
    """Combined account overview: balance + positions + orders. Fast pre-check avoids wasted CLI calls."""
    # Fast pre-check: is the CLI even available?
    if not POLYMARKET_BIN or not _Path(POLYMARKET_BIN).exists():
        return {
            "ok": True,
            "updated": datetime.now(timezone.utc).isoformat(),
            "balance": None,
            "positions": None,
            "orders": None,
            "balance_error": "Polymarket CLI not found — wallet may not be initialized.",
            "balance_hint": "Try using onchainos wallet balance to check your OKX Agent Wallet balances.",
            "positions_error": "Polymarket CLI not installed.",
            "cli_status": "not_found"
        }
    
    bal = _polymarket("balance")
    pos = _polymarket("get-positions")
    orders = _polymarket("orders")

    result = {
        "ok": True,
        "updated": datetime.now(timezone.utc).isoformat(),
        "balance": bal.get("data") if bal and bal.get("ok") else None,
        "positions": pos.get("data") if pos and pos.get("ok") else None,
        "orders": orders.get("data") if orders and orders.get("ok") else None,
        "cli_status": "found" if bal or pos or orders else "unavailable"
    }

    if not bal or not bal.get("ok"):
        result["balance_error"] = "Polymarket CLI not available — wallet may not be initialized."
        result["balance_hint"] = "Try using onchainos wallet balance to check your OKX Agent Wallet balances."
    if not pos or not pos.get("ok"):
        result["positions_error"] = "Polymarket CLI not available."

    return result



# ==================== CAMPAIGNS & RISK ====================

@app.get("/api/h/v1/boost/campaigns")
def h_campaigns():
    return {"campaigns": [
        {"id": "worldcup-2026", "name": "World Cup 2026", "status": "upcoming", "launch": "2026-06-10"},
        {"id": "dex-points", "name": "DEX Trading Points", "status": "active"},
    ]}

class RiskReq(BaseModel):
    symbol: str = ""
    direction: str = ""
    margin: float = 0
    leverage: int = 10
    sl: float | None = None

@app.post("/api/h/v1/risk/evaluate")
def h_risk(req: RiskReq):
    checks = [
        {"rule": "max_leverage", "pass": req.leverage <= 15, "detail": f"{req.leverage}x / 15x"},
        {"rule": "has_stop_loss", "pass": req.sl is not None, "detail": f"SL: ${req.sl}" if req.sl else "missing"},
        {"rule": "single_margin", "pass": req.margin <= 5000, "detail": f"${req.margin:.0f} / $5000"},
    ]
    return {"pass": all(c["pass"] for c in checks), "checks": checks}

# ==================== WALLET (onchainos CLI) ====================

ONCHAINOS_BIN = _os.environ.get("ONCHAINOS_BIN", "/root/.local/bin/onchainos")
_ONCHAINOS_PATH = f"/root/.local/bin:{os.environ.get('PATH', '')}"

def _onchainos(user_id: str, *args):
    """Run onchainos CLI command with per-user session isolation. Returns (ok: bool, output: str)."""
    try:
        home = os.path.join(_SESSIONS_DIR, user_id)
        os.makedirs(os.path.join(home, ".onchainos"), exist_ok=True)
        env = {**os.environ, "HOME": home, "PATH": _ONCHAINOS_PATH}
        r = subprocess.run(
            [ONCHAINOS_BIN] + list(args),
            capture_output=True, text=True, timeout=60, env=env
        )
        out = (r.stdout + r.stderr).strip()
        return r.returncode == 0, out
    except Exception as e:
        return False, str(e)

def _ensure_user_dir(user_id: str):
    """Create user session directory and onchainos subdir."""
    home = os.path.join(_SESSIONS_DIR, user_id)
    os.makedirs(os.path.join(home, ".onchainos"), exist_ok=True)
    return home

class WalletLoginReq(BaseModel):
    email: str

@app.post("/api/h/v1/wallet/login")
def wallet_login(req: WalletLoginReq, force: bool = False):
    """Send OTP verification code via OKX Agent Wallet."""
    user_id = _user_hash(req.email)
    _ensure_user_dir(user_id)
    args = ["wallet", "login", req.email]
    if force:
        args.append("--force")
    ok, out = _onchainos(user_id, *args)

    # Check if onchainos is asking for account switch confirmation
    try:
        parsed = json.loads(out)
        if parsed.get("confirming"):
            return {
                "ok": False,
                "confirming": True,
                "message": parsed.get("message", "Account switch confirmation required"),
                "next": parsed.get("next", "Retry with force=true"),
            }
    except (json.JSONDecodeError, TypeError):
        pass

    return {"ok": ok, "message": out[:500], "next": "Check email for OTP code. Then POST /wallet/verify with code.", "user_id": user_id}

class WalletVerifyReq(BaseModel):
    code: str
    email: str = ""
    user_id: str = ""

@app.post("/api/h/v1/wallet/verify")
def wallet_verify(req: WalletVerifyReq):
    """Verify OTP code from email. Returns JWT on success."""
    uid = req.user_id or (_user_hash(req.email) if req.email else "")
    ok, out = _onchainos(uid or "default", "wallet", "verify", req.code)
    if ok and uid:
        now = datetime.now(timezone.utc)
        jwt_token = _jwt_sign({"user_id": uid, "email": req.email, "iat": int(now.timestamp()), "exp": int((now + timedelta(days=30)).timestamp())})
        return {"ok": True, "message": out[:500], "wallet_ready": True, "token": jwt_token, "user_id": uid}
    return {"ok": ok, "message": out[:500], "wallet_ready": ok}

@app.get("/api/h/v1/wallet/create-user")
def wallet_create_user(request: Request):
    """Create session directory for authenticated user."""
    uid = getattr(request.state, "user_id", "")
    if not uid:
        return JSONResponse(status_code=401, content={"error": "Authentication required"})
    _ensure_user_dir(uid)
    return {"ok": True, "user_id": uid}

@app.get("/api/h/v1/wallet/status")
def wallet_status(request: Request):
    """Check if wallet is logged in (user-scoped)."""
    uid = getattr(request.state, "user_id", "")
    if not uid:
        return JSONResponse(status_code=401, content={"error": "Authentication required"})
    ok, out = _onchainos(uid, "wallet", "status")
    return {"ok": ok, "logged_in": ok, "detail": out[:500]}

@app.get("/api/h/v1/wallet/addresses")
def wallet_addresses(request: Request):
    """Get wallet addresses across chains (user-scoped)."""
    uid = getattr(request.state, "user_id", "")
    if not uid:
        return JSONResponse(status_code=401, content={"error": "Authentication required"})
    ok, out = _onchainos(uid, "wallet", "addresses")
    if ok:
        try:
            parsed = json.loads(out)
            if isinstance(parsed, (dict, list)):
                return {"ok": True, "addresses": json.dumps(parsed, indent=2, ensure_ascii=False)}
        except Exception:
            pass
    return {"ok": ok, "addresses": out[:1000]}


class WalletSendReq(BaseModel):
    to: str
    amount: str
    tokenSymbol: str = "USD₮0"
    chainIndex: int = 196

@app.post("/api/h/v1/wallet/send")
def wallet_send(req: WalletSendReq, request: Request):
    """Send tokens to an address via OKX Agent Wallet (user-scoped)."""
    uid = getattr(request.state, "user_id", "")
    if not uid:
        return JSONResponse(status_code=401, content={"error": "Authentication required"})
    chain_str = str(req.chainIndex)
    args = ["wallet", "send", "--recipient", req.to, "--chain", chain_str, "--readable-amount", req.amount, "--force"]
    symbol = req.tokenSymbol.strip().replace(" ", "")
    chain_addrs = _TOKEN_ADDRESSES.get(symbol, _TOKEN_ADDRESSES.get(symbol.upper(), {}))
    token_addr = chain_addrs.get(req.chainIndex, list(chain_addrs.values())[0] if chain_addrs else "")
    if token_addr:
        args += ["--contract-token", token_addr]
    ok, out = _onchainos(uid, *args)
    txHash = ""
    try:
        d = json.loads(out)
        if isinstance(d, dict):
            data = d.get("data", d)
            txHash = data.get("txHash", data.get("hash", data.get("tx", ""))) if isinstance(data, dict) else ""
    except:
        pass
    return {"ok": ok, "txHash": txHash, "detail": out[:500]}


class DexSwapReq(BaseModel):
    fromToken: str
    toToken: str
    amount: str
    chainIndex: int = 196

# Token address map: symbol -> {chain_index: address}
_TOKEN_ADDRESSES: dict[str, dict[int, str]] = {
    "USDT": {196: "0x779ded0c9e1022225f8e0630b35a9b54be713736", 1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", 42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", 56: "0x55d398326f99059fF775485246999027B3197955", 137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", 8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"},
    "USDC": {196: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95A663C4", 1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", 56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", 137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", 8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"},
    "ETH":  {196: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 1: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 42161: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 56: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 137: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 8453: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"},
    "WETH": {1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", 56: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", 137: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", 8453: "0x4200000000000000000000000000000000000006"},
    "WBTC": {1: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", 42161: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"},
    "DAI":  {1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", 42161: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", 137: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"},
    "OKB":  {196: "0x75231F58b43240C9718Dd58B4967c5114342a86c"},
    "USD₮0": {196: "0x779ded0c9e1022225f8e0630b35a9b54be713736"},
}
_CHAIN_NAMES: dict[int, str] = {
    1: "ethereum", 56: "bsc", 137: "polygon", 42161: "arbitrum",
    10: "optimism", 8453: "base", 196: "xlayer", 501: "solana",
}

def _resolve_token(user_id: str, symbol: str, chain_index: int) -> str:
    """Resolve token symbol or contract address to contract address."""
    clean = symbol.strip()
    # If already a contract address, return as-is
    if clean.startswith("0x") and len(clean) == 42:
        return clean
    upper = clean.upper().replace(" ", "")
    chain_map = _TOKEN_ADDRESSES.get(upper, {})
    addr = chain_map.get(chain_index, "")
    if not addr and chain_map:
        addr = list(chain_map.values())[0]  # fallback: first known address
    if addr:
        return addr
    chain = str(chain_index)
    try:
        ok, out = _onchainos(user_id, "token", "search", "--query", upper, "--chain", chain, "--limit", "1")
        if ok:
            data = json.loads(out)
            items = data if isinstance(data, list) else data.get("data", data.get("tokens", []))
            if items and isinstance(items[0], dict):
                return items[0].get("contractAddress", items[0].get("address", ""))
    except Exception:
        pass
    return ""

def _get_wallet_address(user_id: str) -> str:
    """Get user's wallet address for the current session."""
    try:
        ok, out = _onchainos(user_id, "wallet", "addresses")
        if ok:
            data = json.loads(out)
            if isinstance(data, dict):
                inner = data.get("data", data)
                if isinstance(inner, dict):
                    # evm is an array: [{"address": "0x...", "chainIndex": "1", "chainName": "eth"}, ...]
                    evm_list = inner.get("evm", inner.get("evmAddress", []))
                    if isinstance(evm_list, list) and evm_list:
                        addr = evm_list[0].get("address", "") if isinstance(evm_list[0], dict) else ""
                        if addr: return addr
                    # fallback: solana
                    sol_list = inner.get("solana", inner.get("sol", []))
                    if isinstance(sol_list, list) and sol_list:
                        addr = sol_list[0].get("address", "") if isinstance(sol_list[0], dict) else ""
                        if addr: return addr
                # fallback: direct evmAddress string
                evm = inner.get("evmAddress", "") if isinstance(inner, dict) else ""
                if isinstance(evm, str) and evm.startswith("0x"): return evm
            if isinstance(data, str):
                import re
                m = re.search(r'0x[a-fA-F0-9]{40}', data)
                if m: return m.group(0)
    except Exception:
        pass
    return ""

@app.post("/api/h/v1/dex/swap")
def dex_swap(req: DexSwapReq, request: Request):
    """Swap tokens via OKX Agent Wallet — user-scoped."""
    uid = getattr(request.state, "user_id", "")
    if not uid:
        return JSONResponse(status_code=401, content={"error": "Authentication required"})

    chain_name = _CHAIN_NAMES.get(req.chainIndex, "xlayer")

    # 1. Get wallet address
    wallet_addr = _get_wallet_address(uid)
    if not wallet_addr:
        return {"ok": False, "error": "请先登录钱包 — 在聊天中说「登录钱包」或发送验证码"}

    # 2. Resolve token addresses
    from_addr = _resolve_token(uid, req.fromToken, req.chainIndex)
    to_addr = _resolve_token(uid, req.toToken, req.chainIndex)
    if not from_addr:
        return {"ok": False, "error": f"未找到代币: {req.fromToken}"}
    if not to_addr:
        return {"ok": False, "error": f"未找到代币: {req.toToken}"}

    # 3. Execute swap
    args = ["swap", "execute", "--from", from_addr, "--to", to_addr,
            "--readable-amount", req.amount, "--chain", chain_name, "--wallet", wallet_addr]
    ok, out = _onchainos(uid, *args)
    txHash = ""
    try:
        d = json.loads(out)
        txHash = d.get("txHash", d.get("hash", d.get("tx", ""))) if isinstance(d, dict) else ""
    except Exception:
        pass
    return {"ok": ok, "txHash": txHash, "detail": out[:500]}


# ==================== AGENT WORK SYSTEM (24/7) ====================

AGENTS = ["onchain", "zhuge", "worldcup", "wealth", "dolphin", "reward"]

@app.get("/api/h/v1/agent/status")
def agent_status():
    """Get all agents' status and latest work logs."""
    result = {}
    for aid in AGENTS:
        logs = _agent_logs.get(aid, [])
        last = logs[-1] if logs else None
        result[aid] = {"log_count": len(logs), "last_action": last}
    return {"agents": result, "ts": datetime.now(timezone.utc).isoformat()}

@app.get("/api/h/v1/agent/dashboard")
def agent_dashboard():
    """Comprehensive dashboard: all agents + latest data."""
    agents_info = {}
    for aid in AGENTS:
        logs = _agent_logs.get(aid, [])
        agents_info[aid] = {
            "total_logs": len(logs),
            "last_5": logs[-5:] if logs else [],
            "active": len(logs) > 0 and (datetime.now(timezone.utc).timestamp() - 
                datetime.fromisoformat(logs[-1]["timestamp"].replace("Z", "+00:00")).timestamp() < 7200)
        }
    return {"ts": datetime.now(timezone.utc).isoformat(), "agents": agents_info}

@app.post("/api/h/v1/agent/log")
def agent_log_post(req: AgentLogReq):
    """Record an agent work log entry."""
    e = _log_action(req.agent_id, req.action, req.result, req.timestamp)
    return {"ok": True, "entry": e}

@app.get("/api/h/v1/agent/log/{agent_id}")
def agent_log_get(agent_id: str, limit: int = 50, offset: int = 0):
    """Get agent work logs with pagination."""
    logs = _agent_logs.get(agent_id, [])
    total = len(logs)
    start = max(0, total - offset - limit)
    end = total - offset
    return {"agent": agent_id, "total": total, "logs": logs[start:end]}

@app.get("/api/h/v1/agent/log/{agent_id}/latest")
def agent_log_latest(agent_id: str):
    """Get agent's most recent log entry."""
    logs = _agent_logs.get(agent_id, [])
    if not logs:
        return {"agent": agent_id, "log": None, "message": "No logs yet"}
    return {"agent": agent_id, "log": logs[-1]}

@app.get("/api/h/v1/agent/work/{agent_id}")
def agent_work(agent_id: str):
    """Run autonomous work cycle for one agent. Executes its core skills and logs results."""
    ts = datetime.now(timezone.utc).isoformat()
    summary = ""
    
    if agent_id == "onchain":
        # 链上猎手: wallet status + market scan
        parts = []
        try:
            ok, out = _onchainos("system", "wallet", "status")
            parts.append(f"钱包: {'已登录' if ok else '未登录'}")
        except Exception:
            parts.append("钱包: 检查失败")
        if _okx:
            try:
                scan = h_scan()
                if "_error" not in scan:
                    with_sig = sum(1 for r in scan.get("results", []) if r.get("signals_count", 0) > 0)
                    parts.append(f"市场扫描: {scan['coins_scanned']}币种/{with_sig}信号")
            except Exception:
                parts.append("市场扫描: 异常")
        summary = " | ".join(parts) if parts else "链上猎手待命"
    
    elif agent_id == "zhuge":
        # 诸葛策略: BTC deep analysis + multi-coin scan
        if _okx:
            try:
                analysis = h_analysis("BTC")
                if "_error" not in analysis:
                    r = analysis.get("regime", {})
                    pd = analysis.get("prediction", {})
                    sigs = analysis.get("signals", [])
                    summary = f"BTC ${analysis['price']} | HURST {r.get('hurst')}({r.get('state')}) | {pd.get('bias')} 置信{pd.get('confidence')}% | 信号{len(sigs)}个"
                else:
                    summary = f"BTC分析异常: {analysis['_error'][:60]}"
            except Exception as e:
                summary = f"分析异常: {str(e)[:100]}"
        else:
            summary = "CCXT不可用"
    
    elif agent_id == "worldcup":
        # AI预言帝: update polymarket odds
        try:
            odds = pm_worldcup_odds()
            n = len(odds.get("markets", []))
            top = odds["markets"][0]["question"][:40] if n > 0 else "无数据"
            summary = f"赔率更新: {n}市场 | 热度最高: {top}"
        except Exception as e:
            summary = f"赔率更新异常: {str(e)[:100]}"
    
    elif agent_id == "wealth":
        # 稳盈管家: multi-market overview
        if _okx:
            try:
                btc = _okx.fetch_ticker("BTC/USDT:USDT")
                eth = _okx.fetch_ticker("ETH/USDT:USDT")
                summary = f"BTC ${btc['last']:.0f} ({btc['percentage']:+.1f}%) | ETH ${eth['last']:.1f} ({eth['percentage']:+.1f}%)"
            except Exception as e:
                summary = f"行情获取异常: {str(e)[:100]}"
        else:
            summary = "CCXT不可用"
    
    elif agent_id == "dolphin":
        # 小海豚: system health + platform status
        parts = []
        parts.append(f"CCXT: {'OK' if _okx else '离线'}")
        try:
            ok, _ = _onchainos("system", "wallet", "status")
            parts.append(f"钱包: {'在线' if ok else '离线'}")
        except Exception:
            parts.append("钱包: 未知")
        try:
            runner = h_runner()
            parts.append(f"量化引擎: {runner.get('status', 'unknown')}")
        except Exception:
            parts.append("量化引擎: 未知")
        summary = " | ".join(parts)
    
    elif agent_id == "reward":
        # 派奖福星: campaign check
        try:
            camps = h_campaigns()
            counts = {"active": 0, "upcoming": 0}
            for c in camps.get("campaigns", []):
                counts[c.get("status", "upcoming")] = counts.get(c.get("status", "upcoming"), 0) + 1
            summary = f"活动检查: {counts.get('active',0)}进行中/{counts.get('upcoming',0)}即将开始"
        except Exception as e:
            summary = f"活动检查异常: {str(e)[:100]}"
    
    else:
        raise HTTPException(404, f"Unknown agent: {agent_id}")
    
    _log_action(agent_id, "auto_work", summary, ts)
    return {"agent": agent_id, "summary": summary, "timestamp": ts}

@app.get("/api/h/v1/agent/work/all")
def agent_work_all():
    """Trigger work cycle for all 6 agents at once."""
    results = {}
    for aid in AGENTS:
        try:
            r = agent_work(aid)
            results[aid] = r.get("summary", "OK")
        except Exception as e:
            results[aid] = f"ERROR: {str(e)[:100]}"
    _log_action("system", "work_all", f"All agents cycled: {len(results)} agents")
    return {"ts": datetime.now(timezone.utc).isoformat(), "results": results}

# Background worker — keeps agents running 24/7
_bg_task: asyncio.Task | None = None

async def _background_worker():
    """Periodic work loop. Each agent runs at its configured interval."""
    intervals = {
        "onchain": 300,   # 5 min — 链上扫描
        "zhuge": 900,     # 15 min — 策略分析
        "worldcup": 1800, # 30 min — 赔率更新
        "wealth": 1800,   # 30 min — 行情概览
        "dolphin": 3600,  # 60 min — 系统体检
        "reward": 3600,   # 60 min — 活动检查
    }
    last_run: dict[str, float] = {}
    
    # Initial startup log
    _log_action("system", "startup", f"Background worker started. {len(AGENTS)} agents monitored.")
    
    while True:
        try:
            now_ts = datetime.now(timezone.utc).timestamp()
            for aid in AGENTS:
                interval = intervals.get(aid, 900)
                last = last_run.get(aid, 0)
                if now_ts - last >= interval:
                    try:
                        agent_work(aid)
                    except Exception:
                        pass
                    last_run[aid] = now_ts
        except Exception:
            pass
        await asyncio.sleep(30)  # Check every 30 seconds

@app.on_event("startup")
async def startup():
    global _bg_task
    _bg_task = asyncio.create_task(_background_worker())
    print(f"[dolphin] Background worker started for {len(AGENTS)} agents", file=sys.stderr)

@app.on_event("shutdown")
async def shutdown():
    global _bg_task
    if _bg_task:
        _bg_task.cancel()
    _log_action("system", "shutdown", "Background worker stopped")
    print("[dolphin] Background worker stopped", file=sys.stderr)

# ==================== ONCHAIN: Market Overview & Kline & Tokens ====================

@app.get("/api/h/v1/market/overview")
def h_market_overview(symbols: str = "BTC,ETH,SOL,DOGE,AVAX,LINK,XRP,ADA"):
    """Multi-coin market overview. Prices + 24h change for onchain agent."""
    ticks = []
    for sym in [s.strip().upper() for s in symbols.split(",")]:
        try:
            if not _okx:
                ticks.append({"symbol": sym, "price": 0, "change_24h": 0, "note": "CCXT unavailable"})
                continue
            t = _okx.fetch_ticker(f"{sym}/USDT:USDT")
            ticks.append({
                "symbol": sym, "price": t["last"],
                "change_24h": round(t["percentage"] or 0, 2),
                "high_24h": t["high"], "low_24h": t["low"], "volume_24h": t["baseVolume"],
            })
        except Exception:
            ticks.append({"symbol": sym, "price": 0, "change_24h": 0, "note": "fetch failed"})
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(), "count": len(ticks), "tickers": ticks,
        "top_gainer": max(ticks, key=lambda x: x.get("change_24h", 0)) if ticks else None,
        "top_loser": min(ticks, key=lambda x: x.get("change_24h", 0)) if ticks else None,
    }

@app.get("/api/h/v1/market/kline/{symbol}")
def h_kline(symbol: str, timeframe: str = "1h", limit: int = 50):
    """OHLCV kline data for price charts."""
    if not _okx: return {"_error": "CCXT unavailable"}
    try:
        candles = _okx.fetch_ohlcv(f"{symbol.upper()}/USDT:USDT", timeframe=timeframe, limit=limit)
        return {"symbol": symbol.upper(), "timeframe": timeframe, "latest": candles[-1][4] if candles else 0,
                "high": max(c[2] for c in candles) if candles else 0,
                "low": min(c[3] for c in candles) if candles else 0,
                "candles": [{"time": c[0], "open": c[1], "high": c[2], "low": c[3], "close": c[4], "vol": c[5]} for c in candles]}
    except Exception as e:
        return {"_error": str(e)[:200]}

@app.get("/api/h/v1/market/tokens")
def h_tokens(q: str = "", limit: int = 20):
    """Token search via CCXT market data."""
    if not _okx: return {"query": q, "results": [], "note": "CCXT unavailable"}
    try:
        markets = _okx.load_markets()
        results = []
        q_upper = q.upper().strip() if q else ""
        for sym, info in list(markets.items())[:500]:
            if ":USDT" not in sym: continue
            base = sym.split("/")[0]
            if q_upper and q_upper not in base: continue
            results.append({"symbol": base, "pair": sym, "type": info.get("type", "swap")})
            if len(results) >= limit: break
        return {"query": q, "count": len(results), "results": results}
    except Exception as e:
        return {"query": q, "results": [], "note": str(e)[:200]}

# ==================== ONCHAIN: Swap & Bridge ====================

@app.post("/api/h/v1/swap/quote")
def h_swap_quote(req: SwapReq):
    """DEX swap quote — estimates output via CCXT orderbook mid-price."""
    if not _okx: return {"_error": "CCXT unavailable"}
    try:
        pair = f"{req.from_token.upper()}/{req.to_token.upper()}"
        ticker = None
        fee_rate = 0.003
        try:
            ticker = _okx.fetch_ticker(pair if req.to_token.upper() != "USDT" else f"{pair}:{req.to_token.upper()}")
        except Exception:
            try:
                t1 = _okx.fetch_ticker(f"{req.from_token.upper()}/USDT")
                t2 = _okx.fetch_ticker(f"{req.to_token.upper()}/USDT")
                if t1 and t2 and t2["last"] > 0:
                    ticker = {"last": t1["last"] / t2["last"]}
            except Exception:
                pass
        if not ticker:
            return {"_error": f"Cannot find route for {req.from_token}→{req.to_token}"}
        price = ticker["last"]
        output = req.amount * price * (1 - fee_rate)
        price_impact = round(0.05 + (req.amount / 100000) * 2, 2)
        return {
            "from_token": req.from_token.upper(), "to_token": req.to_token.upper(),
            "from_amount": req.amount, "to_amount": round(output, 6),
            "price": round(price, 6), "fee_rate": fee_rate,
            "estimated_fee": round(req.amount * fee_rate, 6),
            "price_impact_pct": price_impact, "route": f"{req.from_token.upper()} → {req.to_token.upper()}",
            "sources": 500, "note": "OKX DEX 聚合 500+ 流动性源，此报价为预估",
        }
    except Exception as e:
        return {"_error": str(e)[:200]}

@app.get("/api/h/v1/bridge/chains")
def h_bridge_chains():
    """List supported chains & protocols for cross-chain bridge."""
    return {
        "chains": [
            {"name": "Ethereum", "id": "ethereum", "native": "ETH"},
            {"name": "X Layer", "id": "xlayer", "native": "OKB"},
            {"name": "Arbitrum", "id": "arbitrum", "native": "ETH"},
            {"name": "Optimism", "id": "optimism", "native": "ETH"},
            {"name": "Base", "id": "base", "native": "ETH"},
            {"name": "BSC", "id": "bsc", "native": "BNB"},
            {"name": "Polygon", "id": "polygon", "native": "POL"},
            {"name": "Solana", "id": "solana", "native": "SOL"},
            {"name": "Avalanche", "id": "avalanche", "native": "AVAX"},
        ],
        "protocols": [
            {"name": "Stargate", "type": "liquidity_pool", "fee": "0.06%"},
            {"name": "Across", "type": "intent_based", "fee": "0.04%"},
            {"name": "Relay", "type": "bridge_aggregator", "fee": "dynamic"},
            {"name": "Gas.zip", "type": "gas_refuel", "fee": "flat"},
        ],
        "note": "跨链桥聚合 — 自动选最优路径"
    }

@app.post("/api/h/v1/bridge/quote")
def h_bridge_quote(req: BridgeReq):
    """Cross-chain bridge quote estimate."""
    bridge_fee_pct = 0.08
    gas_estimate = 5.0
    est_time = {"ethereum": 15, "arbitrum": 8, "optimism": 10, "base": 8, "xlayer": 5, "bsc": 5, "polygon": 7, "solana": 3, "avalanche": 6}
    return {
        "from_chain": req.from_chain, "to_chain": req.to_chain, "token": req.token.upper(), "amount": req.amount,
        "estimated_receive": round(req.amount * (1 - bridge_fee_pct / 100), 6),
        "bridge_fee_pct": bridge_fee_pct, "bridge_fee_amount": round(req.amount * bridge_fee_pct / 100, 6),
        "estimated_gas_usd": gas_estimate, "estimated_time_min": est_time.get(req.to_chain.lower(), 10),
        "recommended_protocol": "Across", "note": "此为预估报价。实际以链上确认为准。"
    }

# ==================== ONCHAIN: Signals, Meme, Security, Gas Station ====================

@app.get("/api/h/v1/signals/smart-money")
def h_smart_money(chain: str = "ethereum", wallet_type: str = "", limit: int = 20):
    """Smart money / whale / KOL signal feed — calls onchainos signal list."""
    signals = []
    source = "onchainos signal list"
    try:
        args = ["signal", "list", "--chain", chain, "--limit", str(min(limit, 100))]
        if wallet_type:
            args += ["--wallet-type", wallet_type]
        ok, out = _onchainos("system", *args)
        if ok:
            try:
                data = json.loads(out)
                if isinstance(data, list):
                    signals = data
                elif isinstance(data, dict):
                    signals = data.get("data", data.get("signals", data.get("results", [])))
                source = "OnchainOS Smart Money"
                note = "链上实时聪明钱/KOL/鲸鱼信号"
            except json.JSONDecodeError:
                note = f"onchainos 返回解析失败: {out[:200]}"
        else:
            note = f"onchainos 命令失败: {out[:200]}"
    except Exception as e:
        note = f"onchainos 异常: {str(e)[:200]}"

    if not signals:
        note = note or "暂无链上信号数据"
        # Fallback: CCXT market scan (not real smart money)
        if _okx:
            try:
                scan = h_scan()
                if scan and "_error" not in scan:
                    for r in scan.get("results", []):
                        if r.get("signals_count", 0) > 0:
                            rr = r.get("best_rr", 0)
                            signals.append({"symbol": r["symbol"], "price": r.get("price", 0),
                                          "trend": r.get("trend_4h", "?"), "signal_count": r.get("signals_count", 0),
                                          "best_rr": rr, "whale_activity": "FALLBACK"})
                    signals.sort(key=lambda x: (x.get("signal_count", 0), x.get("best_rr", 0)), reverse=True)
                source = "CCXT market scan (fallback)"
                note = "⚠️ 链上数据暂时不可用，显示行情扫描结果"
            except Exception:
                pass

    # Normalize signal format: onchainos uses token.symbol, fallback uses top-level symbol
    def _sig_symbol(s):
        t = s.get("token")
        return t.get("symbol", "?") if isinstance(t, dict) else s.get("symbol", "?")
    return {"source": source, "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_signals": len(signals), "signals": signals[:limit],
            "top_pick": _sig_symbol(signals[0]) if signals else None,
            "note": note}

@app.get("/api/h/v1/meme/scan")
def h_meme_scan(chain: str = "solana", limit: int = 20):
    """Meme token / new launch scanning — calls onchainos memepump tokens."""
    meme_data = []
    source = "onchainos memepump"
    note = ""
    try:
        ok, out = _onchainos("system", "memepump", "tokens", "--chain", chain, "--limit", str(min(limit, 100)))
        if ok:
            try:
                parsed = json.loads(out)
                if isinstance(parsed, list): meme_data = parsed
                elif isinstance(parsed, dict): meme_data = parsed.get("data", parsed.get("tokens", parsed.get("results", [])))
                source = "OnchainOS Meme Pump"
                note = f"链上实时 Meme 扫描 ({chain})"
            except json.JSONDecodeError:
                note = f"onchainos 返回解析失败: {out[:200]}"
        else:
            note = f"onchainos 命令失败: {out[:200]}"
    except Exception as e:
        note = f"onchainos 异常: {str(e)[:200]}"

    # Fallback: CCXT low-cap tokens
    if not meme_data and _okx:
        try:
            markets = _okx.load_markets()
            candidates = []
            for sym, info in list(markets.items())[:500]:
                if ":USDT" not in sym: continue
                base = sym.split("/")[0]
                # Include meme keywords OR tokens with very short names (likely meme)
                is_meme = any(kw in base for kw in ["MEME", "PEPE", "DOGE", "SHIB", "BONK", "WIF", "FLOKI", "MOODENG", "TRUMP", "PNUT"])
                is_short = len(base) <= 4  # Short tickers more likely meme/shitcoin
                if is_meme or is_short:
                    candidates.append(sym)
            for sym in candidates[:15]:
                try:
                    t = _okx.fetch_ticker(sym)
                    base = sym.split("/")[0]
                    pct = t.get("percentage", 0)
                    risk = "HIGH" if pct and abs(pct) > 20 else "MEDIUM"
                    meme_data.append({"symbol": base, "price": t["last"], "change_24h": pct or 0,
                                     "volume_24h": t.get("baseVolume", 0), "risk_level": risk, "type": "meme_coin"})
                except Exception:
                    pass
        except Exception:
            pass

    return {"source": "Meme Scanner", "timestamp": datetime.now(timezone.utc).isoformat(),
            "tokens_scanned": len(meme_data), "tokens": meme_data[:10],
            "new_launches_24h": len([t for t in meme_data if t.get("price", 0) < 0.001]),
            "note": "Meme扫链: 低市值代币 + 新币发射检测。高波动风险，DYOR。"}

@app.post("/api/h/v1/security/scan")
def h_security_scan(req: SecurityReq):
    """Security scan for token/contract. Risk assessment + 10-dimension check."""
    checks = [
        {"check": "honeypot", "name": "蜜罐检测", "status": "PASS", "risk": "LOW"},
        {"check": "rugpull", "name": "Rug Pull 风险", "status": "PASS", "risk": "LOW"},
        {"check": "liquidity", "name": "流动性锁仓", "status": "INFO", "risk": "MEDIUM", "detail": "需链上验证"},
        {"check": "owner_control", "name": "Owner 权限", "status": "INFO", "risk": "MEDIUM", "detail": "需链上验证"},
        {"check": "contract_verified", "name": "合约开源", "status": "INFO", "risk": "LOW"},
        {"check": "wash_trading", "name": "虚假交易", "status": "PASS", "risk": "LOW"},
        {"check": "supply_concentration", "name": "筹码集中度", "status": "INFO", "risk": "MEDIUM", "detail": "Top 10 持仓需链上查询"},
        {"check": "proxy_upgrade", "name": "可升级代理", "status": "INFO", "risk": "LOW"},
        {"check": "fee_modifiable", "name": "税率可修改", "status": "INFO", "risk": "MEDIUM", "detail": "需链上验证"},
        {"check": "blacklist", "name": "黑名单功能", "status": "INFO", "risk": "LOW"},
    ]
    high = [c for c in checks if c["risk"] == "HIGH"]
    medium = [c for c in checks if c["risk"] == "MEDIUM"]
    overall = "HIGH_RISK" if high else ("CAUTION" if len(medium) > 3 else "PASS")
    return {
        "target": req.address or req.symbol, "chain": req.chain,
        "timestamp": datetime.now(timezone.utc).isoformat(), "overall_risk": overall,
        "score": max(0, 100 - len(medium) * 8 - len(high) * 25), "checks": checks,
        "simulated": True,
        "disclaimer": "⚠️ 模拟检测：所有结果均为预估值，不构成安全审计。完整安全审计请使用 onchainos 命令行执行链上实时验证。切勿仅凭此结果做出投资决策。",
        "recommendation": "⚠️ 模拟检测仅供参考。完整安全审计需链上实时验证。建议通过 onchainos 命令行执行深度扫描。",
        "action_required": len(medium) > 2,
    }

@app.get("/api/h/v1/gas-station/info")
def h_gas_station():
    """Gas Station — EIP-7702 stablecoin gas feature info."""
    return {
        "feature": "OKX Gas Station", "protocol": "EIP-7702",
        "description": "使用稳定币 (USDT/USDC) 支付 Gas，无需持有原生代币",
        "supported_chains": [
            {"chain": "X Layer", "stablecoins": ["USDT", "USDC"], "relayer": "OKX Relayer"},
            {"chain": "Arbitrum", "stablecoins": ["USDT", "USDC", "DAI"], "relayer": "OKX Relayer"},
            {"chain": "Base", "stablecoins": ["USDC"], "relayer": "OKX Relayer"},
            {"chain": "BSC", "stablecoins": ["USDT", "USDC"], "relayer": "OKX Relayer"},
        ],
        "fees": {"service_fee": "0.5% (最低 $0.10)", "relayer_subsidy": "OKX 补贴部分 Gas"},
        "how_to_enable": "通过 onchainos CLI 或 Agent Wallet 设置中开启 Gas Station",
        "how_to_disable": "onchainos gas-station disable 或钱包设置中关闭",
        "note": "基于 EIP-7702 的 Relayer 方案，非 ERC-4337 Paymaster。永不混淆。"
    }

# ==================== ONCHAIN: Wallet Balance ====================

@app.get("/api/h/v1/wallet/balance")
def wallet_balance(request: Request):
    """Get full wallet balance across chains via onchainos CLI (user-scoped)."""
    uid = getattr(request.state, "user_id", "")
    if not uid:
        return JSONResponse(status_code=401, content={"error": "Authentication required"})
    ok, out = _onchainos(uid, "wallet", "balance")
    if ok:
        try:
            parsed = json.loads(out)
            return {"ok": True, "balance": parsed}
        except Exception:
            # Always return a "balance" field so frontend can parse it
            return {"ok": True, "balance": {"raw": out[:2000], "note": "Non-JSON output — check Agent Wallet formatting"}}
    return {"ok": False, "logged_in": False, "balance": None,
            "message": out[:500] or "Wallet not logged in. Please login first.",
            "note": "通过 OKX Agent Wallet TEE 安全查询"}


@app.get("/api/h/v1/wallet/history")
def wallet_history(request: Request, chain: str = "", limit: int = 20):
    """Query transaction history via onchainos wallet history (user-scoped)."""
    uid = getattr(request.state, "user_id", "")
    if not uid:
        return JSONResponse(status_code=401, content={"error": "Authentication required"})
    args = ["wallet", "history", "--limit", str(min(limit, 50))]
    if chain: args += ["--chain", chain]
    ok, out = _onchainos(uid, *args)
    if ok:
        try:
            parsed = json.loads(out)
            return {"ok": True, "history": parsed}
        except json.JSONDecodeError:
            return {"ok": True, "history": [], "raw": out[:1000]}
    return {"ok": False, "history": [], "message": out[:500]}


# ==================== POLYMARKET: Trade ====================

@app.post("/api/h/v1/polymarket/trade")
def pm_trade(req: TradeReq):
    """Place a trade on Polymarket — buy YES/NO shares."""
    args = ["trade"]
    if req.market_id: args += ["--market-id", req.market_id]
    if req.market_slug: args += ["--market", req.market_slug]
    args += ["--side", req.side, "--amount", str(req.amount_usd)]
    data = _polymarket(*args)
    if not data:
        return {"ok": False, "action": "trade",
                "market_id": req.market_id or req.market_slug, "side": req.side, "amount_usd": req.amount_usd,
                "error": "CLI trade failed — wallet may not be initialized. Run 'polymarket-plugin quickstart' to set up.",
                "note": "请先通过 onchainos wallet login 登录钱包，然后 polymarket-plugin quickstart 初始化"}
    _log_action("worldcup", "trade", f"{req.side.upper()} ${req.amount_usd} on {req.market_id or req.market_slug}")
    return {"ok": True, "action": "trade", "result": data,
            "market_id": req.market_id or req.market_slug, "side": req.side, "amount_usd": req.amount_usd,
            "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== BACKTEST ENGINE ====================

def _run_backtest(symbol: str, strategy_id: str, days: int, capital: float):
    """Core backtest: run strategy over historical OHLCV, return metrics."""
    if not _okx or np is None:
        return {"_error": "CCXT or numpy unavailable"}
    try:
        tf = "15m" if "h1" in strategy_id else "4h"
        cpd = 96 if tf == "15m" else (24 if tf == "1h" else 6)
        limit = min(days * cpd, 1500)
        ohlcv = _okx.fetch_ohlcv(f"{symbol.upper()}/USDT:USDT", timeframe=tf, limit=limit)
        closes = [c[4] for c in ohlcv]
        highs = [c[2] for c in ohlcv]
        lows = [c[3] for c in ohlcv]
        if len(closes) < 50:
            return {"_error": f"Insufficient data: {len(closes)} candles"}
        
        trades = []
        position = None
        equity = capital
        max_eq = capital
        min_eq = capital
        warmup = min(50, len(closes) // 3)
        
        for i in range(warmup, len(closes)):
            curr = closes[i]
            wc = closes[max(0, i-20):i+1]
            
            if strategy_id in ("h1-bb-regression",):
                ma = sum(wc) / len(wc)
                std_val = float(np.std(wc)) if len(wc) > 1 else 0.01
                upper = ma + 2 * std_val
                lower = ma - 2 * std_val
                if position is None:
                    if curr <= lower:
                        position = {"side": "LONG", "entry": curr, "sl": curr * 0.985, "tp": ma, "entry_idx": i}
                    elif curr >= upper:
                        position = {"side": "SHORT", "entry": curr, "sl": curr * 1.015, "tp": ma, "entry_idx": i}
                else:
                    exit_sig = False
                    exit_price = curr
                    exit_reason = ""
                    if position["side"] == "LONG":
                        if curr <= position["sl"]: exit_sig, exit_reason = True, "SL"
                        elif curr >= position["tp"]: exit_sig, exit_reason = True, "TP"
                    else:
                        if curr >= position["sl"]: exit_sig, exit_reason = True, "SL"
                        elif curr <= position["tp"]: exit_sig, exit_reason = True, "TP"
                    if exit_sig:
                        pnl = (exit_price - position["entry"]) / position["entry"]
                        if position["side"] == "SHORT": pnl = -pnl
                        pnl_usd = capital * 0.1 * pnl
                        equity += pnl_usd
                        trades.append({"side": position["side"], "entry": round(position["entry"], 2),
                                      "exit": round(exit_price, 2), "pnl_pct": round(pnl * 100, 2),
                                      "pnl_usd": round(pnl_usd, 2), "reason": exit_reason})
                        position = None
            else:  # h3-pivot-support
                if i < 20: continue
                h20 = max(highs[i-20:i+1])
                l20 = min(lows[i-20:i+1])
                pp = (h20 + l20 + curr) / 3
                r1 = 2 * pp - l20
                s1 = 2 * pp - h20
                s2 = pp - (h20 - l20)
                r2 = pp + (h20 - l20)
                if position is None:
                    if curr <= s1 * 1.01:
                        position = {"side": "LONG", "entry": curr, "sl": s2, "tp": pp, "entry_idx": i}
                    elif curr >= r1 * 0.99:
                        position = {"side": "SHORT", "entry": curr, "sl": r2, "tp": pp, "entry_idx": i}
                else:
                    exit_sig = False
                    exit_price = curr
                    exit_reason = ""
                    if position["side"] == "LONG":
                        if curr <= position["sl"]: exit_sig, exit_reason = True, "SL"
                        elif curr >= position["tp"]: exit_sig, exit_reason = True, "TP"
                    else:
                        if curr >= position["sl"]: exit_sig, exit_reason = True, "SL"
                        elif curr <= position["tp"]: exit_sig, exit_reason = True, "TP"
                    if exit_sig:
                        pnl = (exit_price - position["entry"]) / position["entry"]
                        if position["side"] == "SHORT": pnl = -pnl
                        pnl_usd = capital * 0.1 * pnl
                        equity += pnl_usd
                        trades.append({"side": position["side"], "entry": round(position["entry"], 2),
                                      "exit": round(exit_price, 2), "pnl_pct": round(pnl * 100, 2),
                                      "pnl_usd": round(pnl_usd, 2), "reason": exit_reason})
                        position = None
            max_eq = max(max_eq, equity)
            min_eq = min(min_eq, equity)
        
        # Close open position
        if position is not None:
            last_price = closes[-1]
            pnl = (last_price - position["entry"]) / position["entry"]
            if position["side"] == "SHORT": pnl = -pnl
            pnl_usd = capital * 0.1 * pnl
            equity += pnl_usd
            trades.append({"side": position["side"], "entry": round(position["entry"], 2),
                          "exit": round(last_price, 2), "pnl_pct": round(pnl * 100, 2),
                          "pnl_usd": round(pnl_usd, 2), "reason": "CLOSE_EOD"})
        
        # Metrics
        wins = [t for t in trades if t["pnl_usd"] > 0]
        losses = [t for t in trades if t["pnl_usd"] <= 0]
        wr = len(wins) / len(trades) * 100 if trades else 0
        avg_w = sum(t["pnl_pct"] for t in wins) / len(wins) if wins else 0
        avg_l = sum(t["pnl_pct"] for t in losses) / len(losses) if losses else 0
        pf = abs(sum(t["pnl_usd"] for t in wins)) / abs(sum(t["pnl_usd"] for t in losses)) if losses and sum(t["pnl_usd"] for t in losses) != 0 else (99 if wins else 0)
        mdd = (max_eq - min_eq) / max_eq * 100 if max_eq > 0 else 0
        rets = [t["pnl_pct"] for t in trades]
        sharpe = (np.mean(rets) / np.std(rets) * np.sqrt(252)) if len(rets) > 1 and np.std(rets) > 0 else 0
        
        names = {"h1-bb-regression": "H1 BB均值回归", "h3-pivot-support": "H3 支撑狙击"}
        result = {
            "id": f"bt_{symbol.lower()}_{strategy_id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "symbol": symbol.upper(), "strategy": strategy_id,
            "strategy_name": names.get(strategy_id, strategy_id),
            "timeframe": tf, "period_days": days, "initial_capital": capital,
            "final_equity": round(equity, 2),
            "metrics": {
                "total_return_pct": round((equity - capital) / capital * 100, 2),
                "total_trades": len(trades), "win_trades": len(wins), "loss_trades": len(losses),
                "win_rate_pct": round(wr, 1), "avg_win_pct": round(avg_w, 2),
                "avg_loss_pct": round(avg_l, 2), "profit_factor": round(pf, 2),
                "max_drawdown_pct": round(mdd, 2), "sharpe_ratio": round(sharpe, 2),
            },
            "trades": trades[-30:],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        _save_backtest(result)
        return result
    except Exception as e:
        return {"_error": str(e)[:500]}

@app.post("/api/h/v1/market/backtest")
def h_backtest(req: BacktestReq):
    """Run a strategy backtest over historical data."""
    if not _okx: return {"_error": "CCXT unavailable"}
    if np is None: return {"_error": "numpy unavailable"}
    result = _run_backtest(req.symbol, req.strategy, req.days, req.initial_capital)
    if "_error" not in result:
        m = result["metrics"]
        _log_action("zhuge", "backtest", f"{req.symbol} {req.strategy}: {m['total_return_pct']}% WR {m['win_rate_pct']}% PF {m['profit_factor']}")
    return result

@app.get("/api/h/v1/market/backtest/history")
def h_backtest_history(limit: int = 10):
    """Get previous backtest results."""
    bts = _load_backtests(limit)
    return {"count": len(bts), "backtests": [
        {"id": bt.get("id", "?"), "symbol": bt.get("symbol", "?"),
         "strategy": bt.get("strategy_name", bt.get("strategy", "?")),
         "return_pct": bt.get("metrics", {}).get("total_return_pct", 0),
         "win_rate": bt.get("metrics", {}).get("win_rate_pct", 0),
         "trades": bt.get("metrics", {}).get("total_trades", 0),
         "sharpe": bt.get("metrics", {}).get("sharpe_ratio", 0),
         "timestamp": bt.get("timestamp", "")}
        for bt in bts
    ]}

@app.get("/api/h/v1/agent/positions")
def h_positions():
    """Get current positions via CCXT (requires API keys) or onchainos."""
    positions = []
    if _okx:
        try:
            for p in _okx.fetch_positions():
                if float(p.get("contracts", 0)) != 0:
                    positions.append({"symbol": p.get("symbol", "?"), "side": p.get("side", "?"),
                                     "size": p.get("contracts", 0), "entry_price": p.get("entryPrice", 0),
                                     "mark_price": p.get("markPrice", 0),
                                     "pnl_usd": round(float(p.get("unrealizedPnl", 0)), 2),
                                     "pnl_pct": round(float(p.get("percentage", 0)), 2)})
        except Exception: pass
    if not positions:
        try:
            ok, out = _onchainos("system", "wallet", "positions")
            if ok:
                try:
                    parsed = json.loads(out)
                    if isinstance(parsed, list): positions = parsed
                except Exception: pass
        except Exception: pass
    return {"timestamp": datetime.now(timezone.utc).isoformat(), "positions": positions, "count": len(positions)}

import uvicorn
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
