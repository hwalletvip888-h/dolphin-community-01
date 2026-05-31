import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Trophy, TrendingUp, Gift, Users, Globe } from "lucide-react-native";

const SECTIONS = [
  { icon: Trophy, title: "世界杯竞猜", desc: "AI 预测 + 实时赔率 + 排行榜", color: "#FBBF24" },
  { icon: TrendingUp, title: "热门策略", desc: "社区验证的量化策略组合", color: "#C084FC" },
  { icon: Globe, title: "链上热点", desc: "聪明钱追踪 & Meme 发现", color: "#A78BFA" },
  { icon: Gift, title: "活动 & 奖励", desc: "空投、任务、邀请返佣", color: "#FB923C" },
  { icon: Users, title: "社区排行", desc: "交易大赛 & 邀请榜", color: "#34D399" },
];

export default function DiscoverScreen() {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={s.title}>发现</Text>
        <Text style={s.sub}>探索 Web3 世界</Text>
      </View>

      {SECTIONS.map((sec) => (
        <View key={sec.title} style={[s.card, { borderColor: sec.color + "20" }]}>
          <View style={[s.iconWrap, { backgroundColor: sec.color + "15" }]}>
            <sec.icon size={22} color={sec.color} />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>{sec.title}</Text>
            <Text style={s.cardDesc}>{sec.desc}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 18,
    borderWidth: 0.5, padding: 16, marginBottom: 10,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 3 },
  cardDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
});
