import { View, Text } from "react-native";
import { RefreshCw } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface ChainInfo { name: string; id: string; native: string }
interface ProtocolInfo { name: string; fee: string }

interface Props {
  chains: ChainInfo[];
  protocols: ProtocolInfo[];
}

export default function BridgeCard({ chains, protocols }: Props) {
  return (
    <GlassCard className="my-2 border-[#38BDF8]/30">
      <View className="px-4 py-3 flex-row items-center gap-2 mb-3">
        <RefreshCw size={16} color="#38BDF8" />
        <Text className="text-[13px] font-bold text-white/90">跨链桥</Text>
      </View>
      <View className="flex-row flex-wrap gap-1.5 mb-3 px-1">
        {chains.slice(0, 6).map((c, i) => (
          <View key={i} className="px-2 py-0.5 rounded-full bg-white/10">
            <Text className="text-[10px] text-white/70">{c.name}</Text>
          </View>
        ))}
        {chains.length > 6 ? <Text className="text-[10px] text-white/40">+{chains.length - 6}</Text> : null}
      </View>
      {protocols.slice(0, 3).map((p, i) => (
        <View key={i} className="flex-row justify-between py-1 px-2 rounded bg-white/5 mb-1">
          <Text className="text-[11px] text-white/70">{p.name}</Text>
          <Text className="text-[11px] text-white/50">费率 {p.fee}</Text>
        </View>
      ))}
    </GlassCard>
  );
}
