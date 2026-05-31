import type { CardData } from "@/src/types";
import { OddsCard } from "./OddsCard";
import { PriceCard } from "./PriceCard";
import { SignalCard } from "./SignalCard";
import { PositionsCard } from "./PositionsCard";
import { BalanceCard } from "./BalanceCard";
import { AccountCard } from "./AccountCard";
import { ScanCard } from "./ScanCard";

const map: Record<string, React.FC<any>> = {
  odds: OddsCard, price: PriceCard, signal: SignalCard,
  positions: PositionsCard, balance: BalanceCard,
  account: AccountCard, scan: ScanCard,
};

export function CardRenderer({ data }: { data: CardData }) {
  const C = map[data.type];
  if (!C) return null;
  return <C {...(data as any)} />;
}
