#!/usr/bin/env python3
"""VBT Pro paper trading — simulates order execution with real market data"""
import sys, json, time
import vectorbtpro as vbt
import numpy as np

def paper_trade(symbol, direction, amount, stop_loss_pct=None, take_profit_pct=None):
    """Simulate a trade on real market data with ATR-based SL/TP"""
    try:
        data = vbt.CCXTData.fetch(f"{symbol}/USDT:USDT", exchange="okx", timeframe="1h", limit=100)
        close = data.get("Close")
        high = data.get("High")
        low = data.get("Low")
        entry_price = float(close.iloc[-1])

        # Calculate ATR
        tr = vbt.ATR.run(high, low, close, window=14)
        atr = float(tr.atr.iloc[-1])
        atr_pct = round(atr / entry_price * 100, 1)

        # Use provided SL/TP or ATR-based defaults
        sl_pct = stop_loss_pct if stop_loss_pct is not None else round(atr_pct * 2, 1)
        tp_pct = take_profit_pct if take_profit_pct is not None else round(atr_pct * 4, 1)

        if direction == "long":
            sl_price = entry_price * (1 - sl_pct / 100)
            tp_price = entry_price * (1 + tp_pct / 100)
            risk_per_unit = entry_price - sl_price
        else:
            sl_price = entry_price * (1 + sl_pct / 100)
            tp_price = entry_price * (1 - tp_pct / 100)
            risk_per_unit = sl_price - entry_price

        position_size = amount / entry_price
        max_loss = position_size * risk_per_unit

        # Simulate against recent candles to estimate outcome
        recent = close.iloc[-24:]  # last 24h
        hit_sl = False
        hit_tp = False

        for price in recent.values:
            if direction == "long":
                if float(price) <= sl_price:
                    hit_sl = True
                    break
                if float(price) >= tp_price:
                    hit_tp = True
                    break
            else:
                if float(price) >= sl_price:
                    hit_sl = True
                    break
                if float(price) <= tp_price:
                    hit_tp = True
                    break

        return {
            "ok": True,
            "paper": True,
            "symbol": symbol,
            "direction": direction,
            "entry_price": round(entry_price, 2),
            "sl_price": round(sl_price, 2),
            "tp_price": round(tp_price, 2),
            "position_size": round(position_size, 4),
            "amount": amount,
            "max_loss": round(max_loss, 2),
            "sl_pct": f"{sl_pct}%",
            "tp_pct": f"{tp_pct}%",
            "atr": round(atr, 2),
            "atr_pct": f"{atr_pct}%",
            "backtest_24h": "hit_sl" if hit_sl else "hit_tp" if hit_tp else "still_open",
            "risk_reward": round(tp_pct / sl_pct, 1) if sl_pct > 0 else 0,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}


if __name__ == "__main__":
    args = json.loads(sys.stdin.read()) if len(sys.argv) < 2 else {
        "symbol": "BTC", "direction": "long", "amount": 100
    }
    result = paper_trade(
        args.get("symbol", "BTC"),
        args.get("direction", "long"),
        float(args.get("amount", 100)),
        args.get("stop_loss_pct"),
        args.get("take_profit_pct"),
    )
    print(json.dumps(result, ensure_ascii=False))
