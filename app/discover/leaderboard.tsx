import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Trophy, Medal, TrendingUp } from "lucide-react-native";

const RANKS = [
  { name: "CryptoKing", profit: "+$3,240", pnlPct: "+42%", trades: 156, winRate: "68%", badge: "👑" },
  { name: "DeFiWhale", profit: "+$2,150", pnlPct: "+28%", trades: 89, winRate: "62%", badge: "🥈" },
  { name: "TraderPro", profit: "+$1,870", pnlPct: "+22%", trades: 134, winRate: "58%", badge: "🥉" },
  { name: "AlphaFinder", profit: "+$1,520", pnlPct: "+19%", trades: 72, winRate: "55%", badge: "4" },
  { name: "NewbieStar", profit: "+$980", pnlPct: "+15%", trades: 45, winRate: "52%", badge: "5" },
  { name: "HODLer", profit: "+$720", pnlPct: "+11%", trades: 38, winRate: "48%", badge: "6" },
  { name: "MoonShot", profit: "+$540", pnlPct: "+8%", trades: 27, winRate: "45%", badge: "7" },
  { name: "CoinMaster", profit: "+$320", pnlPct: "+5%", trades: 19, winRate: "42%", badge: "8" },
];

const INVITES = [
  { name: "CryptoKing", count: 23, reward: "+$115" },
  { name: "DeFi_Degen", count: 18, reward: "+$90" },
  { name: "TraderMax", count: 15, reward: "+$75" },
  { name: "Newbie_001", count: 8, reward: "+$40" },
  { name: "You", count: 5, reward: "+$25", isMe: true },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  return (
    <ScrollView style={ls.root} contentContainerStyle={ls.content}>
      <View style={ls.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={ls.title}>社区排行</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={ls.section}>交易大赛 — 收益率排行</Text>
      {RANKS.map((r, i) => (
        <View key={i} style={[ls.rankRow, r.badge === "👑" && { backgroundColor: "rgba(247,213,109,0.06)", borderColor: "rgba(247,213,109,0.15)" }]}>
          <Text style={ls.rankBadge}>{r.badge}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[ls.rankName, r.badge === "👑" && { color: "#F7D56D" }]}>{r.name}</Text>
            <Text style={ls.rankStats}>{r.trades}笔交易 · 胜率 {r.winRate}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={ls.rankPnl}>{r.profit}</Text>
            <Text style={[ls.rankPct, { color: "#34D399" }]}>{r.pnlPct}</Text>
          </View>
        </View>
      ))}

      <Text style={[ls.section, { marginTop: 8 }]}>邀请榜</Text>
      {INVITES.map((inv, i) => (
        <View key={i} style={[ls.inviteRow, inv.isMe && { backgroundColor: "rgba(192,99,255,0.08)", borderColor: "rgba(192,99,255,0.2)" }]}>
          <Text style={ls.inviteRank}>{i + 1}</Text>
          <Text style={[ls.inviteName, inv.isMe && { color: "#C063FF" }]}>{inv.name}</Text>
          <Text style={ls.inviteCount}>{inv.count}人</Text>
          <Text style={ls.inviteReward}>{inv.reward}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const ls = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "900", color: "#34D399" },
  section: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 12 },
  rankRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.06)",
    padding: 14, marginBottom: 8,
  },
  rankBadge: { fontSize: 20, width: 36 },
  rankName: { fontSize: 14, fontWeight: "700", color: "#fff" },
  rankStats: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  rankPnl: { fontSize: 15, fontWeight: "800", color: "#34D399" },
  rankPct: { fontSize: 11, marginTop: 2 },
  inviteRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(35,10,62,0.3)", borderRadius: 14,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.04)",
    padding: 12, marginBottom: 6,
  },
  inviteRank: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.35)", width: 16 },
  inviteName: { flex: 1, fontSize: 13, fontWeight: "600", color: "#fff" },
  inviteCount: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  inviteReward: { fontSize: 13, fontWeight: "700", color: "#34D399" },
});
