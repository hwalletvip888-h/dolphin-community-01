import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, TrendingUp, Gift, Shield, Megaphone } from "lucide-react-native";

const TRADE_MSGS = [
  { icon: TrendingUp, title: "BTC/USDT 多单成交", desc: "已按 $87,200 成交 0.01 BTC", time: "5分钟前", color: "#34D399" },
  { icon: Shield, title: "止损触发提醒", desc: "ETH/USDT 空单止损于 $4,300", time: "1小时前", color: "#FB923C" },
  { icon: TrendingUp, title: "SOL/USDT 止盈成交", desc: "已按 $195 止盈 10 SOL 盈利 +$165", time: "3小时前", color: "#34D399" },
];

const PLATFORM_MSGS = [
  { icon: Megaphone, title: "6月交易大赛报名开启", desc: "奖池 $10,000 · 收益率排名 · Lv.5+ 可参赛", time: "昨天", color: "#F7D56D" },
  { icon: Gift, title: "新用户注册空投已发放", desc: "请前往资产页面查看空投代币", time: "2天前", color: "#38BDF8" },
  { icon: Shield, title: "系统安全升级通知", desc: "TEE 签名模块已升级，请重新登录", time: "3天前", color: "#A78BFA" },
];

export default function MessagesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"trade" | "platform">("trade");
  const data = tab === "trade" ? TRADE_MSGS : PLATFORM_MSGS;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>消息</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab switcher */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === "trade" && s.tabActive]} onPress={() => setTab("trade")}>
          <Text style={[s.tabText, tab === "trade" && s.tabTextActive]}>交易消息</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === "platform" && s.tabActive]} onPress={() => setTab("platform")}>
          <Text style={[s.tabText, tab === "platform" && s.tabTextActive]}>平台公告</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {data.map((m, i) => (
          <View key={i} style={s.card}>
            <View style={[s.icon, { backgroundColor: m.color + "15" }]}>
              <m.icon size={18} color={m.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{m.title}</Text>
              <Text style={s.cardDesc}>{m.desc}</Text>
            </View>
            <Text style={s.time}>{m.time}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingBottom: 10, paddingHorizontal: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#fff" },
  tabRow: { flexDirection: "row", marginHorizontal: 18, marginBottom: 16, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "rgba(192,99,255,0.2)" },
  tabText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.4)" },
  tabTextActive: { color: "#C063FF" },
  content: { paddingHorizontal: 18, paddingBottom: 30 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", padding: 14, marginBottom: 8 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#fff" },
  cardDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  time: { fontSize: 10, color: "rgba(255,255,255,0.25)" },
});
