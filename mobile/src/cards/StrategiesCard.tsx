import { View, Text } from "react-native";
import { List } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface StrategyItem {
  id: string;
  name: string;
  desc: string;
}

export default function StrategiesCard({ items }: { items: StrategyItem[] }) {
  return (
    <GlassCard className="my-2 border-[#C084FC]/30">
      <View className="px-4 py-3 flex-row items-center gap-2 mb-3">
        <List size={16} color="#C084FC" />
        <Text className="text-[13px] font-bold text-white/90">量化策略</Text>
      </View>
      {items.map((s, i) => (
        <View key={i} className="bg-white/5 rounded-xl p-3 mb-2">
          <Text className="text-[13px] font-bold text-white mb-0.5">{s.name}</Text>
          <Text className="text-[11px] text-white/50">{s.desc}</Text>
        </View>
      ))}
    </GlassCard>
  );
}
