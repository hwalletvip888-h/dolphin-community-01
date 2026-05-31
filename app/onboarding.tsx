import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Shield, ArrowRight } from "lucide-react-native";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={s.root}>
      <View style={s.card}>
        <View style={s.iconWrap}>
          <Shield size={48} color="#F7D56D" />
        </View>
        <Text style={s.title}>海豚社区</Text>
        <Text style={s.subtitle}>社区驱动的 AI 交易平台</Text>
        <View style={s.points}>
          <Point icon="🔒" text="基于 OKX TEE 安全签名，私钥永不离开设备" />
          <Point icon="🤖" text="AI Agent 帮你分析行情，社区一起决策" />
          <Point icon="📊" text="一句话跟单，降低交易门槛" />
          <Point icon="👥" text="社区信号共享，提高交易胜率" />
        </View>
        <TouchableOpacity style={s.btn} onPress={() => router.replace("/(tabs)")} activeOpacity={0.8}>
          <Text style={s.btnText}>开始使用</Text>
          <ArrowRight size={18} color="#090012" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
        <Text style={s.skip}>跳过</Text>
      </TouchableOpacity>
    </View>
  );
}

function Point({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.point}>
      <Text style={s.pointIcon}>{icon}</Text>
      <Text style={s.pointText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  card: { width: "100%", maxWidth: 380, backgroundColor: "rgba(35,10,62,0.7)", borderRadius: 28, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)", padding: 32, alignItems: "center" },
  iconWrap: { width: 90, height: 90, borderRadius: 22, backgroundColor: "rgba(247,213,109,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "900", color: "#C063FF", letterSpacing: 2, marginBottom: 4 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 28 },
  points: { width: "100%", gap: 14, marginBottom: 28 },
  point: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  pointIcon: { fontSize: 16, width: 24 },
  pointText: { flex: 1, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 20 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#F7D56D", borderRadius: 16, paddingVertical: 14, width: "100%" },
  btnText: { fontSize: 16, fontWeight: "700", color: "#090012" },
  skip: { fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 20 },
});
