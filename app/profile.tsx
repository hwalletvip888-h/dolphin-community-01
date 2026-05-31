import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, User, Mail, Shield, Copy, Star, LogOut } from "lucide-react-native";
import { useAuth } from "@/src/stores/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const { email, level, total, logout } = useAuth();
  const uid = "HD-7X9K-2M4P";

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>个人中心</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.card}>
        <View style={s.avatar}><Text style={s.avatarT}>W</Text></View>
        <Text style={s.nickname}>Web3 Explorer</Text>
        <View style={s.uidRow}>
          <Text style={s.uid}>UID: {uid}</Text>
          <Copy size={12} color="rgba(255,255,255,0.3)" />
        </View>
        <Text style={s.email}>{email || "未设置"}</Text>
      </View>

      <View style={s.stats}>
        <Stat v={`$${total?.toFixed(0) || "0"}`} l="总资产" />
        <Stat v={`Lv.${level}`} l="等级" />
        <Stat v="12" l="对话" />
      </View>

      <TouchableOpacity style={s.logout} onPress={() => { logout(); router.replace("/login"); }}>
        <LogOut size={16} color="#FB923C" /><Text style={s.logoutT}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={s.statV}>{v}</Text>
      <Text style={s.statL}>{l}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 56, paddingHorizontal: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  title: { fontSize: 18, fontWeight: "800", color: "#fff" },
  card: { backgroundColor: "rgba(35,10,62,0.6)", borderRadius: 20, padding: 22, alignItems: "center", marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#C063FF", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarT: { fontSize: 24, fontWeight: "800", color: "#fff" },
  nickname: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 4 },
  uidRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  uid: { fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Courier" },
  email: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  stats: { flexDirection: "row", backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16, padding: 16, marginBottom: 16 },
  statV: { fontSize: 16, fontWeight: "800", color: "#F7D56D" },
  statL: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  logoutT: { fontSize: 13, fontWeight: "600", color: "#FB923C" },
});
