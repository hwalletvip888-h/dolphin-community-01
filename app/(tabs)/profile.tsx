import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Modal, Alert,
} from "react-native";
import { useAuth } from "@/src/stores/auth";
import { AGENTS } from "@/src/data/agents";
import { useRouter } from "expo-router";
import {
  ChevronRight, Edit3, Copy, Shield, Gift, Settings,
  Bot, Bell, Globe, Lock, LogOut, Wallet, MessageCircle,
  TrendingUp, Eye, SlidersHorizontal, Star, Zap,
} from "lucide-react-native";

export default function ProfileScreen() {
  const { email, level, total, logout } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState("Web3 Explorer");
  const [editCount, setEditCount] = useState(0);
  const [showNickEdit, setShowNickEdit] = useState(false);
  const [tempNick, setTempNick] = useState(nickname);
  const uid = "HD-7X9K-2M4P";

  const handleSaveNick = () => {
    if (!tempNick.trim()) return;
    setNickname(tempNick.trim());
    setEditCount((c) => c + 1);
    setShowNickEdit(false);
  };

  const handleEditNick = () => {
    if (editCount >= 2) {
      Alert.alert("修改次数已用完", "昵称已修改过 1 次，无法再次修改");
      return;
    }
    setTempNick(nickname);
    setShowNickEdit(true);
  };

  const SETTINGS_MENU = [
    { section: "策略设置", items: [
      { icon: SlidersHorizontal, label: "诸葛策略参数", desc: "止损比例 · 杠杆倍数 · 最大仓位", color: "#C084FC", route: "/settings/strategy" },
      { icon: Eye, label: "链上猎手设置", desc: "监控链路 · 最低信号分 · 推送阈值", color: "#A78BFA", route: "/settings/onchain" },
      { icon: Bell, label: "消息通知", desc: "推送设置 · 免打扰时间", color: "#38BDF8" },
    ]},
    { section: "账户设置", items: [
      { icon: Lock, label: "安全中心", desc: "修改密码 · 设备管理", color: "#34D399" },
      { icon: Globe, label: "语言 & 货币", desc: "中文简体 · USD", color: "#FB923C" },
      { icon: Wallet, label: "钱包管理", desc: "地址簿 · 授权管理", color: "#F7D56D" },
    ]},
    { section: "其他", items: [
      { icon: MessageCircle, label: "意见反馈", desc: "帮助我们改进产品", color: "#C063FF" },
      { icon: Gift, label: "邀请好友", desc: `已邀请 5 人 · 获得 $25`, color: "#FBBF24" },
    ]},
  ];

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>我的</Text>
        </View>

        {/* Profile card */}
        <View style={s.profile}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{nickname[0]}</Text>
          </View>
          <View style={s.profileInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={s.nickname}>{nickname}</Text>
              <TouchableOpacity onPress={handleEditNick}>
                <Edit3 size={13} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
            <Text style={s.email}>{email || "未设置邮箱"}</Text>
            <View style={s.uidRow}>
              <Text style={s.uid}>UID: {uid}</Text>
              <TouchableOpacity onPress={() => {}}>
                <Copy size={12} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.levelCard}>
            <Star size={14} color="#F7D56D" />
            <Text style={s.levelText}>Lv.{level}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          {[{ v: total !== null ? `$${total.toFixed(0)}` : "$0", l: "总资产" }, { v: "12", l: "对话数" }, { v: "3", l: "策略" }, { v: "5", l: "邀请" }].map((st) => (
            <View key={st.l} style={s.statItem}>
              <Text style={s.statVal}>{st.v}</Text>
              <Text style={s.statLabel}>{st.l}</Text>
            </View>
          ))}
        </View>

        {/* Settings sections */}
        {SETTINGS_MENU.map((sec) => (
          <View key={sec.section} style={{ marginBottom: 8 }}>
            <Text style={s.sectionTitle}>{sec.section}</Text>
            <View style={s.menuCard}>
              {sec.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.menuItem, i < sec.items.length - 1 && { borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 12, marginBottom: 12 }]}
                  onPress={() => item.route ? router.push(item.route as any) : {}}
                  activeOpacity={0.7}
                >
                  <View style={[s.menuIcon, { backgroundColor: item.color + "15" }]}>
                    <item.icon size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.menuLabel}>{item.label}</Text>
                    <Text style={s.menuDesc}>{item.desc}</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={s.logout} onPress={() => { logout(); router.replace("/login"); }}>
          <LogOut size={18} color="#FB923C" />
          <Text style={s.logoutText}>退出登录</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Nickname edit modal */}
      <Modal visible={showNickEdit} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={m.card}>
            <Text style={m.title}>修改昵称</Text>
            <Text style={m.hint}>{editCount === 0 ? "首次修改" : "最后一次修改机会"}</Text>
            <TextInput value={tempNick} onChangeText={setTempNick} style={m.input} maxLength={20} placeholder="输入新昵称" placeholderTextColor="rgba(255,255,255,0.3)" />
            <View style={m.btnRow}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setShowNickEdit(false)}><Text style={m.cancelText}>取消</Text></TouchableOpacity>
              <TouchableOpacity style={m.saveBtn} onPress={handleSaveNick}><Text style={m.saveText}>保存</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  scroll: { flex: 1 },
  content: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 20 },
  header: { marginBottom: 18 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },

  // Profile
  profile: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(35,10,62,0.6)", borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)", padding: 18, marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#C063FF", alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 22, fontWeight: "800", color: "#fff" },
  profileInfo: { flex: 1, gap: 3 },
  nickname: { fontSize: 17, fontWeight: "800", color: "#fff" },
  email: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  uidRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  uid: { fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Courier" },
  levelCard: { alignItems: "center", gap: 3, backgroundColor: "rgba(247,213,109,0.1)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  levelText: { fontSize: 13, fontWeight: "800", color: "#F7D56D" },

  // Stats
  stats: { flexDirection: "row", gap: 8, marginBottom: 24 },
  statItem: { flex: 1, alignItems: "center", backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 14, paddingVertical: 12 },
  statVal: { fontSize: 16, fontWeight: "800", color: "#F7D56D" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 },

  // Settings
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  menuCard: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.06)", padding: 14, marginBottom: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
  menuDesc: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 },

  // Logout
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: "rgba(251,146,60,0.06)" },
  logoutText: { fontSize: 14, fontWeight: "600", color: "#FB923C" },
});

// Modal
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  card: { width: 300, backgroundColor: "#150530", borderRadius: 24, padding: 24, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)" },
  title: { fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 4 },
  hint: { fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 16 },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 15, marginBottom: 16 },
  btnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  cancelText: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  saveBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center", backgroundColor: "#F7D56D" },
  saveText: { fontSize: 14, fontWeight: "700", color: "#090012" },
});
