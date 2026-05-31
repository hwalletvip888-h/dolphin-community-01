import { View, Text } from "react-native";
import { Wallet } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

export default function BalanceEmptyCard({ message }: { message: string }) {
  return (
    <GlassCard className="my-2">
      <View className="px-4 py-6 items-center gap-2">
        <Wallet size={24} color="white" opacity={0.3} />
        <Text className="text-[13px] text-white/50 text-center">{message}</Text>
      </View>
    </GlassCard>
  );
}
