import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Zap, Eye, MessageSquare, Copy } from "lucide-react-native";

const SIGNALS = [
  { token: "PEPE", chain: "Ethereum", action: "鲸鱼建仓", amount: "$142K", time: "3m ago", score: 92 },
  { token: "WIF", chain: "Solana", action: "聪明钱买入", amount: "$89K", time: "12m ago", score: 85 },
  { token: "DEGEN", chain: "Base", action: "大额转账", amount: "$1.2M", time: "28m ago", score: 78 },
  { token: "BONK", chain: "Solana", action: "新钱包创建", amount: "$56K", time: "45m ago", score: 71 },
  { token: "ARB", chain: "Arbitrum", action: "合约部署", amount: "—", time: "1h ago", score: 65 },
];

const CHAINS = [
  { name: "Ethereum", count: 12, color: "#627EEA" },
  { name: "Solana", count: 8, color: "#9945FF" },
  { name: "Base", count: 5, color: "#0052FF" },
  { name: "Arbitrum", count: 3, color: "#12AAFF" },
];

export default function OnchainScreen() {
  const router = useRouter();
  return (
    <View style={os.root}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={os.content}>
      <View style={os.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={os.title}>链上热点</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={os.section}>监控链路</Text>
      <View style={os.chainRow}>
        {CHAINS.map((c) => (
          <View key={c.name} style={os.chainChip}>
            <View style={[os.chainDot, { backgroundColor: c.color }]} />
            <Text style={os.chainName}>{c.name}</Text>
            <Text style={os.chainCount}>{c.count} 信号</Text>
          </View>
        ))}
      </View>

      <Text style={os.section}>实时信号</Text>
      {SIGNALS.map((sig, i) => (
        <View key={i} style={os.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={os.token}>{sig.token}</Text>
              <Text style={os.chain}>{sig.chain}</Text>
            </View>
            <View style={os.score}><Text style={os.scoreText}>{sig.score}</Text></View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={os.action}>{sig.action}</Text>
              <Text style={os.amount}>{sig.amount}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={os.time}>{sig.time}</Text>
              <TouchableOpacity style={os.copyBtn}>
                <Eye size={14} color="#A78BFA" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
      <View style={os.bar}>
        <TouchableOpacity style={[os.barBtn, { backgroundColor: "#A78BFA" }]} onPress={() => router.push("/chat/onchain")} activeOpacity={0.85}>
          <MessageSquare size={17} color="#fff" /><Text style={[os.barBtnText, { color: "#fff" }]}>咨询链上猎手</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[os.barBtn, { backgroundColor: "rgba(167,139,250,0.15)", borderWidth: 1, borderColor: "rgba(167,139,250,0.3)" }]} activeOpacity={0.85}>
          <Copy size={17} color="#A78BFA" /><Text style={[os.barBtnText, { color: "#A78BFA" }]}>一键跟单</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const os = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "900", color: "#A78BFA" },
  section: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 12, marginTop: 8 },
  chainRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  chainChip: { flex: 1, backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  chainDot: { width: 8, height: 8, borderRadius: 4 },
  chainName: { fontSize: 11, fontWeight: "700", color: "#fff" },
  chainCount: { fontSize: 10, color: "rgba(255,255,255,0.35)" },
  card: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16, borderWidth: 0.5, borderColor: "rgba(167,139,250,0.12)", padding: 14, marginBottom: 8 },
  token: { fontSize: 16, fontWeight: "800", color: "#fff" },
  chain: { fontSize: 10, color: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  score: { backgroundColor: "rgba(52,211,153,0.12)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  scoreText: { fontSize: 12, fontWeight: "700", color: "#34D399" },
  action: { fontSize: 13, color: "#A78BFA", fontWeight: "600" },
  amount: { fontSize: 16, fontWeight: "800", color: "#fff", marginTop: 2 },
  time: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
  copyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(167,139,250,0.1)", alignItems: "center", justifyContent: "center" },
  bar: { flexDirection: "row", gap: 10, padding: 12, paddingBottom: 36, borderTopWidth: 0.5, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "#0A0020" },
  barBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, paddingVertical: 13 },
  barBtnText: { fontSize: 14, fontWeight: "700" },
});
