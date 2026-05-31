import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Shield, TrendingUp, Copy, X, Download } from "lucide-react-native";
import { AGENTS } from "@/src/data/agents";
import { useAuth } from "@/src/stores/auth";

const ADDRESSES = [
  { chain: "EVM (ERC20)", addr: "0x7F4e...b3D2", fullAddr: "0x7F4e8c9A1b2C3d4E5f6A7B8C9D0E1F2A3B4C5D6" },
  { chain: "Solana", addr: "DR5x...9KmP", fullAddr: "DR5xY8zW3vU2tS1rQ4pO7nM6lK9jI8hG5fD3sA2" },
];

const SIGNALS = [
  { token: "PEPE", action: "鲸鱼买入", amount: "$142K", time: "3m前", color: "#A78BFA" },
  { token: "WLD", action: "聪明钱包建仓", amount: "$89K", time: "12m前", color: "#34D399" },
  { token: "BTC", action: "诸葛策略开多", amount: "$4.3K", time: "25m前", color: "#C084FC" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { total, level, refreshWallet, loggedIn } = useAuth();
  const [showDeposit, setShowDeposit] = useState(false);
  useEffect(() => { if (loggedIn) refreshWallet(); }, [loggedIn]);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Wallet card */}
      <TouchableOpacity style={s.walletCard} onPress={() => router.push("/wallet")} activeOpacity={0.85}>
        <View style={s.walletRow}>
          <Text style={s.walletLabel}>总资产</Text>
          <View style={s.levelBadge}><Shield size={11} color="#34D399" /><Text style={s.levelText}>Lv.{level}</Text></View>
        </View>
        <Text style={s.walletTotal}>{total !== null ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}</Text>
        <TouchableOpacity style={s.depositBtn} onPress={() => setShowDeposit(true)} activeOpacity={0.7}>
          <Download size={14} color="#F7D56D" />
          <Text style={s.depositText}>充值</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Deposit Modal */}
      <Modal visible={showDeposit} transparent animationType="slide" onRequestClose={() => setShowDeposit(false)}>
        <View style={d.overlay}>
          <View style={d.sheet}>
            <View style={d.head}>
              <Text style={d.title}>充值</Text>
              <TouchableOpacity onPress={() => setShowDeposit(false)}><X size={20} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
            </View>
            <Text style={d.hint}>向以下地址转账即可到账</Text>
            {ADDRESSES.map((a, i) => (
              <View key={i} style={d.addrCard}>
                <Text style={d.addrChain}>{a.chain}</Text>
                <View style={d.addrRow}>
                  <Text style={d.addrText} selectable>{a.fullAddr}</Text>
                  <TouchableOpacity style={d.copyBtn}>
                    <Copy size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={d.warn}>⚠️ 请确认网络正确，充值错误无法找回</Text>
          </View>
        </View>
      </Modal>

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
  walletTotal: { fontSize: 30, fontWeight: "900", color: "#fff", marginBottom: 10 },
  depositBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(247,213,109,0.1)", borderRadius: 12, paddingVertical: 8 },
  depositText: { fontSize: 13, fontWeight: "700", color: "#F7D56D" },
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

// Deposit modal
const d = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#150530", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "800", color: "#fff" },
  hint: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 },
  addrCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 14, marginBottom: 10 },
  addrChain: { fontSize: 11, fontWeight: "700", color: "#F7D56D", marginBottom: 6 },
  addrRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addrText: { flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Courier" },
  copyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  warn: { fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 10 },
});
