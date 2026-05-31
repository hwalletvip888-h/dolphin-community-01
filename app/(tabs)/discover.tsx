import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Trophy, TrendingUp, Globe, Gift, Users, BarChart3, ArrowRight, Flame, Sparkles } from "lucide-react-native";

const SECTIONS = [
  {
    id: "worldcup", icon: Trophy, title: "世界杯竞猜", desc: "AI 预测 · 实时赔率 · 排行榜",
    color: "#FBBF24", bg: "rgba(251,191,36,0.08)", stats: "12 场比赛进行中",
    route: "/discover/worldcup",
  },
  {
    id: "strategies", icon: BarChart3, title: "热门策略", desc: "社区验证的量化策略组合",
    color: "#C084FC", bg: "rgba(192,132,252,0.08)", stats: "23 个策略",
    route: "/discover/strategies",
  },
  {
    id: "onchain", icon: Globe, title: "链上热点", desc: "聪明钱追踪 · Meme 发现",
    color: "#A78BFA", bg: "rgba(167,139,250,0.08)", stats: "实时监控 8 条链",
    route: "/discover/onchain",
  },
  {
    id: "events", icon: Gift, title: "活动 & 奖励", desc: "空投 · 任务 · 邀请返佣",
    color: "#FB923C", bg: "rgba(251,146,60,0.08)", stats: "3 个进行中",
    route: "/discover/events",
  },
  {
    id: "leaderboard", icon: Users, title: "社区排行", desc: "交易大赛 · 邀请榜 · 积分",
    color: "#34D399", bg: "rgba(52,211,153,0.08)", stats: "本月更新",
    route: "/discover/leaderboard",
  },
];

const HOT = [
  { tag: "BTC突破88K", heat: "🔥 2.4K讨论" },
  { tag: "PEPE鲸鱼建仓", heat: "🔥 1.8K讨论" },
  { tag: "以太坊ETF", heat: "📈 1.2K讨论" },
  { tag: "Solana Meme", heat: "🚀 980讨论" },
];

export default function DiscoverScreen() {
  const router = useRouter();

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>发现</Text>
        <Text style={s.sub}>探索 Web3 世界</Text>
      </View>

      {/* Hot topics */}
      <Text style={s.sectionLabel}>🔥 热门话题</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hotRow}>
        {HOT.map((h) => (
          <TouchableOpacity key={h.tag} style={s.hotChip} activeOpacity={0.7}>
            <Text style={s.hotTag}>{h.tag}</Text>
            <Text style={s.hotHeat}>{h.heat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main sections */}
      <Text style={s.sectionLabel}>数据板块</Text>
      {SECTIONS.map((sec) => (
        <TouchableOpacity
          key={sec.id}
          style={[s.card, { borderColor: sec.color + "20" }]}
          onPress={() => router.push(sec.route as any)}
          activeOpacity={0.75}
        >
          <View style={[s.iconWrap, { backgroundColor: sec.color + "15" }]}>
            <sec.icon size={24} color={sec.color} />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>{sec.title}</Text>
            <Text style={s.cardDesc}>{sec.desc}</Text>
            <Text style={[s.cardStats, { color: sec.color }]}>{sec.stats}</Text>
          </View>
          <ArrowRight size={18} color="rgba(255,255,255,0.25)" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 },

  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 12, marginTop: 8 },

  hotRow: { gap: 8, marginBottom: 24 },
  hotChip: { backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 14, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.12)", paddingHorizontal: 14, paddingVertical: 10 },
  hotTag: { fontSize: 13, fontWeight: "700", color: "#fff" },
  hotHeat: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 },

  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18,
    borderWidth: 0.5, padding: 16, marginBottom: 10,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 3 },
  cardDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 },
  cardStats: { fontSize: 11, fontWeight: "600" },
});
