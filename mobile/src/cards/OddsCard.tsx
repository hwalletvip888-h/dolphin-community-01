import { View, Text } from "react-native";
import { Trophy } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface OddsItem {
  question: string;
  yes: string;
  volume: string;
}

export default function OddsCard({ items }: { items: OddsItem[] }) {
  return (
    <GlassCard className="my-2">
      <View className="px-4 py-2 border-b border-white/5 flex-row items-center gap-1.5">
        <Trophy size={13} color="white" opacity={0.5} />
        <Text className="text-[12px] font-semibold text-white/60">预测市场赔率</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} className={`px-4 py-3 flex-row items-center justify-between ${i < items.length - 1 ? "border-b border-white/5" : ""}`}>
          <Text className="text-[13px] text-white/80 flex-1 mr-3" numberOfLines={2}>{item.question}</Text>
          <View className="flex-row items-center gap-3 shrink-0">
            <Text className="text-[14px] font-bold text-[#F7D56D]">{item.yes}</Text>
            <Text className="text-[11px] text-white/40">{item.volume}</Text>
          </View>
        </View>
      ))}
    </GlassCard>
  );
}
