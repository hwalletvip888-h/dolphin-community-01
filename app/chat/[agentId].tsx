import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, ChevronLeft, Sparkles, StopCircle } from "lucide-react-native";
import { useChat } from "@/src/stores/chat";
import { AGENTS } from "@/src/data/agents";
import { CardRenderer } from "@/src/ui/cards/CardRenderer";
import type { Message } from "@/src/types";

// ── Rich text ──
function RichText({ text }: { text: string }) {
  return (
    <Text style={rt.text}>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") ? (
          <Text key={i} style={rt.bold}>{part.replace(/\*/g, "")}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}
const rt = StyleSheet.create({
  text: { fontSize: 15, color: "rgba(255,255,255,0.88)", lineHeight: 23 },
  bold: { fontWeight: "700", color: "#fff" },
});

// ── Typing dots ──
function TypingIndicator() {
  const [d, setD] = useState(0);
  useEffect(() => { const t = setInterval(() => setD((p) => (p + 1) % 3), 350); return () => clearInterval(t); }, []);
  return (
    <View style={ti.row}>
      {[0, 1, 2].map((i) => <View key={i} style={[ti.dot, i === d && ti.dotOn]} />)}
    </View>
  );
}
const ti = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, paddingLeft: 14, paddingVertical: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.12)" },
  dotOn: { backgroundColor: "#C084FC", transform: [{ scale: 1.3 }] },
});

// ═══════════════ Main ═══════════════

export default function ChatScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const router = useRouter();
  const agent = AGENTS.find((a) => a.id === agentId) || AGENTS[0];
  const { messages, isTyping, send, clear, cancel } = useChat();
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<Message>>(null);
  const isEmpty = messages.length === 0;

  useEffect(() => { clear(); }, [agentId]);

  const scrollToBottom = useCallback(() => {
    if (messages.length === 0) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = () => {
    const t = input.trim();
    if (!t || isTyping) return;
    setInput("");
    send(t, agentId);
  };

  const renderMsg = useCallback(({ item }: { item: Message }) => {
    if (!item.content) return null;
    const me = item.role === "user";
    return (
      <View style={[ms.row, me ? ms.userRow : ms.agentRow]}>
        {me ? (
          <View style={[ms.userB, { backgroundColor: agent.color }]}>
            <Text style={ms.userT}>{item.content}</Text>
          </View>
        ) : (
          <View style={ms.agentBlock}>
            <View style={ms.agentB}>
              <RichText text={item.content} />
            </View>
            {item.cards?.map((c, i) => <View key={i} style={{ marginTop: 10 }}><CardRenderer data={c} /></View>)}
          </View>
        )}
      </View>
    );
  }, [agent.color]);

  const welcome = (
    <View style={ws.wrap}>
      <View style={ws.card}>
        <View style={[ws.avatar, { borderColor: agent.color }]}>
          <Text style={[ws.avatarT, { color: agent.color }]}>{agent.name[0]}</Text>
        </View>
        <Text style={ws.name}>{agent.name}</Text>
        <Text style={ws.title}>{agent.title}</Text>
        <Text style={ws.desc}>{agent.desc}</Text>
        <View style={ws.skills}>
          {agent.skills.map((sk) => (
            <View key={sk} style={[ws.skill, { borderColor: agent.color + "30" }]}>
              <Text style={[ws.skillT, { color: agent.color }]}>{sk}</Text>
            </View>
          ))}
        </View>
        <View style={ws.msgBubble}>
          <Text style={ws.msgText}>{agent.welcome}</Text>
        </View>
      </View>
      <Text style={ws.qTitle}>你可以这样问我：</Text>
      <View style={ws.qRow}>
        {agent.questions.map((q) => (
          <TouchableOpacity key={q} style={ws.qBtn} onPress={() => send(q, agentId)}>
            <Text style={ws.qT}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <View style={[s.hAv, { borderColor: agent.color + "40" }]}>
          <Text style={[s.hAvT, { color: agent.color }]}>{agent.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.hName}>{agent.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={s.onlineDot} />
            <Text style={s.hStatus}>在线</Text>
          </View>
        </View>
        <View style={s.modelBadge}>
          <Sparkles size={13} color="#F7D56D" />
          <Text style={s.modelT}>H1.6</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMsg}
        contentContainerStyle={[s.listContent, isEmpty && { flex: 1 }]}
        ListEmptyComponent={welcome}
        onContentSizeChange={scrollToBottom}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />

      {/* Typing */}
      {isTyping && <TypingIndicator />}

      {/* Input */}
      <View style={s.inputBar}>
        <TextInput
          value={input} onChangeText={setInput}
          placeholder={`向 ${agent.name} 提问...`}
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline maxLength={1000}
          style={s.input}
          onSubmitEditing={handleSend} returnKeyType="send" blurOnSubmit={false}
        />
        {isTyping ? (
          <TouchableOpacity onPress={cancel} style={s.stopBtn}><StopCircle size={22} color="#FB923C" /></TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSend} disabled={!input.trim()} style={[s.send, input.trim() ? s.sendOn : s.sendOff]}>
            <Send size={17} color={input.trim() ? "#0D001A" : "rgba(255,255,255,0.25)"} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ═══════════════ Styles ═══════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingBottom: 10, paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "#090012" },
  back: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  hAv: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginRight: 10, backgroundColor: "rgba(255,255,255,0.04)" },
  hAvT: { fontSize: 15, fontWeight: "800" },
  hName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  hStatus: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  modelBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(247,213,109,0.1)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  modelT: { fontSize: 11, fontWeight: "700", color: "#F7D56D" },
  listContent: { padding: 10, paddingBottom: 20 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 8, paddingBottom: 28, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)", gap: 8, backgroundColor: "#0A0020" },
  input: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: "#fff", fontSize: 15, maxHeight: 110 },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sendOff: { backgroundColor: "rgba(255,255,255,0.06)" },
  sendOn: { backgroundColor: "#F7D56D" },
  stopBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(251,146,60,0.12)", alignItems: "center", justifyContent: "center" },
});

const ms = StyleSheet.create({
  row: { marginBottom: 12, paddingHorizontal: 2 },
  userRow: { alignItems: "flex-end" },
  agentRow: { alignItems: "flex-start" },
  userB: { maxWidth: "82%", borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 15, paddingVertical: 10 },
  userT: { fontSize: 15, color: "#0D001A", lineHeight: 21 },
  agentBlock: { maxWidth: "92%" },
  agentB: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 15, paddingVertical: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
});

const ws = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 8, paddingBottom: 30 },
  card: { backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 24, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.15)", padding: 24, alignItems: "center", marginBottom: 20, marginHorizontal: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: "center", justifyContent: "center", marginBottom: 12, backgroundColor: "rgba(255,255,255,0.03)" },
  avatarT: { fontSize: 28, fontWeight: "900" },
  name: { fontSize: 22, fontWeight: "900", color: "#fff", marginBottom: 3 },
  title: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.4)", marginBottom: 10 },
  desc: { fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 20, marginBottom: 14 },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 14 },
  skill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  skillT: { fontSize: 11, fontWeight: "600" },
  msgBubble: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 12, width: "100%" },
  msgText: { fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 18, textAlign: "center" },
  qTitle: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.35)", marginBottom: 10, marginLeft: 12 },
  qRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 8 },
  qBtn: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.07)", paddingHorizontal: 14, paddingVertical: 10 },
  qT: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
});
