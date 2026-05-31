import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, TrendingUp } from "lucide-react-native";

export default function StrategySettings() {
  const router = useRouter();
  const [slRate, setSlRate] = useState("5");
  const [tpRate, setTpRate] = useState("10");
  const [maxLeverage, setMaxLeverage] = useState("10");
  const [maxPosition, setMaxPosition] = useState("1000");
  const [autoTrail, setAutoTrail] = useState(true);
  const [notifySignal, setNotifySignal] = useState(true);

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={st.title}>诸葛策略设置</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={st.content}>
        <View style={st.card}>
          <Text style={st.cardTitle}>风控参数</Text>
          <Row label="止损比例" value={`${slRate}%`} />
          <Row label="止盈比例" value={`${tpRate}%`} />
          <Row label="最大杠杆" value={`${maxLeverage}x`} />
          <Row label="最大单笔仓位" value={`$${maxPosition}`} />
        </View>
        <View style={st.card}>
          <Text style={st.cardTitle}>交易偏好</Text>
          <SwitchRow label="自动跟踪止损" value={autoTrail} onChange={setAutoTrail} desc="盈利超过3%后自动启动追踪止损" />
          <SwitchRow label="信号推送通知" value={notifySignal} onChange={setNotifySignal} desc="诸葛策略发出交易信号时推送通知" />
        </View>
        <Text style={st.note}>以上参数为全局默认值，单次对话中可临时覆盖</Text>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)" }}>
      <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#C084FC" }}>{value}</Text>
    </View>
  );
}

function SwitchRow({ label, value, onChange, desc }: { label: string; value: boolean; onChange: (v: boolean) => void; desc: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{label}</Text>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{desc}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(192,132,252,0.3)" }} thumbColor={value ? "#C084FC" : "rgba(255,255,255,0.3)"} />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingBottom: 12, paddingHorizontal: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#C084FC" },
  content: { padding: 18 },
  card: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18, borderWidth: 0.5, borderColor: "rgba(192,132,252,0.12)", padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 8 },
  note: { fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 16 },
});
