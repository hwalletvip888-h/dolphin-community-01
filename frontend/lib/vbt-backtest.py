#!/usr/bin/env python3
"""VBT Pro backtest — called from Next.js zhuge pipeline"""
import sys, json
import vectorbtpro as vbt
import numpy as np

def bollinger_mean_reversion(symbol="BTC/USDT:USDT", timeframe="1h", limit=500):
    data = vbt.CCXTData.fetch(symbol, exchange="okx", timeframe=timeframe, limit=min(limit, 1000))
    close = data.get("Close")
    bb = vbt.BBANDS.run(close, window=20, alpha=2.0)
    entries = close < bb.lower
    exits = close > bb.middle
    pf = vbt.Portfolio.from_signals(close, entries, exits, freq=timeframe)
    return pf.stats()

def ema_crossover(symbol="BTC/USDT:USDT", timeframe="1h", limit=500):
    data = vbt.CCXTData.fetch(symbol, exchange="okx", timeframe=timeframe, limit=min(limit, 1000))
    close = data.get("Close")
    fast = vbt.MA.run(close, window=12)
    slow = vbt.MA.run(close, window=26)
    entries = fast.ma > slow.ma
    exits = fast.ma < slow.ma
    pf = vbt.Portfolio.from_signals(close, entries, exits, freq=timeframe)
    return pf.stats()

STRATEGIES = {
    "bollinger": bollinger_mean_reversion,
    "ema": ema_crossover,
}

if __name__ == "__main__":
    args = json.loads(sys.stdin.read()) if len(sys.argv) < 2 else {"strategy":"bollinger","symbol":"BTC/USDT:USDT","timeframe":"1h"}
    strategy = args.get("strategy", "bollinger")
    symbol = args.get("symbol", "BTC/USDT:USDT")
    timeframe = args.get("timeframe", "1h")
    limit = args.get("limit", 500)

    try:
        fn = STRATEGIES.get(strategy, bollinger_mean_reversion)
        stats = fn(symbol, timeframe, limit)
        result = {
            "ok": True,
            "strategy": strategy,
            "symbol": symbol,
            "timeframe": timeframe,
            "return_pct": f"{stats['Total Return [%]']:.1f}%",
            "win_rate": f"{stats['Win Rate [%]']:.1f}%",
            "sharpe": f"{stats['Sharpe Ratio']:.2f}",
            "trades": int(stats['Total Trades']),
            "max_dd": f"{stats['Max Drawdown [%]']:.1f}%",
            "profit_factor": f"{stats.get('Profit Factor', 0):.2f}",
        }
    except Exception as e:
        result = {"ok": False, "error": str(e)[:200]}

    print(json.dumps(result, ensure_ascii=False))
