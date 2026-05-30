// Community Square — group chat + quick actions + signals
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Bell, Send, Gift, Trophy, MessageSquare, HelpCircle, Calendar, X, Check, Flame } from "lucide-react-native";
import { useAuthStore } from "@/src/stores";
import * as SecureStore from "expo-secure-store";
import { API_BASE, authHeaders } from "@/src/lib/api";

const CHECKIN_KEY = "community_checkin";

interface CommunityMsg {
  id: number;
  user_id: string;
  role: "user" | "agent" | "system";
  content: string;
  created_at: string;
}

// ── Check-in Modal ──────────────────────────────────────

function CheckinModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [streak, setStreak] = useState(0);
  const [checkedToday, setCheckedToday] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (visible) loadState();
  }, [visible]);

  const loadState = async () => {
    try {
      const raw = await SecureStore.getItemAsync(CHECKIN_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        const today = new Date().toDateString();
        const lastDate = s.lastDate ? new Date(s.lastDate).toDateString() : "";
        if (lastDate === today) {
          setCheckedToday(true);
          setStreak(s.streak || 0);
        } else {
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          setStreak(lastDate === yesterday ? (s.streak || 0) : 0);
          setCheckedToday(false);
        }
        setPoints(s.points || 0);
      }
    } catch { /* first time */ }
  };

  const doCheckin = async () => {
    const newStreak = streak + 1;
    const bonus = newStreak >= 7 ? 50 : newStreak >= 3 ? 20 : 10;
    const newPoints = points + bonus;
    const state = { streak: newStreak, lastDate: new Date().toISOString(), points: newPoints };
    await SecureStore.setItemAsync(CHECKIN_KEY, JSON.stringify(state));
    setCheckedToday(true);
    setStreak(newStreak);
    setPoints(newPoints);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center px-8">
        <View className="bg-[#1A0633] border border-[#8A3FFC]/40 rounded-[28px] p-6 w-full max-w-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[20px] font-bold text-white">每日签到</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color="white" opacity={0.5} /></TouchableOpacity>
          </View>

          {/* Streak */}
          <View className="items-center mb-5">
            <View className="flex-row items-center gap-1 mb-2">
              <Flame size={24} color={streak >= 7 ? "#F7D56D" : "#FBBF24"} />
              <Text className="text-[32px] font-black text-[#F7D56D]">{streak}</Text>
            </View>
            <Text className="text-white/50 text-[13px]">连续签到天数</Text>
            {streak >= 7 && <Text className="text-[#F7D56D] text-[12px] mt-1">已解锁 7 天奖励加成</Text>}
          </View>

          {/* Week grid */}
          <View className="flex-row gap-2 mb-5 justify-center">
            {Array.from({ length: 7 }).map((_, i) => {
              const isFilled = i < (streak % 7);
              const isToday = i === (streak % 7) && !checkedToday;
              return (
                <View
                  key={i}
                  className={`w-9 h-9 rounded-full items-center justify-center border ${isFilled ? "bg-[#F7D56D]/30 border-[#F7D56D]" : isToday ? "border-[#F7D56D] bg-[#F7D56D]/10" : "border-white/10 bg-white/5"}`}
                >
                  <Text className={`text-[12px] font-bold ${isFilled ? "text-[#F7D56D]" : "text-white/30"}`}>{i + 1}</Text>
                </View>
              );
            })}
          </View>

          {/* Rewards */}
          <View className="flex-row gap-2 mb-5">
            <View className="flex-1 bg-white/5 rounded-xl p-2 items-center">
              <Text className="text-[10px] text-white/40">3天</Text>
              <Text className="text-[13px] font-bold text-[#F7D56D]">+20</Text>
            </View>
            <View className="flex-1 bg-white/5 rounded-xl p-2 items-center">
              <Text className="text-[10px] text-white/40">7天</Text>
              <Text className="text-[13px] font-bold text-[#F7D56D]">+50</Text>
            </View>
          </View>

          <Text className="text-white/40 text-[11px] text-center mb-4">累计积分: {points}</Text>

          {checkedToday ? (
            <View className="w-full py-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 items-center">
              <View className="flex-row items-center gap-1.5">
                <Check size={16} color="#34D399" />
                <Text className="text-emerald-400 text-[14px] font-bold">今日已签到</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={doCheckin} className="w-full py-3.5 rounded-xl bg-[#F7D56D] items-center">
              <Text className="text-[#090012] text-[15px] font-bold">签到领积分</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Red Envelope Modal ──────────────────────────────────

function RedEnvelopeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center px-8">
        <View className="bg-[#1A0633] border border-[#FF6D72]/30 rounded-[28px] p-6 w-full max-w-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[20px] font-bold text-white">🧧 链上红包</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color="white" opacity={0.5} /></TouchableOpacity>
          </View>
          <View className="items-center py-6">
            <Gift size={48} color="#FF6D72" />
            <Text className="text-white/80 text-[15px] font-bold mt-4">红包功能即将上线</Text>
            <Text className="text-white/40 text-[13px] mt-2 text-center">通过 OKX Agent Wallet 发送 USDT 链上红包，群友拼手速抢</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="w-full py-3 rounded-xl bg-white/10 items-center">
            <Text className="text-white/60 text-[14px]">知道了</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Q&A Modal ───────────────────────────────────────────

function QAModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const faqs = [
    { q: "海豚社区是什么？", a: "海豚社区是一个 Web3 AI 交易平台，通过 6 个 AI Agent 帮助用户进行链上交易、市场分析、策略回测和资产管理。" },
    { q: "如何创建钱包？", a: "进入对话页面，选择小海豚 Agent，输入您的邮箱即可自动创建 OKX Agent Wallet。" },
    { q: "资金安全吗？", a: "钱包私钥由 OKX TEE 可信执行环境保护，全程加密，连我们也无法获取您的私钥。" },
    { q: "什么是信号？", a: "信号板块展示链上聪明钱/KOL/巨鲸的实时交易行为，附带安全评分和风险标签，帮助您判断投资机会。" },
    { q: "如何跟单？", a: "在信号页面找到感兴趣的信号，点击进入链上猎手 Agent 的模拟交易面板，查看历史绩效后决定是否跟单。" },
    { q: "兑换收费吗？", a: "平台通过 OKX DEX 聚合器执行兑换，收取少量返佣。您看到的价格已经是扣除费用后的净价。" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0A0020]">
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-white/10">
          <Text className="text-[20px] font-bold text-white">常见问题</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={22} color="white" opacity={0.7} />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {faqs.map((f, i) => (
            <View key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
              <View className="flex-row items-center gap-2 mb-1.5">
                <HelpCircle size={14} color="#38BDF8" />
                <Text className="text-[14px] font-bold text-white">{f.q}</Text>
              </View>
              <Text className="text-[13px] text-white/60 leading-[20px]">{f.a}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Screen ─────────────────────────────────────────

export default function CommunityScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [messages, setMessages] = useState<CommunityMsg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showRedEnvelope, setShowRedEnvelope] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const lastIdRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { loadMessages(); }, []);

  useEffect(() => {
    const interval = setInterval(() => { pollMessages(); }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, [messages.length]);

  async function loadMessages() {
    try {
      const headers = await authHeaders();
      const r = await fetch(`${API_BASE}/api/chat/community`, { headers });
      const d = await r.json();
      if (d.messages) {
        setMessages(d.messages);
        if (d.messages.length > 0) lastIdRef.current = d.messages[d.messages.length - 1].id;
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  async function pollMessages() {
    try {
      const headers = await authHeaders();
      const after = lastIdRef.current;
      const url = after > 0 ? `${API_BASE}/api/chat/community?after=${after}` : `${API_BASE}/api/chat/community`;
      const r = await fetch(url, { headers });
      const d = await r.json();
      if (d.messages?.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = d.messages.filter((m: CommunityMsg) => !existingIds.has(m.id));
          return newMsgs.length === 0 ? prev : [...prev, ...newMsgs].slice(-100);
        });
        lastIdRef.current = d.messages[d.messages.length - 1].id;
      }
    } catch { /* silent */ }
  }

  async function handleSend() {
    const content = inputValue.trim();
    if (!content) return;
    setInputValue("");
    try {
      const headers = await authHeaders();
      const r = await fetch(`${API_BASE}/api/chat/community`, { method: "POST", headers, body: JSON.stringify({ content }) });
      const d = await r.json();
      if (d.ok && d.message) {
        setMessages((prev) => [...prev, d.message].slice(-100));
        lastIdRef.current = d.message.id;
      }
    } catch { /* silent */ }
  }

  function formatTime(ts: string) {
    try {
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch { return ""; }
  }

  const quickActions = [
    { icon: Calendar, label: "签到", color: "#F7D56D", onPress: () => setShowCheckin(true) },
    { icon: Gift, label: "红包", color: "#FF6D72", onPress: () => setShowRedEnvelope(true) },
    { icon: Trophy, label: "排行榜", color: "#55F59A", onPress: () => router.push("/(app)/rewards" as any) },
    { icon: HelpCircle, label: "问答", color: "#38BDF8", onPress: () => setShowQA(true) },
  ];

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#050015]" behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3 border-b border-white/5">
        <Text className="text-[22px] font-black text-[#F7D56D]">社区广场</Text>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
          <Bell size={20} color="#F7D56D" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View className="flex-row px-5 py-3 gap-3 bg-[#0A0020] border-b border-white/5">
        {quickActions.map((action) => (
          <TouchableOpacity key={action.label} className="flex-1 items-center py-2 bg-white/5 rounded-xl" onPress={action.onPress}>
            <action.icon size={20} color={action.color} />
            <Text className="text-white/60 text-[11px] mt-1">{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Agent Signal Banner */}
      <TouchableOpacity
        onPress={() => router.push("/(app)/chat/zhuge")}
        className="mx-5 mt-3 bg-[#1A0633]/90 border border-[#F7D56D]/40 rounded-2xl px-4 py-3"
      >
        <View className="flex-row items-center gap-2 mb-2">
          <View className="bg-[#F7D56D]/20 rounded-full px-2 py-0.5">
            <Text className="text-[#F7D56D] text-[10px] font-bold">Agent 信号</Text>
          </View>
          <Text className="text-white/40 text-[11px]">诸葛策略 · 实时推送</Text>
        </View>
        <Text className="text-white text-[14px] font-bold">BTC 多单信号</Text>
        <Text className="text-white/60 text-[12px] mt-0.5">入场 98,500 · 止盈 102,000 · 止损 96,000 · RR 2.3</Text>
      </TouchableOpacity>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        className="flex-1 px-5"
        contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <MessageSquare size={40} color="#8A3FFC" />
            <Text className="text-white/40 text-[14px] mt-3">{loading ? "加载中..." : "还没有消息，来发第一条吧"}</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.role === "system") {
            return (
              <View className="items-center my-2">
                <Text className="text-white/30 text-[12px] bg-white/5 px-3 py-1 rounded-full">{item.content}</Text>
              </View>
            );
          }
          if (item.role === "agent") {
            return (
              <View className="mb-3 bg-[#1A0633]/90 border border-[#F7D56D]/30 rounded-2xl px-4 py-3 mx-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-[#F7D56D] text-[11px] font-bold">🤖 Agent</Text>
                  <Text className="text-white/30 text-[10px]">{formatTime(item.created_at)}</Text>
                </View>
                <Text className="text-white text-[14px]">{item.content}</Text>
              </View>
            );
          }
          return (
            <View className="flex-row mb-3 gap-2">
              <View className="w-8 h-8 rounded-full bg-[#8A3FFC]/40 items-center justify-center">
                <Text className="text-[#F7D56D] text-[11px] font-bold">{item.user_id.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-white/70 text-[12px] font-bold">{item.user_id.slice(0, 8)}</Text>
                  <Text className="text-white/30 text-[10px]">{formatTime(item.created_at)}</Text>
                </View>
                <Text className="text-white/85 text-[14px]">{item.content}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input Bar */}
      <View className="flex-row items-center px-4 py-3 border-t border-white/5 bg-[#0A0020] gap-2">
        <TextInput
          value={inputValue} onChangeText={setInputValue}
          placeholder={isLoggedIn ? "说点什么..." : "登录后参与群聊"}
          placeholderTextColor="rgba(235,216,255,0.4)"
          multiline maxLength={500}
          editable={isLoggedIn}
          className="flex-1 bg-white/5 border border-white/10 rounded-[20px] px-4 py-2.5 text-white text-[14px] max-h-[80px]"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity onPress={handleSend} disabled={!inputValue.trim()} className={`w-10 h-10 rounded-full items-center justify-center ${inputValue.trim() ? "bg-[#F7D56D]" : "bg-white/10"}`}>
          <Send size={16} color={inputValue.trim() ? "#1A0633" : "#8A3FFC"} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CheckinModal visible={showCheckin} onClose={() => setShowCheckin(false)} />
      <RedEnvelopeModal visible={showRedEnvelope} onClose={() => setShowRedEnvelope(false)} />
      <QAModal visible={showQA} onClose={() => setShowQA(false)} />
    </KeyboardAvoidingView>
  );
}
