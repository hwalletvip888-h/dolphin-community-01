import { View } from "react-native";
import { CardData } from "@/src/shared/types";
import BalanceCard from "./BalanceCard";
import BalanceEmptyCard from "./BalanceEmptyCard";
import PriceCard from "./PriceCard";
import SignalCard from "./SignalCard";
import OddsCard from "./OddsCard";
import AccountCard from "./AccountCard";
import ScanCard from "./ScanCard";
import PositionsCard from "./PositionsCard";
import SmartMoneyCard from "./SmartMoneyCard";
import BridgeCard from "./BridgeCard";
import BacktestCard from "./BacktestCard";
import GasCard from "./GasCard";
import StrategiesCard from "./StrategiesCard";

export default function ResponseCard({ data }: { data: CardData }) {
  return (
    <View>
      {data.type === "balance" && <BalanceCard total={data.total} tokens={data.tokens} />}
      {data.type === "balance_empty" && <BalanceEmptyCard message={data.message} />}
      {data.type === "price" && <PriceCard items={data.items} />}
      {data.type === "signal" && <SignalCard items={data.items} />}
      {data.type === "odds" && <OddsCard items={data.items} />}
      {data.type === "account" && <AccountCard usdc={data.usdc} pol={data.pol} positions={data.positions} />}
      {data.type === "scan" && <ScanCard coins={data.coins} signals={data.signals} top={data.top} />}
      {data.type === "positions" && <PositionsCard items={data.items} />}
      {data.type === "smart_money" && <SmartMoneyCard signals={data.signals} />}
      {data.type === "bridge" && <BridgeCard chains={data.chains} protocols={data.protocols} />}
      {data.type === "backtest" && <BacktestCard symbol={data.symbol} strategy={data.strategy} return_pct={data.return_pct} win_rate={data.win_rate} trades={data.trades} sharpe={data.sharpe} />}
      {data.type === "gas" && <GasCard chains={data.chains} note={data.note} />}
      {data.type === "strategies" && <StrategiesCard items={data.items} />}
    </View>
  );
}

export { BalanceCard, BalanceEmptyCard, PriceCard, SignalCard, OddsCard, AccountCard, ScanCard, PositionsCard, SmartMoneyCard, BridgeCard, BacktestCard, GasCard, StrategiesCard };
