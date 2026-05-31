import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Star, Activity, MessageSquare, Copy } from "lucide-react-native";

const STRATEGIES = [
  { name: "H1 布林带均值回归", author: "诸葛策略", sharpe: "2.4", winRate: "68%", return: "+32%", followers: 234, tags: ["BTC", "1H", "低风险"] },
  { name: "EMA 金叉趋势跟踪", author: "社区用户", sharpe: "1.8", winRate: "55%", return: "+18%", followers: 156, tags: ["ETH", "4H", "中风险"] },
  { name: "Pivot 支撑狙击", author: "诸葛策略", sharpe: "2.1", winRate: "62%", return: "+25%", followers: 189, tags: ["SOL", "15M", "高风险"] },
  { name: "成交量突破策略", author: "TraderMax", sharpe: "1.5", winRate: "48%", return: "+12%", followers: 87, tags: ["BTC", "1D", "中风险"] },
];

const TAG_COLORS: Record<string, string> = { "低风险": "#34D399", "中风险": "#F7D56D", "高风险": "#FB923C" };

export default function StrategiesScreen() {
  const router = useRouter();
  return (
    <View style={ss.root}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={ss.content}>
      <View style={ss.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={ss.title}>热门策略</Text>
        <View style={{ width: 36 }} />
      </View>

      {STRATEGIES.map((st, i) => (
        <View key={i} style={ss.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={ss.name}>{st.name}</Text>
            <Text style={[ss.ret, { color: st.return.startsWith("+") ? "#34D399" : "#FB923C" }]}>{st.return}</Text>
          </View>
          <Text style={ss.author}>by {st.author} · {st.followers} 人在用</Text>

          <View style={ss.metrics}>
            <View style={ss.metric}>
              <Text style={ss.mLabel}>夏普</Text>
              <Text style={ss.mValue}>{st.sharpe}</Text>
            </View>
            <View style={ss.metric}>
              <Text style={ss.mLabel}>胜率</Text>
              <Text style={ss.mValue}>{st.winRate}</Text>
            </View>
            <View style={ss.metric}>
              <Text style={ss.mLabel}>收益</Text>
              <Text style={[ss.mValue, { color: st.return.startsWith("+") ? "#34D399" : "#FB923C" }]}>{st.return}</Text>
            </View>
          </View>

          <View style={ss.tags}>
            {st.tags.map((t) => (
              <View key={t} style={[ss.tag, { borderColor: (TAG_COLORS[t] || "#fff") + "40" }]}>
                <Text style={[ss.tagText, { color: TAG_COLORS[t] || "#fff" }]}>{t}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={ss.followBtn}>
            <Activity size={14} color="#fff" />
            <Text style={ss.followText}>跟单此策略</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
      <View style={ss.bar}>
        <TouchableOpacity style={[ss.barBtn, { backgroundColor: "#C084FC" }]} onPress={() => router.push("/chat/zhuge")} activeOpacity={0.85}>
          <MessageSquare size={17} color="#fff" /><Text style={[ss.barBtnText, { color: "#fff" }]}>咨询诸葛策略</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ss.barBtn, { backgroundColor: "rgba(192,132,252,0.15)", borderWidth: 1, borderColor: "rgba(192,132,252,0.3)" }]} activeOpacity={0.85}>
          <Copy size={17} color="#C084FC" /><Text style={[ss.barBtnText, { color: "#C084FC" }]}>跟单策略</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "900", color: "#C084FC" },
  card: { backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(192,132,252,0.15)", padding: 18, marginBottom: 14 },
  name: { fontSize: 16, fontWeight: "800", color: "#fff" },
  ret: { fontSize: 16, fontWeight: "800" },
  author: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 12 },
  metrics: { flexDirection: "row", gap: 20, marginBottom: 12 },
  metric: {},
  mLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 },
  mValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  tags: { flexDirection: "row", gap: 6, marginBottom: 14 },
  tag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: "600" },
  followBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#C084FC", borderRadius: 14, paddingVertical: 11 },
  followText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  bar: { flexDirection: "row", gap: 10, padding: 12, paddingBottom: 36, borderTopWidth: 0.5, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "#0A0020" },
  barBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, paddingVertical: 13 },
  barBtnText: { fontSize: 14, fontWeight: "700" },
});
