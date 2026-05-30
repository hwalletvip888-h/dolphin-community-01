import { View, Text } from "react-native";
import { Radio } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface ScanTopItem {
  symbol: string;
  price: string;
  rr: string;
}

interface Props {
  coins: number;
  signals: number;
  top: ScanTopItem[];
}

export default function ScanCard({ coins, signals, top }: Props) {
  return (
    <GlassCard className="my-2">
      <View className="px-4 py-2 border-b border-white/5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Radio size={13} color="white" opacity={0.5} />
          <Text className="text-[12px] font-semibold text-white/60">多币扫描</Text>
        </View>
        <Text className="text-[11px] text-white/40">{coins} 币种 · {signals} 信号</Text>
      </View>
      {top.map((item, i) => (
        <View key={i} className={`px-4 py-2 flex-row items-center justify-between ${i < top.length - 1 ? "border-b border-white/5" : ""}`}>
          <Text className="text-[13px] font-medium text-white/80 flex-1">{item.symbol}</Text>
          <Text className="text-[13px] text-white/60 w-20 text-right">{item.price}</Text>
          <Text className="text-[12px] text-[#F7D56D] w-16 text-right">RR {item.rr}</Text>
        </View>
      ))}
    </GlassCard>
  );
}
