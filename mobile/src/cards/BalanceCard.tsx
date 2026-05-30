import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Copy, Check, Wallet, X, RefreshCw, Send } from "lucide-react-native";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { TokenItem } from "@/src/shared/types";
import * as Clipboard from "expo-clipboard";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <TouchableOpacity onPress={handleCopy} className="flex-row items-center gap-1 px-2 py-1 rounded-lg bg-white/10">
      {copied ? <Check size={12} color="#34D399" /> : <Copy size={12} color="white" opacity={0.6} />}
      <Text className="text-[10px] text-white/60 font-mono">{text.slice(0, 6)}...{text.slice(-4)}</Text>
    </TouchableOpacity>
  );
}

interface Props {
  total: string;
  tokens: TokenItem[];
}

export default function BalanceCard({ total, tokens }: Props) {
  type Panel = "deposit" | "withdraw" | "swap" | null;
  const [panel, setPanel] = useState<Panel>(null);
  const [toAddr, setToAddr] = useState("");
  const [sendAmt, setSendAmt] = useState("");
  const [swapAmt, setSwapAmt] = useState("");
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);

  const firstToken = tokens[0];
  const addr = firstToken?.address || "";
  const symbol = firstToken?.symbol || "";

  const toggle = (p: Panel) => setPanel(panel === p ? null : p);

  return (
    <GlassCard className="my-2">
      {/* Header */}
      <View className="px-4 py-3 border-b border-white/5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Wallet size={14} color="white" opacity={0.6} />
          <Text className="text-[13px] font-semibold text-white/80">总资产</Text>
        </View>
        <Text className="text-[20px] font-bold text-[#F7D56D]">{total}</Text>
      </View>

      {/* Token rows */}
      {tokens.map((t, i) => (
        <View key={i} className={`px-4 py-3 ${i < tokens.length - 1 ? "border-b border-white/5" : ""}`}>
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <Text className="text-[13px] font-bold text-white/80">{t.symbol.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-white/90">{t.symbol}</Text>
              <Text className="text-[13px] text-white/60">{t.amount}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[16px] font-semibold text-white/90">{t.usd}</Text>
              <Text className="text-[11px] text-white/40">{t.chain}</Text>
            </View>
          </View>
          <View className="mt-2 ml-[52px]">
            <CopyButton text={t.address} />
          </View>
        </View>
      ))}

      {/* Action buttons */}
      <View className="px-4 py-2.5 border-t border-white/5 flex-row gap-2">
        <ActionBtn icon={<ArrowDownToLine size={15} color="white" opacity={panel === "deposit" ? 1 : 0.6} />} label="充币" active={panel === "deposit"} onPress={() => toggle("deposit")} />
        <ActionBtn icon={<ArrowUpFromLine size={15} color="white" opacity={panel === "withdraw" ? 1 : 0.6} />} label="提币" active={panel === "withdraw"} onPress={() => toggle("withdraw")} />
        <ActionBtn icon={<ArrowLeftRight size={15} color="white" opacity={panel === "swap" ? 1 : 0.6} />} label="兑换" active={panel === "swap"} onPress={() => toggle("swap")} />
      </View>

      {/* Deposit */}
      {panel === "deposit" && (
        <View className="px-4 py-3 border-t border-white/5 bg-white/[0.03]">
          <Text className="text-[12px] text-white/60 mb-2">接收地址</Text>
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-[12px] text-white/80 bg-black/30 rounded-lg px-3 py-2 font-mono" numberOfLines={1}>{addr}</Text>
            <TouchableOpacity onPress={async () => { await Clipboard.setStringAsync(addr); }} className="px-3 py-2 rounded-lg bg-[#F7D56D]/20">
              <Text className="text-[#F7D56D] text-[12px] font-semibold">复制</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Withdraw */}
      {panel === "withdraw" && (
        <View className="px-4 py-3 border-t border-white/5 bg-white/[0.03] gap-3">
          <View className="flex-row items-center gap-1.5">
            <Send size={13} color="white" opacity={0.7} />
            <Text className="text-[12px] font-semibold text-white/70">转账 {symbol}</Text>
          </View>
          <TextInput
            value={toAddr} onChangeText={setToAddr}
            placeholder="对方地址 0x..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white"
          />
          <View className="flex-row gap-2">
            <TextInput
              value={sendAmt} onChangeText={setSendAmt}
              placeholder="金额"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="decimal-pad"
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white"
            />
            <TouchableOpacity
              disabled={!toAddr.trim() || !sendAmt || sending}
              onPress={() => {}}
              className="px-4 py-2.5 rounded-lg bg-[#F7D56D] disabled:opacity-30"
            >
              <Text className="text-[#090012] text-[13px] font-bold">{sending ? "提交中..." : "确认转账"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Swap */}
      {panel === "swap" && (
        <View className="px-4 py-3 border-t border-white/5 bg-white/[0.03] gap-3">
          <View className="flex-row items-center gap-1.5">
            <RefreshCw size={13} color="white" opacity={0.7} />
            <Text className="text-[12px] font-semibold text-white/70">兑换代币</Text>
          </View>
          <View className="flex-row items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5">
            <Text className="text-[13px] text-white/50">支付</Text>
            <TextInput
              value={swapAmt} onChangeText={setSwapAmt}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="decimal-pad"
              className="flex-1 bg-transparent text-[13px] text-white text-right"
            />
            <Text className="text-[13px] font-semibold text-white/80">{symbol}</Text>
          </View>
          <View className="items-center">
            <ArrowLeftRight size={16} color="white" opacity={0.3} />
          </View>
          <View className="flex-row items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5">
            <Text className="text-[13px] text-white/50">获得</Text>
            <Text className="flex-1 text-right text-[13px] text-white/40">选择代币</Text>
          </View>
          <TouchableOpacity disabled={!swapAmt} onPress={() => {}} className="w-full py-2.5 rounded-lg bg-[#F7D56D] disabled:opacity-30 items-center">
            <Text className="text-[#090012] text-[13px] font-bold">确认兑换</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Toast */}
      {toast ? (
        <View className={`mx-4 mb-3 px-3 py-2 rounded-lg flex-row items-center gap-2 ${toast.startsWith("成功") ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
          <Text className={`text-[12px] font-medium ${toast.startsWith("成功") ? "text-emerald-400" : "text-red-400"}`}>{toast}</Text>
          <TouchableOpacity onPress={() => setToast("")} className="ml-auto">
            <X size={14} color={toast.startsWith("成功") ? "#34D399" : "#F87171"} />
          </TouchableOpacity>
        </View>
      ) : null}
    </GlassCard>
  );
}

function ActionBtn({ icon, label, active, onPress }: { icon: React.ReactNode; label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 flex-col items-center gap-1 py-2 rounded-lg ${active ? "bg-white/15" : "bg-white/5"}`}
    >
      {icon}
      <Text className={`text-[10px] font-medium ${active ? "text-white" : "text-white/60"}`}>{label}</Text>
    </TouchableOpacity>
  );
}
