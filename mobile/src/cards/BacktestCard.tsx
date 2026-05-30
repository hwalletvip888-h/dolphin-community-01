import { View, Text } from "react-native";
import { BarChart3 } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface Props {
  symbol: string;
  strategy: string;
  return_pct: string;
  win_rate: string;
  trades: number;
  sharpe: string;
}

export default function BacktestCard({ symbol, strategy, return_pct, win_rate, trades, sharpe }: Props) {
  return (
    <GlassCard className="my-2 border-[#C084FC]/30">
      <View className="px-4 py-3 flex-row items-center gap-2 mb-3">
        <BarChart3 size={16} color="#C084FC" />
        <Text className="text-[13px] font-bold text-white/90">回测结果</Text>
      </View>
      <Text className="text-[12px] text-white/60 mb-3 px-1">{symbol} · {strategy}</Text>
      <View className="flex-row flex-wrap gap-2">
        <View className="bg-white/5 rounded-xl p-2.5 items-center flex-1 min-w-[45%]">
          <Text className="text-[18px] font-black text-emerald-400">{return_pct}</Text>
          <Text className="text-[10px] text-white/40">总收益</Text>
        </View>
        <View className="bg-white/5 rounded-xl p-2.5 items-center flex-1 min-w-[45%]">
          <Text className="text-[18px] font-black text-white">{win_rate}</Text>
          <Text className="text-[10px] text-white/40">胜率</Text>
        </View>
        <View className="bg-white/5 rounded-xl p-2.5 items-center flex-1 min-w-[45%]">
          <Text className="text-[18px] font-black text-white">{trades}</Text>
          <Text className="text-[10px] text-white/40">交易笔数</Text>
        </View>
        <View className="bg-white/5 rounded-xl p-2.5 items-center flex-1 min-w-[45%]">
          <Text className="text-[18px] font-black text-[#C084FC]">{sharpe}</Text>
          <Text className="text-[10px] text-white/40">夏普比率</Text>
        </View>
      </View>
    </GlassCard>
  );
}
