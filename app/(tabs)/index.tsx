import { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Sparkles, TrendingUp, Globe, Trophy, BarChart3, Grid3X3, Coins, Shield } from "lucide-react-native";
import { AGENTS } from "@/src/data/agents";
import { useAuth } from "@/src/stores/auth";

const { width: W } = Dimensions.get("window");

const CAROUSEL = [
  { icon: BarChart3, title: "BTC 行情走势", subtitle: "AI 分析当前趋势", color: "#F7D56D", bg: "rgba(247,213,109,0.08)", route: "/chat/zhuge" },
  { icon: Grid3X3, title: "网格交易策略", subtitle: "震荡市自动低买高卖", color: "#C084FC", bg: "rgba(192,132,252,0.08)", route: "/chat/zhuge" },
  { icon: Coins, title: "链上赚币机会", subtitle: "发现稳定收益协议", color: "#34D399", bg: "rgba(52,211,153,0.08)", route: "/chat/onchain" },
];

const QUICK_ACTIONS = [
  { icon: TrendingUp, label: "行情分析", desc: "BTC/ETH/SOL 实时", route: "/chat/zhuge" },
  { icon: Sparkles, label: "策略生成", desc: "AI 量化策略", route: "/chat/zhuge" },
  { icon: Globe, label: "链上机会", desc: "聪明钱追踪", route: "/chat/onchain" },
  { icon: Trophy, label: "世界杯", desc: "竞猜 & 预测", route: "/chat/worldcup" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { total, tokens, level, refreshWallet, loggedIn } = useAuth();
  const [carouselPage, setCarouselPage] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (loggedIn) refreshWallet();
  }, [loggedIn]);

  // Market snapshot (mock — will be replaced by real API)
  const marketData = [
    { symbol: "BTC", price: "87,230", change: "+2.3%" },
    { symbol: "ETH", price: "4,150", change: "-1.2%" },
    { symbol: "SOL", price: "184.5", change: "+5.1%" },
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* ── Wallet header ── */}
      <TouchableOpacity style={s.walletCard} onPress={() => router.push("/wallet")} activeOpacity={0.85}>
        <View style={s.walletTop}>
          <View style={s.walletLeft}>
            <Text style={{ fontSize: 16 }}>👛</Text>
            <Text style={s.walletLabel}>Agent Wallet</Text>
          </View>
          <View style={s.walletRight}>
            <View style={s.levelBadge}>
              <Shield size={12} color="#34D399" />
              <Text style={s.levelText}>Lv.{level}</Text>
            </View>
            <Text style={s.walletArrow}>→</Text>
          </View>
        </View>

        <Text style={s.walletTotal}>
          {total !== null ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
        </Text>

        {/* Mini sparkline */}
        {tokens.length > 0 && (
          <>
            <View style={s.miniSpark}>
              {[2,5,3,8,4,6,9,7,10,8,11,9,12,10,13,11,14,12,15,13].map((v, i) => (
                <View key={i} style={[s.miniBar, { height: v * 2, backgroundColor: v > 7 ? "#34D399" : "rgba(251,146,60,0.6)" }]} />
              ))}
            </View>
            <View style={s.pnlMini}>
              <Text style={[s.pnlMiniVal, { color: "#34D399" }]}>+$12.40 今日</Text>
              <Text style={s.pnlMiniInfo}>点击查看详情 →</Text>
            </View>
          </>
        )}

        {tokens.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tokenRow}>
            {tokens.map((t, i) => (
              <View key={i} style={s.tokenChip}>
                <Text style={s.tokenSymbol}>{t.symbol}</Text>
                <Text style={s.tokenAmt}>{t.usd}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={s.walletHint}>连接钱包查看资产 →</Text>
        )}
      </TouchableOpacity>

      {/* ── Carousel ── */}
      <View style={s.carouselSection}>
        <Text style={s.heroTitle}>今天想让 Agent 帮你做什么？</Text>
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setCarouselPage(Math.round(e.nativeEvent.contentOffset.x / (W - 36)))}
          scrollEventThrottle={16}
          style={s.carousel}
          contentContainerStyle={{ gap: 10 }}
          snapToInterval={W - 36}
          snapToAlignment="center"
          decelerationRate="fast"
        >
          {CAROUSEL.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[s.carouselCard, { width: W - 64, backgroundColor: item.bg, borderColor: item.color + "25" }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.85}
            >
              <View style={[s.carouselIcon, { backgroundColor: item.color + "15" }]}>
                <item.icon size={28} color={item.color} />
              </View>
              <Text style={s.carouselTitle}>{item.title}</Text>
              <Text style={s.carouselSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Dots */}
        <View style={s.carouselDots}>
          {CAROUSEL.map((_, i) => (
            <View key={i} style={[s.carouselDot, i === carouselPage && s.carouselDotActive]} />
          ))}
        </View>
      </View>

      {/* ── My Agents ── */}
      <Text style={s.sectionTitle}>我的 Agent</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.agentRow}>
        {AGENTS.map((a) => {
          const unlocked = level >= a.unlockLevel;
          return (
            <TouchableOpacity
              key={a.id}
              style={[s.agentCard, { borderColor: unlocked ? a.color + "30" : "rgba(255,255,255,0.06)" }]}
              onPress={() => unlocked && router.push(`/chat/${a.id}`)}
              activeOpacity={unlocked ? 0.7 : 1}
            >
              <View style={[s.agentAvatar, { borderColor: unlocked ? a.color : "rgba(255,255,255,0.15)" }, !unlocked && { opacity: 0.4 }]}>
                <Text style={[s.agentAvatarTxt, { color: unlocked ? a.color : "rgba(255,255,255,0.3)" }]}>{a.name[0]}</Text>
              </View>
              <Text style={[s.agentName, !unlocked && { color: "rgba(255,255,255,0.3)" }]}>{a.name}</Text>
              {!unlocked && (
                <View style={s.lockChip}>
                  <Text style={s.lockChipText}>Lv.{a.unlockLevel}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Market snapshot ── */}
      <Text style={s.sectionTitle}>市场快照</Text>
      <View style={s.marketCard}>
        {marketData.map((m) => {
          const isUp = m.change.startsWith("+");
          return (
            <View key={m.symbol} style={[s.marketRow, m.symbol !== "SOL" && { borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 10, marginBottom: 10 }]}>
              <Text style={s.marketSymbol}>{m.symbol}</Text>
              <Text style={s.marketPrice}>${m.price}</Text>
              <Text style={[s.marketChange, { color: isUp ? "#34D399" : "#FB923C" }]}>{m.change}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Quick actions ── */}
      <Text style={s.sectionTitle}>快捷功能</Text>
      <View style={s.actions}>
        {QUICK_ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={s.actionCard}
            onPress={() => router.push(a.route as any)}
            activeOpacity={0.7}
          >
            <a.icon size={22} color="#F7D56D" />
            <Text style={s.actionLabel}>{a.label}</Text>
            <Text style={s.actionDesc}>{a.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 30 },

  // ── Wallet ──
  walletCard: {
    backgroundColor: "rgba(35,10,62,0.7)", borderRadius: 20,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)",
    padding: 18, marginBottom: 20,
  },
  walletTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  walletLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  walletLabel: { fontSize: 13, fontWeight: "600", color: "#F7D56D" },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(52,211,153,0.1)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  levelText: { fontSize: 11, fontWeight: "700", color: "#34D399" },
  walletTotal: { fontSize: 30, fontWeight: "900", color: "#fff", marginBottom: 8 },
  miniSpark: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 30, marginBottom: 4 },
  miniBar: { width: 5, borderRadius: 3 },
  pnlMini: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pnlMiniVal: { fontSize: 12, fontWeight: "700" },
  pnlMiniInfo: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  walletRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  walletArrow: { fontSize: 16, color: "rgba(255,255,255,0.3)" },
  tokenRow: { flexDirection: "row", gap: 8 },
  tokenChip: {
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12, paddingVertical: 8,
  },
  tokenSymbol: { fontSize: 12, fontWeight: "700", color: "#fff", marginBottom: 2 },
  tokenAmt: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  walletHint: { fontSize: 12, color: "rgba(255,255,255,0.25)" },

  // ── Carousel ──
  carouselSection: { marginBottom: 24 },
  heroTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 14 },
  carousel: { overflow: "visible" },
  carouselCard: {
    borderRadius: 20, borderWidth: 0.5, padding: 22,
    marginRight: 10, justifyContent: "center",
  },
  carouselIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  carouselTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 4 },
  carouselSub: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
  carouselDots: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 12 },
  carouselDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.12)" },
  carouselDotActive: { width: 18, backgroundColor: "#F7D56D" },

  // ── Agents ──
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 12 },
  agentRow: { gap: 10 },
  agentCard: {
    width: 80, alignItems: "center", gap: 6,
    backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16,
    borderWidth: 0.5, paddingVertical: 12, paddingHorizontal: 8,
  },
  agentAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  agentAvatarTxt: { fontSize: 16, fontWeight: "800" },
  agentName: { fontSize: 11, fontWeight: "600", color: "#fff", textAlign: "center" },
  lockChip: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  lockChipText: { fontSize: 9, color: "rgba(255,255,255,0.25)" },

  // ── Market ──
  marketCard: {
    backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.12)",
    padding: 16, marginBottom: 24,
  },
  marketRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  marketSymbol: { fontSize: 13, fontWeight: "700", color: "#fff", width: 50 },
  marketPrice: { flex: 1, fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.8)" },
  marketChange: { fontSize: 13, fontWeight: "600" },

  // ── Actions ──
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  actionCard: {
    width: "47%", backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 18,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.15)",
    padding: 16, alignItems: "center", gap: 6,
  },
  actionLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
  actionDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
});
