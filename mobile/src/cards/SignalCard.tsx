import { View, Text } from "react-native";
import { Activity } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface SignalItem {
  symbol?: string;
  direction: string;
  entry: string;
  tp: string;
  sl: string;
  rr?: string;
  strategy?: string;
}

export default function SignalCard({ items }: { items: SignalItem[] }) {
  return (
    <GlassCard className="my-2">
      <View className="px-4 py-2 border-b border-white/5 flex-row items-center gap-1.5">
        <Activity size={13} color="white" opacity={0.5} />
        <Text className="text-[12px] font-semibold text-white/60">交易信号</Text>
      </View>
      {items.map((item, i) => {
        const isLong = item.direction.includes("多");
        const isShort = item.direction.includes("空");
        const dirColor = isLong ? "#34D399" : isShort ? "#F87171" : "#9CA3AF";
        return (
          <View key={i} className={`px-4 py-3 ${i < items.length - 1 ? "border-b border-white/5" : ""}`}>
            <View className="flex-row items-center gap-2 mb-2">
              {item.symbol ? (
                <View className="bg-white/10 px-2 py-0.5 rounded">
                  <Text className="text-[12px] font-semibold text-white/60">{item.symbol}</Text>
                </View>
              ) : null}
              <Text className="text-[13px] font-bold" style={{ color: dirColor }}>{item.direction}</Text>
              {item.rr ? <Text className="text-[11px] text-[#F7D56D] ml-auto">RR {item.rr}</Text> : null}
            </View>
            <View className="flex-row gap-4">
              <Text className="text-[12px] text-white/50">入场 <Text className="text-white/80">{item.entry}</Text></Text>
              <Text className="text-[12px] text-white/50">止盈 <Text className="text-emerald-400/80">{item.tp}</Text></Text>
              <Text className="text-[12px] text-white/50">止损 <Text className="text-red-400/80">{item.sl}</Text></Text>
            </View>
          </View>
        );
      })}
    </GlassCard>
  );
}
