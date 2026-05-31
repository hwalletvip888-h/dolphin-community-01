import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Eye } from "lucide-react-native";

const CHAINS = [
  { id: "eth", name: "Ethereum", enabled: true },
  { id: "sol", name: "Solana", enabled: true },
  { id: "base", name: "Base", enabled: true },
  { id: "arb", name: "Arbitrum", enabled: false },
  { id: "bsc", name: "BSC", enabled: false },
  { id: "op", name: "Optimism", enabled: false },
];

export default function OnchainSettings() {
  const router = useRouter();
  const [minScore, setMinScore] = useState("70");
  const [minAmount, setMinAmount] = useState("10000");
  const [notifyWhale, setNotifyWhale] = useState(true);
  const [notifySmart, setNotifySmart] = useState(true);
  const [autoFollow, setAutoFollow] = useState(false);
  const [chains, setChains] = useState(CHAINS);

  const toggleChain = (id: string) => {
    setChains((c) => c.map((ch) => (ch.id === id ? { ...ch, enabled: !ch.enabled } : ch)));
  };

  return (
    <View style={os.root}>
      <View style={os.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={os.title}>链上猎手设置</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={os.content}>
        <View style={os.card}>
          <Text style={os.cardTitle}>监控链路</Text>
          {chains.map((c) => (
            <View key={c.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
              <Text style={{ fontSize: 14, color: c.enabled ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }}>{c.name}</Text>
              <Switch value={c.enabled} onValueChange={() => toggleChain(c.id)} trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(167,139,250,0.3)" }} thumbColor={c.enabled ? "#A78BFA" : "rgba(255,255,255,0.3)"} />
            </View>
          ))}
        </View>
        <View style={os.card}>
          <Text style={os.cardTitle}>信号过滤</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)" }}>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>最低安全分</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#A78BFA" }}>{minScore}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 }}>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>最低交易金额</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#A78BFA" }}>${parseInt(minAmount).toLocaleString()}</Text>
          </View>
        </View>
        <View style={os.card}>
          <Text style={os.cardTitle}>推送偏好</Text>
          <SwitchRow label="鲸鱼动态" value={notifyWhale} onChange={setNotifyWhale} />
          <SwitchRow label="聪明钱信号" value={notifySmart} onChange={setNotifySmart} />
          <SwitchRow label="自动跟单" value={autoFollow} onChange={setAutoFollow} desc="⚠️ 开启后自动跟单大额信号" />
        </View>
        <Text style={os.note}>监控链路越多消耗的 API 配额越大</Text>
      </ScrollView>
    </View>
  );
}

function SwitchRow({ label, value, onChange, desc }: { label: string; value: boolean; onChange: (v: boolean) => void; desc?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{label}</Text>
        {desc && <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{desc}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(167,139,250,0.3)" }} thumbColor={value ? "#A78BFA" : "rgba(255,255,255,0.3)"} />
    </View>
  );
}

const os = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingBottom: 12, paddingHorizontal: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#A78BFA" },
  content: { padding: 18 },
  card: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18, borderWidth: 0.5, borderColor: "rgba(167,139,250,0.12)", padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 8 },
  note: { fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 16 },
});
