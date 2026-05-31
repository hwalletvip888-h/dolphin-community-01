import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, User, ChevronRight, Shield, Bell, Globe, Lock, LogOut, Star, MessageCircle } from "lucide-react-native";
import { useAuth } from "@/src/stores/auth";

const MENU = [
  { section: "账户", items: [
    { icon: User, label: "个人信息", desc: "昵称 · 头像 · UID", color: "#C063FF" },
    { icon: Shield, label: "安全设置", desc: "密码 · 设备管理", color: "#34D399" },
  ]},
  { section: "偏好", items: [
    { icon: Bell, label: "消息通知", desc: "推送 · 免打扰", color: "#F7D56D" },
    { icon: Globe, label: "语言 & 货币", desc: "中文 · USD", color: "#38BDF8" },
  ]},
  { section: "其他", items: [
    { icon: MessageCircle, label: "意见反馈", desc: "帮助我们改进", color: "#A78BFA" },
    { icon: Lock, label: "隐私政策", desc: "数据使用说明", color: "rgba(255,255,255,0.4)" },
  ]},
];

export default function SettingsScreen() {
  const router = useRouter();
  const { email, level, total, logout } = useAuth();

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>设置中心</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* User card */}
      <View style={s.userCard}>
        <View style={s.avatar}><Text style={s.avatarT}>W</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.nickname}>Web3 Explorer</Text>
          <Text style={s.email}>{email || "未设置"}</Text>
        </View>
        <View style={s.levelBadge}><Star size={12} color="#F7D56D" /><Text style={s.levelT}>Lv.{level}</Text></View>
      </View>

      {MENU.map((sec) => (
        <View key={sec.section} style={{ marginBottom: 12 }}>
          <Text style={s.sectionTitle}>{sec.section}</Text>
          <View style={s.menuCard}>
            {sec.items.map((item, i) => (
              <TouchableOpacity key={item.label} style={[s.menuItem, i < sec.items.length - 1 && s.menuBorder]}>
                <View style={[s.menuIcon, { backgroundColor: item.color + "15" }]}><item.icon size={16} color={item.color} /></View>
                <View style={{ flex: 1 }}><Text style={s.menuLabel}>{item.label}</Text><Text style={s.menuDesc}>{item.desc}</Text></View>
                <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.logout} onPress={() => { logout(); router.replace("/login"); }}>
        <LogOut size={16} color="#FB923C" /><Text style={s.logoutT}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 30 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "800", color: "#fff" },
  userCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(35,10,62,0.6)", borderRadius: 20, padding: 16, marginBottom: 22 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#C063FF", alignItems: "center", justifyContent: "center" },
  avatarT: { fontSize: 18, fontWeight: "800", color: "#fff" },
  nickname: { fontSize: 15, fontWeight: "700", color: "#fff" },
  email: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(247,213,109,0.1)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  levelT: { fontSize: 11, fontWeight: "700", color: "#F7D56D" },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  menuCard: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.06)", padding: 14 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBorder: { borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 12, marginBottom: 12 },
  menuIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontWeight: "600", color: "#fff" },
  menuDesc: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 },
  logoutT: { fontSize: 13, fontWeight: "600", color: "#FB923C" },
});
