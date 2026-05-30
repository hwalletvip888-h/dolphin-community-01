import { View, Text } from "react-native";
import { TrendingUp, TrendingDown, Minus } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface PriceItem {
  symbol: string;
  price: string;
  change: string;
  high?: string;
  low?: string;
}

function TrendIcon({ change }: { change: string }) {
  const v = parseFloat(change);
  if (isNaN(v) || v === 0) return <Minus size={14} color="white" opacity={0.4} />;
  if (v > 0) return <TrendingUp size={14} color="#34D399" />;
  return <TrendingDown size={14} color="#F87171" />;
}

export default function PriceCard({ items }: { items: PriceItem[] }) {
  return (
    <GlassCard className="my-2">
      {items.map((item, i) => {
        const v = parseFloat(item.change);
        const color = isNaN(v) ? "#9CA3AF" : v > 0 ? "#34D399" : "#F87171";
        return (
          <View key={i} className={`px-4 py-3 flex-row items-center justify-between ${i < items.length - 1 ? "border-b border-white/5" : ""}`}>
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                <Text className="text-[11px] font-bold text-white/80">{item.symbol.slice(0, 3)}</Text>
              </View>
              <Text className="text-[14px] font-semibold text-white/90">{item.symbol}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[16px] font-bold text-white">{item.price}</Text>
              <View className="flex-row items-center gap-1">
                <TrendIcon change={item.change} />
                <Text className="text-[12px] font-medium" style={{ color }}>{item.change}%</Text>
              </View>
            </View>
          </View>
        );
      })}
    </GlassCard>
  );
}
