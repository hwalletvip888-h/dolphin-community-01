import { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Shield, TrendingUp, MessageSquare } from "lucide-react-native";
import { AGENTS } from "@/src/data/agents";
import { useAuth } from "@/src/stores/auth";

const SIGNALS = [
  { token: "PEPE", action: "鲸鱼买入", amount: "$142K", time: "3m前", color: "#A78BFA" },
  { token: "WLD", action: "聪明钱包建仓", amount: "$89K", time: "12m前", color: "#34D399" },
  { token: "BTC", action: "诸葛策略开多", amount: "$4.3K", time: "25m前", color: "#C084FC" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { total, level, refreshWallet, loggedIn } = useAuth();
  useEffect(() => { if (loggedIn) refreshWallet(); }, [loggedIn]);

  const unlocked = AGENTS.filter((a) => level >= a.unlockLevel);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Wallet card */}
      <TouchableOpacity style={s.walletCard} onPress={() => router.push("/wallet")} activeOpacity={0.85}>
        <View style={s.walletRow}>
          <Text style={s.walletLabel}>总资产</Text>
          <View style={s.levelBadge}><Shield size={11} color="#34D399" /><Text style={s.levelText}>Lv.{level}</Text></View>
        </View>
        <Text style={s.walletTotal}>{total !== null ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}</Text>
      </TouchableOpacity>

      {/* Agent quick access */}
      <Text style={s.sectionTitle}>AI Agent</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.agentRow}>
        {AGENTS.map((a) => {
          const ok = level >= a.unlockLevel;
          return (
            <TouchableOpacity key={a.id} style={[s.agentCard, { borderColor: ok ? a.color + "30" : "rgba(255,255,255,0.06)" }]} onPress={() => ok && router.push(`/chat/${a.id}`)} activeOpacity={ok ? 0.7 : 1}>
              <View style={[s.agentAv, { borderColor: ok ? a.color : "rgba(255,255,255,0.15)" }, !ok && { opacity: 0.4 }]}>
                <Text style={[s.agentAvT, { color: ok ? a.color : "rgba(255,255,255,0.3)" }]}>{a.name[0]}</Text>
              </View>
              <Text style={[s.agentName, !ok && { color: "rgba(255,255,255,0.3)" }]}>{a.name}</Text>
              <Text style={s.agentTitle}>{a.title}</Text>
              {!ok && <Text style={s.lockLabel}>Lv.{a.unlockLevel}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Community signals */}
      <Text style={s.sectionTitle}>实时信号</Text>
      {SIGNALS.map((sig, i) => (
        <TouchableOpacity key={i} style={s.signalRow} onPress={() => router.push("/chat/onchain")} activeOpacity={0.7}>
          <View style={[s.signalDot, { backgroundColor: sig.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.signalToken}>{sig.token} <Text style={s.signalAction}>{sig.action}</Text></Text>
            <Text style={s.signalSub}>{sig.amount} · {sig.time}</Text>
          </View>
          <TrendingUp size={16} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 30 },
  // Wallet
  walletCard: { backgroundColor: "rgba(35,10,62,0.7)", borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)", padding: 20, marginBottom: 24 },
  walletRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  walletLabel: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(52,211,153,0.1)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  levelText: { fontSize: 11, fontWeight: "700", color: "#34D399" },
  walletTotal: { fontSize: 30, fontWeight: "900", color: "#fff" },
  // Section
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 12, marginTop: 4 },
  // Agents
  agentRow: { gap: 10 },
  agentCard: { width: 90, alignItems: "center", gap: 4, backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16, borderWidth: 0.5, paddingVertical: 14, paddingHorizontal: 8 },
  agentAv: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  agentAvT: { fontSize: 17, fontWeight: "800" },
  agentName: { fontSize: 12, fontWeight: "700", color: "#fff" },
  agentTitle: { fontSize: 10, color: "rgba(255,255,255,0.35)" },
  lockLabel: { fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2 },
  // Signals
  signalRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)" },
  signalDot: { width: 8, height: 8, borderRadius: 4 },
  signalToken: { fontSize: 13, fontWeight: "700", color: "#fff" },
  signalAction: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: "400" },
  signalSub: { fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 },
});
