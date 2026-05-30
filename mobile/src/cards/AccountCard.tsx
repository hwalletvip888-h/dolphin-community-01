import { View, Text } from "react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface Props {
  usdc: string;
  pol: string;
  positions?: string;
}

export default function AccountCard({ usdc, pol, positions }: Props) {
  return (
    <GlassCard className="my-2">
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-[13px] text-white/60">USDC.e</Text>
        <Text className="text-[16px] font-bold text-white">{usdc}</Text>
      </View>
      <View className="px-4 py-3 flex-row items-center justify-between border-t border-white/5">
        <Text className="text-[13px] text-white/60">POL</Text>
        <Text className="text-[14px] font-semibold text-white/80">{pol}</Text>
      </View>
      {positions ? (
        <View className="px-4 py-3 flex-row items-center justify-between border-t border-white/5">
          <Text className="text-[13px] text-white/60">持仓</Text>
          <Text className="text-[13px] text-white/80">{positions}</Text>
        </View>
      ) : null}
    </GlassCard>
  );
}
