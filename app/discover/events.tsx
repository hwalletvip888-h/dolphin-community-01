import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Gift, Clock, Trophy } from "lucide-react-native";

const EVENTS = [
  { title: "新手注册空投", desc: "完成首次登录和 Agent 对话，领取 $5 USDT 空投", reward: "$5 USDT", deadline: "6/30", status: "进行中", color: "#34D399" },
  { title: "策略跟单大赛", desc: "跟单诸葛策略，收益率排名前10 分享 $5,000 奖池", reward: "$5,000", deadline: "6/25", status: "进行中", color: "#F7D56D" },
  { title: "邀请好友计划", desc: "每邀请1位好友注册，双方各得 20 积分 + $2 USDT", reward: "$2/人", deadline: "长期", status: "进行中", color: "#38BDF8" },
  { title: "世界杯竞猜赛", desc: "预测世界杯比赛结果，积分最高者赢 $2,000", reward: "$2,000", deadline: "7/15", status: "即将开始", color: "#FB923C" },
];

export default function EventsScreen() {
  const router = useRouter();
  return (
    <ScrollView style={es.root} contentContainerStyle={es.content}>
      <View style={es.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={es.title}>活动 & 奖励</Text>
        <View style={{ width: 36 }} />
      </View>

      {EVENTS.map((ev, i) => (
        <View key={i} style={[es.card, { borderColor: ev.color + "20" }]}>
          <View style={[es.statusBadge, { backgroundColor: ev.status === "进行中" ? "rgba(52,211,153,0.1)" : "rgba(251,146,60,0.1)" }]}>
            <Text style={[es.statusText, { color: ev.status === "进行中" ? "#34D399" : "#FB923C" }]}>{ev.status}</Text>
          </View>
          <Text style={es.cardTitle}>{ev.title}</Text>
          <Text style={es.cardDesc}>{ev.desc}</Text>
          <View style={es.cardFooter}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Gift size={14} color={ev.color} />
              <Text style={[es.reward, { color: ev.color }]}>{ev.reward}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Clock size={12} color="rgba(255,255,255,0.3)" />
              <Text style={es.deadline}>{ev.deadline}</Text>
            </View>
          </View>
          <TouchableOpacity style={[es.joinBtn, { backgroundColor: ev.color + "20" }]}>
            <Text style={[es.joinText, { color: ev.color }]}>立即参与</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const es = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "900", color: "#FB923C" },
  card: { backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 20, borderWidth: 0.5, padding: 18, marginBottom: 14, position: "relative" },
  statusBadge: { position: "absolute", top: 14, right: 14, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 6, marginTop: 4 },
  cardDesc: { fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 19, marginBottom: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  reward: { fontSize: 14, fontWeight: "700" },
  deadline: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  joinBtn: { borderRadius: 14, paddingVertical: 11, alignItems: "center" },
  joinText: { fontSize: 13, fontWeight: "700" },
});
