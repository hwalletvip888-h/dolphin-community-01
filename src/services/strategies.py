"""
海豚策略引擎 — VBT Pro 回测 + 信号生成

每个策略定义:
  - name, description, suitable market conditions
  - entry rules, exit rules (TP), stop loss rules
  - VBT Pro backtest function
  - Signal generation function

运行: python3 strategies.py '{"strategy":"h1-bb","symbol":"BTC/USDT:USDT"}'
"""

import sys, json, warnings, math
warnings.filterwarnings("ignore")

import numpy as np
import ccxt

# VBT Pro (licensed — may not be available on all machines)
try:
    import vectorbtpro as vbt
    HAS_VBT = True
except ImportError:
    HAS_VBT = False

def _safe_round(val, digits=1):
    try:
        v = float(val)
        if math.isnan(v) or math.isinf(v): return 0
        return round(v, digits)
    except:
        return 0

# ── Data ──────────────────────────────────────────
def fetch_data(symbol="BTC/USDT:USDT", timeframe="1h", limit=500):
    """Fetch OHLCV from OKX via CCXT + VBT."""
    data = vbt.CCXTData.pull(
        symbol, timeframe=timeframe, limit=limit,
        exchange="okx", show_progress=False
    )
    return data

# ═══════════════════════════════════════════════════
# Strategy 1: H1 BB Mean Reversion
# ═══════════════════════════════════════════════════
def h1_bb_regression(data):
    """Bollinger Band mean reversion — oversold buy, overbought sell."""
    close = data.close
    bb = vbt.BBANDS.run(close, window=20, alpha=2)

    entries = bb.lower_above(close)   # Price below lower band
    exits   = bb.middle_above(close)  # Price back above middle

    # Stop loss: 3% below entry
    sl_price = close * 0.97  # Hard 3% stop
    return entries, exits, sl_price

# ═══════════════════════════════════════════════════
# Strategy 2: H3 Pivot Support
# ═══════════════════════════════════════════════════
def h3_pivot_support(data):
    """Pivot point support — buy at support bounce."""
    high, low, close = data.high, data.low, data.close
    pp = (high + low + close) / 3
    s1 = 2 * pp - high
    s2 = pp - (high - low)

    entries = close < s1 * 0.995  # Price near support
    exits = close > pp            # Price back above pivot

    sl_price = s2  # Next support level as stop
    return entries, exits, sl_price

# ═══════════════════════════════════════════════════
# Strategy 3: EMA Trend Following
# ═══════════════════════════════════════════════════
def ema_trend(data):
    """EMA crossover — trend following."""
    close = data.close
    fast_ma = vbt.MA.run(close, window=12).ma
    slow_ma = vbt.MA.run(close, window=26).ma

    entries = fast_ma > slow_ma  # Golden cross
    exits   = fast_ma < slow_ma  # Death cross

    sl_price = close * 0.95  # Hard 5% stop
    return entries, exits, sl_price

# ═══════════════════════════════════════════════════
# Backtest Engine
# ═══════════════════════════════════════════════════
STRATEGIES = {
    "h1-bb": ("H1 布林带均值回归", h1_bb_regression, "震荡市最佳, 趋势市慎用"),
    "h3-pivot": ("H3 Pivot 支撑狙击", h3_pivot_support, "支撑位反弹, 窄幅震荡适用"),
    "ema-trend": ("EMA 金叉趋势", ema_trend, "趋势市最佳, 震荡市易假突破"),
}

def run_backtest(strategy_name, symbol="BTC/USDT:USDT", timeframe="4h", limit=500):
    if strategy_name not in STRATEGIES:
        return {"ok": False, "error": f"Unknown strategy: {strategy_name}"}

    name, fn, note = STRATEGIES[strategy_name]

    try:
        data = fetch_data(symbol, timeframe, limit)
        entries, exits, sl = fn(data)

        # Run portfolio backtest
        pf = vbt.Portfolio.from_signals(
            data.close, entries, exits,
            sl_stop=sl,
            freq="1h",
            init_cash=10000,
            fees=0.0005,      # 0.05% per trade
            slippage=0.001,   # 0.1% slippage
        )

        stats = pf.stats()
        trades_df = pf.trades.records_readable

        # Current signal
        last_entry = bool(entries.values[-1]) if len(entries) > 0 else False
        current_price = float(data.close.values[-1])

        result = {
            "ok": True,
            "strategy": strategy_name,
            "name": name,
            "note": note,
            "symbol": symbol,
            "timeframe": timeframe,
            "current_price": round(current_price, 2),
            "current_signal": "BUY" if last_entry else "WAIT",
            # Key metrics
            "total_return_pct": _safe_round(stats.get("Total Return [%]", 0)),
            "win_rate_pct": _safe_round(stats.get("Win Rate [%]", 0)),
            "sharpe_ratio": _safe_round(stats.get("Sharpe Ratio", 0), 2),
            "max_drawdown_pct": _safe_round(stats.get("Max Drawdown [%]", 0)),
            "profit_factor": _safe_round(stats.get("Profit Factor", 0), 2),
            "total_trades": int(stats.get("Total Trades", 0) or 0),
            "avg_trade_pct": _safe_round(stats.get("Avg Trade Return [%]", 0), 2),
            # Entry/TP/SL for current signal
            "entry_price": round(current_price, 2) if last_entry else None,
            "tp_price": round(current_price * 1.03, 2) if last_entry else None,  # +3% TP
            "sl_price": round(current_price * 0.97, 2) if last_entry else None,   # -3% SL
            # Recent trades
            "recent_trades": _format_recent(trades_df),
        }
        return result

    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}

def _format_recent(df):
    if df is None or len(df) == 0:
        return []
    recent = df.tail(10)
    trades_list = []
    for _, t in recent.iterrows():
        try:
            trades_list.append({
                "entry": round(float(t.get("Entry Price", t.get("Avg Entry Price", 0))), 2),
                "exit": round(float(t.get("Exit Price", t.get("Avg Exit Price", 0))), 2),
                "pnl": round(float(t.get("Return", t.get("PnL", 0))), 2),
            })
        except Exception:
            pass
    return trades_list

# ── Main ──────────────────────────────────────────
if __name__ == "__main__":
    args = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {
        "strategy": "h1-bb", "symbol": "BTC/USDT:USDT", "timeframe": "4h", "limit": 500
    }
    result = run_backtest(
        args.get("strategy", "h1-bb"),
        args.get("symbol", "BTC/USDT:USDT"),
        args.get("timeframe", "4h"),
        int(args.get("limit", 500))
    )
    print(json.dumps(result, ensure_ascii=False, default=str))
