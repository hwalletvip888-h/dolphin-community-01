import { View, Text } from "react-native";
import { List } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface PositionItem {
  symbol: string;
  side: string;
  size: string;
  entry: string;
  pnl: string;
}

export default function PositionsCard({ items }: { items: PositionItem[] }) {
  return (
    <GlassCard className="my-2">
      <View className="px-4 py-2 border-b border-white/5 flex-row items-center gap-1.5">
        <List size={13} color="white" opacity={0.5} />
        <Text className="text-[12px] font-semibold text-white/60">当前持仓</Text>
      </View>
      {items.map((item, i) => {
        const isLong = item.side === "long";
        const isNegative = item.pnl.startsWith("-");
        return (
          <View key={i} className={`px-4 py-3 ${i < items.length - 1 ? "border-b border-white/5" : ""}`}>
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-[13px] font-semibold text-white/80">{item.symbol}</Text>
              <Text className="text-[12px] font-medium" style={{ color: isLong ? "#34D399" : "#F87171" }}>
                {isLong ? "多" : "空"} {item.size}张
              </Text>
              <Text className="text-[13px] font-semibold ml-auto" style={{ color: isNegative ? "#F87171" : "#34D399" }}>
                {item.pnl}
              </Text>
            </View>
            <Text className="text-[12px] text-white/40">入场 {item.entry}</Text>
          </View>
        );
      })}
    </GlassCard>
  );
}
