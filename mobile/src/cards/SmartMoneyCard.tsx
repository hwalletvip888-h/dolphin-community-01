import { View, Text } from "react-native";
import { Activity } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface SmartMoneySignal {
  symbol: string;
  price: string;
  whale: string;
  rr: string;
  trend: string;
}

const WHALE_COLORS: Record<string, string> = {
  HIGH: "#34D399",
  MEDIUM: "#FBBF24",
  LOW: "rgba(255,255,255,0.4)",
};

export default function SmartMoneyCard({ signals }: { signals: SmartMoneySignal[] }) {
  return (
    <GlassCard className="my-2 border-[#A78BFA]/30">
      <View className="px-4 py-3 flex-row items-center gap-2 mb-2">
        <Activity size={16} color="#A78BFA" />
        <Text className="text-[13px] font-bold text-white/90">聪明钱信号</Text>
        <View className="bg-emerald-400/5 px-1.5 py-0.5 rounded">
          <Text className="text-[9px] text-emerald-400/70">OnchainOS 链上</Text>
        </View>
      </View>
      {signals.map((s, i) => (
        <View key={i} className="flex-row items-center justify-between py-1.5 px-2 rounded-lg bg-white/5 mb-1">
          <Text className="text-[12px] font-bold text-white w-20" numberOfLines={1}>{s.symbol}</Text>
          <Text className="text-[11px] text-white/50 w-16 text-right">{s.price}</Text>
          <Text className="text-[11px] text-white/40 w-20 text-right" numberOfLines={1}>{s.trend}</Text>
          <Text className="text-[11px] font-bold w-14 text-right" style={{ color: WHALE_COLORS[s.whale] || "rgba(255,255,255,0.4)" }}>{s.whale}</Text>
          <Text className="text-[11px] text-white/30 w-10 text-right">{s.rr}个</Text>
        </View>
      ))}
    </GlassCard>
  );
}
