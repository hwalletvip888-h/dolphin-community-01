import { View, Text } from "react-native";
import { Zap } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface GasChain { chain: string; coins: string }

interface Props {
  chains: GasChain[];
  note: string;
}

export default function GasCard({ chains, note }: Props) {
  return (
    <GlassCard className="my-2 border-[#34D399]/30">
      <View className="px-4 py-3 flex-row items-center gap-2 mb-2">
        <Zap size={16} color="#34D399" />
        <Text className="text-[13px] font-bold text-white/90">免Gas转账</Text>
      </View>
      <Text className="text-[11px] text-white/50 mb-3 px-1">{note}</Text>
      <View className="flex-row flex-wrap gap-1.5">
        {chains.map((c, i) => (
          <View key={i} className="px-2.5 py-1 rounded-full bg-[#34D399]/10 border border-[#34D399]/20">
            <Text className="text-[10px] text-[#34D399]">{c.chain}: {c.coins}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}
