import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, TrendingUp, Gift, Shield, Megaphone } from "lucide-react-native";

const TRADE_MSGS = [
  { icon: TrendingUp, title: "BTC/USDT 多单成交", desc: "已按 $87,200 成交 0.01 BTC", time: "5分钟前", color: "#34D399" },
  { icon: Shield, title: "止损触发提醒", desc: "ETH/USDT 空单止损于 $4,300", time: "1小时前", color: "#FB923C" },
  { icon: TrendingUp, title: "SOL/USDT 止盈成交", desc: "已按 $195 止盈 10 SOL 盈利 +$165", time: "3小时前", color: "#34D399" },
];

const PLATFORM_MSGS = [
  { icon: Megaphone, title: "平台公告", desc: "6月交易大赛报名开启，奖池 $10,000", time: "昨天", color: "#F7D56D" },
  { icon: Gift, title: "活动通知", desc: "新用户注册空投已发放，请查看资产", time: "2天前", color: "#38BDF8" },
  { icon: Bell, title: "系统通知", desc: "链上猎手信号推送已开启", time: "3天前", color: "#A78BFA" },
];

export default function MessagesScreen() {
  const router = useRouter();

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>消息</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 交易消息 */}
      <Text style={s.section}>交易消息</Text>
      {TRADE_MSGS.map((m, i) => (
        <TouchableOpacity key={i} style={s.card} activeOpacity={0.7}>
          <View style={[s.icon, { backgroundColor: m.color + "15" }]}>
            <m.icon size={18} color={m.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{m.title}</Text>
            <Text style={s.cardDesc}>{m.desc}</Text>
          </View>
          <Text style={s.time}>{m.time}</Text>
        </TouchableOpacity>
      ))}

      {/* 平台消息 */}
      <Text style={[s.section, { marginTop: 16 }]}>平台公告</Text>
      {PLATFORM_MSGS.map((m, i) => (
        <TouchableOpacity key={i} style={s.card} activeOpacity={0.7}>
          <View style={[s.icon, { backgroundColor: m.color + "15" }]}>
            <m.icon size={18} color={m.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{m.title}</Text>
            <Text style={s.cardDesc}>{m.desc}</Text>
          </View>
          <Text style={s.time}>{m.time}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 30 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  title: { fontSize: 18, fontWeight: "800", color: "#fff" },
  section: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.5)", marginBottom: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", padding: 14, marginBottom: 8 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#fff" },
  cardDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  time: { fontSize: 10, color: "rgba(255,255,255,0.25)" },
});
