import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "@/src/stores/auth";
import { useRouter } from "expo-router";
import { ChevronRight, LogOut, Shield, Gift, Settings } from "lucide-react-native";

const MENU = [
  { icon: Shield, label: "安全中心" },
  { icon: Gift, label: "我的奖励" },
  { icon: Settings, label: "设置" },
];

export default function ProfileScreen() {
  const { email, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>我的</Text>
      </View>

      {/* Profile card */}
      <View style={s.profile}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>W</Text>
        </View>
        <View style={s.profileInfo}>
          <Text style={s.name}>Web3 Explorer</Text>
          <Text style={s.email}>{email || "未登录"}</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>Lv.1</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={s.stats}>
        {[
          { label: "对话次数", value: "12" },
          { label: "Agent 数", value: "6" },
          { label: "策略", value: "3" },
        ].map((st) => (
          <View key={st.label} style={s.statItem}>
            <Text style={s.statValue}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={s.menu}>
        {MENU.map((m) => (
          <TouchableOpacity key={m.label} style={s.menuItem}>
            <m.icon size={18} color="rgba(255,255,255,0.6)" />
            <Text style={s.menuLabel}>{m.label}</Text>
            <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color="#FB923C" />
        <Text style={s.logoutLabel}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },

  profile: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 20, padding: 18,
    backgroundColor: "rgba(35,10,62,0.6)", borderRadius: 20,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)",
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#C063FF", alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 20, fontWeight: "800", color: "#fff" },
  profileInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#fff" },
  email: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  badge: { backgroundColor: "rgba(247,213,109,0.15)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: "700", color: "#F7D56D" },

  stats: { flexDirection: "row", marginHorizontal: 20, marginTop: 14, gap: 10 },
  statItem: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.05)",
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#F7D56D" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 },

  menu: { marginHorizontal: 20, marginTop: 20, gap: 2 },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(35,10,62,0.3)", borderRadius: 14,
    padding: 16,
  },
  menuLabel: { flex: 1, fontSize: 14, color: "rgba(255,255,255,0.7)" },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 28, paddingVertical: 14, borderRadius: 16, backgroundColor: "rgba(251,146,60,0.08)" },
  logoutLabel: { fontSize: 14, fontWeight: "600", color: "#FB923C" },
});
