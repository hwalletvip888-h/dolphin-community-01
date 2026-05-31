import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Trophy, TrendingUp, MessageSquare, Copy } from "lucide-react-native";

const MATCHES = [
  { home: "西班牙", away: "法国", time: "6/15 03:00", yesPrice: "17%", vol: "$12M" },
  { home: "巴西", away: "阿根廷", time: "6/16 03:00", yesPrice: "9%", vol: "$9M" },
  { home: "英格兰", away: "葡萄牙", time: "6/17 03:00", yesPrice: "11%", vol: "$8M" },
  { home: "德国", away: "荷兰", time: "6/18 03:00", yesPrice: "5%", vol: "$6M" },
];

const LEADERBOARD = [
  { name: "CryptoKing", profit: "+$3,240", rank: 1 },
  { name: "PredictMaster", profit: "+$2,150", rank: 2 },
  { name: "WorldCupFan", profit: "+$1,870", rank: 3 },
  { name: "DeFiWhale", profit: "+$1,520", rank: 4 },
  { name: "NewbieStar", profit: "+$980", rank: 5 },
];

export default function WorldCupScreen() {
  const router = useRouter();
  return (
    <View style={st.root}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={st.title}>世界杯竞猜</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={st.section}>热门比赛</Text>
      {MATCHES.map((m, i) => (
        <View key={i} style={st.card}>
          <View style={st.matchRow}>
            <Text style={st.team}>{m.home}</Text>
            <Text style={st.vs}>VS</Text>
            <Text style={st.team}>{m.away}</Text>
          </View>
          <View style={st.matchMeta}>
            <Text style={st.matchTime}>{m.time}</Text>
            <View style={st.oddsChip}><Text style={st.oddsText}>Yes {m.yesPrice}</Text></View>
            <Text style={st.volText}>{m.vol}</Text>
          </View>
        </View>
      ))}

      <Text style={st.section}>竞猜排行榜</Text>
      {LEADERBOARD.map((u) => (
        <View key={u.rank} style={st.rankRow}>
          <Text style={[st.rankNum, u.rank <= 3 && { color: "#F7D56D" }]}>{u.rank}</Text>
          <Text style={st.rankName}>{u.name}</Text>
          <Text style={st.rankPnl}>{u.profit}</Text>
        </View>
      ))}

      <Text style={[st.section, { marginTop: 20 }]}>AI 预测</Text>
      <View style={[st.card, { backgroundColor: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.15)", marginBottom: 100 }]}>
        <Text style={st.aiText}>AI 预测模型基于 Polymarket 实时赔率、历史交锋数据和球队近期表现综合分析。多场比赛预测胜率详见 AI 预言帝对话。</Text>
      </View>
    </ScrollView>

      {/* Bottom action bar */}
      <View style={st.bar}>
        <TouchableOpacity style={[st.barBtn, { backgroundColor: "#FBBF24" }]} onPress={() => router.push("/chat/worldcup")} activeOpacity={0.85}>
          <MessageSquare size={17} color="#090012" />
          <Text style={st.barBtnText}>咨询 AI 预言帝</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.barBtn, { backgroundColor: "rgba(251,191,36,0.15)", borderWidth: 1, borderColor: "rgba(251,191,36,0.3)" }]} activeOpacity={0.85}>
          <Copy size={17} color="#FBBF24" />
          <Text style={[st.barBtnText, { color: "#FBBF24" }]}>跟单竞猜</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "900", color: "#FBBF24" },
  section: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 12, marginTop: 8 },
  card: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.1)", padding: 16, marginBottom: 10 },
  matchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  team: { fontSize: 18, fontWeight: "800", color: "#fff" },
  vs: { fontSize: 13, color: "rgba(255,255,255,0.3)" },
  matchMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  matchTime: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  oddsChip: { backgroundColor: "rgba(251,191,36,0.12)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  oddsText: { fontSize: 12, fontWeight: "700", color: "#FBBF24" },
  volText: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  rankRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", gap: 12 },
  rankNum: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.5)", width: 20 },
  rankName: { flex: 1, fontSize: 14, color: "#fff" },
  rankPnl: { fontSize: 14, fontWeight: "700", color: "#34D399" },
  aiText: { fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 20 },
  bar: { flexDirection: "row", gap: 10, padding: 12, paddingBottom: 36, borderTopWidth: 0.5, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "#0A0020" },
  barBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, paddingVertical: 13 },
  barBtnText: { fontSize: 14, fontWeight: "700", color: "#090012" },
});
