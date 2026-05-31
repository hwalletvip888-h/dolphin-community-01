import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { Send } from "lucide-react-native";

const MOCK_MSGS = [
  { id: "1", user: "DeFi_Degen", content: "BTC 突破 $88K！诸葛策略给的信号太准了 🔥", time: "2m" },
  { id: "2", user: "CryptoWhale", content: "链上猎手发现的地址今天又拉了 15%", time: "5m" },
  { id: "3", user: "Newbie_001", content: "刚用 DEX 兑换了第一个 Meme，感觉不错", time: "8m" },
  { id: "4", user: "TraderMax", content: "有没有一起研究 ETH 策略的？组个群", time: "12m" },
  { id: "5", user: "HODLer", content: "世界杯竞猜西班牙夺冠，跟了 $50", time: "15m" },
  { id: "6", user: "小海豚", content: "欢迎新朋友！有问题随时问我 🐬", time: "20m" },
];

interface ChatMsg {
  id: string;
  user: string;
  content: string;
  time: string;
  isMe?: boolean;
}

export default function CommunityScreen() {
  const [msgs, setMsgs] = useState<ChatMsg[]>(MOCK_MSGS);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<ChatMsg>>(null);

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    setMsgs((p) => [{ id: Date.now().toString(), user: "我", content: t, time: "刚刚", isMe: true }, ...p]);
    setInput("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMsg = ({ item }: { item: ChatMsg }) => (
    <View style={item.isMe ? ms.meRow : ms.row}>
      {!item.isMe && (
        <View style={ms.avatar}>
          <Text style={ms.avatarTxt}>{item.user[0]}</Text>
        </View>
      )}
      <View style={[item.isMe ? ms.meBubble : ms.bubble]}>
        {!item.isMe && <Text style={ms.userName}>{item.user}</Text>}
        <Text style={item.isMe ? ms.meText : ms.text}>{item.content}</Text>
        <Text style={ms.time}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>海豚社区</Text>
        <View style={s.onlineRow}>
          <View style={s.onlineDot} />
          <Text style={s.onlineText}>128 人在线</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        renderItem={renderMsg}
        contentContainerStyle={s.list}
        inverted
        keyboardShouldPersistTaps="handled"
      />

      {/* Input */}
      <View style={s.inputBar}>
        <TextInput
          value={input} onChangeText={setInput}
          placeholder="和大家聊聊..."
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline maxLength={500}
          style={s.input}
          onSubmitEditing={handleSend}
          returnKeyType="send" blurOnSubmit={false}
        />
        <TouchableOpacity onPress={handleSend} disabled={!input.trim()} style={[s.send, input.trim() ? s.sendOn : s.sendOff]}>
          <Send size={17} color={input.trim() ? "#0D001A" : "rgba(255,255,255,0.25)"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { alignItems: "center", paddingTop: 56, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  title: { fontSize: 20, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  onlineText: { fontSize: 11, color: "rgba(255,255,255,0.35)" },

  list: { padding: 12, paddingBottom: 20 },
  row: { flexDirection: "row", gap: 8, marginBottom: 14 },
  meRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 14 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(192,99,255,0.2)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  avatarTxt: { fontSize: 12, fontWeight: "700", color: "#C063FF" },
  bubble: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 10, maxWidth: "80%" },
  meBubble: { backgroundColor: "#C063FF", borderRadius: 16, padding: 10, maxWidth: "80%" },
  userName: { fontSize: 11, fontWeight: "700", color: "#C063FF", marginBottom: 2 },
  text: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20 },
  meText: { fontSize: 14, color: "#fff", lineHeight: 20 },
  time: { fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4, textAlign: "right" },

  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 8, paddingBottom: 28, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)", gap: 8, backgroundColor: "#0A0020" },
  input: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: "#fff", fontSize: 15, maxHeight: 100 },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sendOff: { backgroundColor: "rgba(255,255,255,0.06)" },
  sendOn: { backgroundColor: "#F7D56D" },
});

const ms = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 14 },
  meRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 14 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(192,99,255,0.2)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  avatarTxt: { fontSize: 12, fontWeight: "700", color: "#C063FF" },
  bubble: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 10, maxWidth: "80%" },
  meBubble: { backgroundColor: "#C063FF", borderRadius: 16, padding: 10, maxWidth: "80%" },
  userName: { fontSize: 11, fontWeight: "700", color: "#C063FF", marginBottom: 2 },
  text: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20 },
  meText: { fontSize: 14, color: "#fff", lineHeight: 20 },
  time: { fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4, textAlign: "right" },
});
