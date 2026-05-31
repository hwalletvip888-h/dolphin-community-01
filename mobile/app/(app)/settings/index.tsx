import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Shield, LogOut, Info, ChevronRight, Globe, Bell, HelpCircle, X } from "lucide-react-native";
import { useAuthStore } from "@/src/stores";
import { useWalletStore } from "@/src/stores";

export default function SettingsScreen() {
  const router = useRouter();
  const { isLoggedIn, logout, email, userId } = useAuthStore();
  const { total } = useWalletStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleLogout = () => {
    Alert.alert("退出登录", "确认退出当前账户？", [
      { text: "取消", style: "cancel" },
      {
        text: "确认退出",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            router.replace("/");
          } catch {
            Alert.alert("退出失败", "请重试");
          }
          setLoggingOut(false);
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#050015]">
      <ScrollView className="flex-1 px-5 pt-14" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-[28px] font-black text-[#F7D56D] mb-6">设置</Text>

        {/* Account */}
        <SectionHeader title="账户" />
        <View className="bg-white/5 border border-white/10 rounded-2xl mb-4 overflow-hidden">
          {isLoggedIn ? (
            <>
              <SettingsRow icon={<Globe size={16} color="#F7D56D" />} label="邮箱" value={email || "未绑定"} last={false} />
              <SettingsRow icon={<Shield size={16} color="#34D399" />} label="用户ID" value={userId ? userId.slice(0, 12) + "..." : "—"} last={false} />
              {total !== "0" && <SettingsRow icon={<Info size={16} color="white" opacity={0.5} />} label="总资产" value={`$${parseFloat(total).toFixed(2)}`} last={true} />}
            </>
          ) : (
            <SettingsRow icon={<Globe size={16} color="white" opacity={0.5} />} label="未登录" value="请前往对话页登录" last={true} />
          )}
        </View>

        {/* Preferences */}
        <SectionHeader title="偏好" />
        <View className="bg-white/5 border border-white/10 rounded-2xl mb-4 overflow-hidden">
          <SettingsRow icon={<Bell size={16} color="white" opacity={0.5} />} label="通知" value="开启" last={false} chevron />
          <SettingsRow icon={<Globe size={16} color="white" opacity={0.5} />} label="语言" value="中文" last={false} chevron />
          <SettingsRow icon={<HelpCircle size={16} color="white" opacity={0.5} />} label="帮助与反馈" last={true} chevron />
        </View>

        {/* About */}
        <SectionHeader title="关于" />
        <View className="bg-white/5 border border-white/10 rounded-2xl mb-4 overflow-hidden">
          <SettingsRow icon={<Info size={16} color="white" opacity={0.5} />} label="版本" value="1.0.0" last={false} />
          <SettingsRow icon={<Shield size={16} color="#F7D56D" />} label="安全" value="OKX TEE" last={false} />
          <TouchableOpacity onPress={() => setShowAbout(true)} className="flex-row items-center px-4 py-3.5">
            <Info size={16} color="white" opacity={0.5} />
            <Text className="ml-3 flex-1 text-[14px] text-white/70">关于海豚社区</Text>
            <ChevronRight size={14} color="white" opacity={0.3} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        {isLoggedIn && (
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loggingOut}
            className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 items-center mb-8 disabled:opacity-50"
          >
            <View className="flex-row items-center gap-2">
              <LogOut size={16} color="#F87171" />
              <Text className="text-[14px] font-bold text-red-400">{loggingOut ? "退出中..." : "退出登录"}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* About Modal */}
      <Modal visible={showAbout} animationType="fade" transparent onRequestClose={() => setShowAbout(false)}>
        <View className="flex-1 bg-black/60 items-center justify-center px-8">
          <View className="bg-[#1A0633] border border-[#8A3FFC]/40 rounded-[28px] p-6 w-full max-w-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[20px] font-bold text-white">关于海豚社区</Text>
              <TouchableOpacity onPress={() => setShowAbout(false)}>
                <X size={20} color="white" opacity={0.5} />
              </TouchableOpacity>
            </View>
            <Text className="text-[13px] text-white/70 leading-[22px] mb-4">
              海豚社区是一个 Web3 AI 交易平台，通过 6 个 AI Agent 帮助用户进行链上交易、市场分析、策略回测和资产管理。
            </Text>
            <Text className="text-[12px] text-white/40 mb-4">React Native · Expo 54 · OKX TEE · OnchainOS · DeepSeek V4</Text>
            <Text className="text-[11px] text-white/30 text-center">© 2026 海豚社区</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text className="text-white/30 text-[11px] uppercase tracking-wider mb-2 ml-1">{title}</Text>;
}

function SettingsRow({ icon, label, value, last, chevron }: { icon: React.ReactNode; label: string; value?: string; last: boolean; chevron?: boolean }) {
  return (
    <View className={`flex-row items-center px-4 py-3.5 ${!last ? "border-b border-white/5" : ""}`}>
      {icon}
      <Text className="ml-3 flex-1 text-[14px] text-white/70">{label}</Text>
      {value ? <Text className="text-[13px] text-white/40 mr-1">{value}</Text> : null}
      {chevron ? <ChevronRight size={14} color="white" opacity={0.3} /> : null}
    </View>
  );
}
