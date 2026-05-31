import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, ChevronLeft } from "lucide-react-native";
import { useChat } from "@/src/stores/chat";
import { AGENTS } from "@/src/data/agents";
import { CardRenderer } from "@/src/ui/cards/CardRenderer";
import { Markdown } from "@/src/ui/Markdown";
import type { Message } from "@/src/types";
import { color, radius, font } from "@/src/theme";

// ═══════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════

function UserBubble({ text, color }: { text: string; color: string }) {
  return (
    <View style={ub.outer}>
      <View style={[ub.bubble, { backgroundColor: color }]}>
        <Text style={ub.text}>{text}</Text>
      </View>
      <View style={[ub.triangle, { borderTopColor: color }]} />
    </View>
  );
}

function AgentBubble({ text, cards }: { text: string; cards?: any[] }) {
  return (
    <View style={ab.outer}>
      <View style={ab.bubble}>
        <Markdown text={text} />
      </View>
      {cards?.map((card, i) => (
        <View key={i} style={ab.cardGap}>
          <CardRenderer data={card} />
        </View>
      ))}
    </View>
  );
}

function TypingDots() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % 3), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={td.row}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[td.dot, i === phase && td.dotActive]} />
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════
// Main screen
// ═══════════════════════════════════════════════

export default function ChatScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const router = useRouter();
  const agent = AGENTS.find((a) => a.id === agentId) || AGENTS[0];
  const { messages, isTyping, send, clear } = useChat();
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<Message>>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => { clear(); }, [agentId]);

  // ── Auto-scroll: pin latest at top (ChatGPT-style) ──
  const doScroll = useCallback((animated = true) => {
    if (messages.length === 0 || userScrolledUp.current) return;
    listRef.current?.scrollToIndex({
      index: messages.length - 1,
      animated,
      viewPosition: 0,
    });
  }, [messages.length]);

  useEffect(() => { doScroll(true); }, [messages]);

  const handleScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distFromEnd = contentSize.height - contentOffset.y - layoutMeasurement.height;
    userScrolledUp.current = distFromEnd > 120;
  }, []);

  // ── Send ──
  const doSend = () => {
    const t = input.trim();
    if (!t || isTyping) return;
    setInput("");
    userScrolledUp.current = false;
    send(t, agentId);
  };

  // ── Render ──
  const renderMsg = useCallback(({ item }: { item: Message }) => {
    if (!item.content) return null;
    if (item.role === "user") {
      return <UserBubble text={item.content} color={agent.color} />;
    }
    return <AgentBubble text={item.content} cards={item.cards as any} />;
  }, [agent.color]);

  const empty = (
    <View style={es.wrap}>
      <View style={[es.avatarRing, { borderColor: agent.color + "40" }]}>
        <View style={[es.avatar, { borderColor: agent.color }]}>
          <Text style={[es.avatarLetter, { color: agent.color }]}>{agent.name[0]}</Text>
        </View>
      </View>
      <Text style={es.name}>{agent.name}</Text>
      <Text style={es.desc}>{agent.welcome}</Text>
      <View style={es.qGrid}>
        {agent.questions.map((q) => (
          <TouchableOpacity
            key={q}
            style={es.qBtn}
            onPress={() => { userScrolledUp.current = false; send(q, agentId); }}
          >
            <Text style={es.qText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={cs.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ── Header ── */}
      <View style={cs.header}>
        <TouchableOpacity onPress={() => router.back()} style={cs.backBtn} hitSlop={8}>
          <ChevronLeft size={23} color="#fff" />
        </TouchableOpacity>
        <View style={[cs.hAvatar, { borderColor: agent.color + "30" }]}>
          <Text style={[cs.hAvatarTxt, { color: agent.color }]}>{agent.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cs.hName}>{agent.name}</Text>
          <Text style={cs.hSub}>{agent.title} · {agent.skills.length}项技能</Text>
        </View>
      </View>

      {/* ── Messages ── */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMsg}
        contentContainerStyle={[cs.listContent, messages.length === 0 && cs.listEmpty]}
        ListEmptyComponent={empty}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={() => doScroll(false)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />

      {/* ── Typing ── */}
      {isTyping && <TypingDots />}

      {/* ── Scroll-to-bottom button (when user scrolled up) ── */}
      {userScrolledUp.current && messages.length > 3 && (
        <TouchableOpacity style={cs.scrollBtn} onPress={() => { userScrolledUp.current = false; doScroll(true); }}>
          <Text style={cs.scrollBtnText}>↓ 最新</Text>
        </TouchableOpacity>
      )}

      {/* ── Input ── */}
      <View style={cs.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`向 ${agent.name} 提问...`}
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline
          maxLength={1000}
          style={cs.input}
          onSubmitEditing={doSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={doSend}
          disabled={isTyping}
          style={[cs.sendBtn, input.trim() && !isTyping ? cs.sendActive : cs.sendIdle]}
        >
          <Send size={17} color={input.trim() && !isTyping ? "#0D001A" : "rgba(255,255,255,0.25)"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════

const cs = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 56, paddingBottom: 10, paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: color.bg,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  hAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 10, backgroundColor: "rgba(255,255,255,0.03)" },
  hAvatarTxt: { fontSize: 15, fontWeight: "800" },
  hName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  hSub: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 },
  listContent: { padding: 10, paddingBottom: 20 },
  listEmpty: { flex: 1 },
  scrollBtn: {
    position: "absolute", bottom: 90, alignSelf: "center",
    backgroundColor: "rgba(192,99,255,0.25)", borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  scrollBtnText: { fontSize: 12, fontWeight: "600", color: "#C063FF" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", padding: 8, paddingBottom: 30,
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)",
    gap: 8, backgroundColor: color.purpleDark,
  },
  input: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)", borderRadius: 20, paddingHorizontal: 15,
    paddingVertical: 9, color: "#fff", fontSize: 15, maxHeight: 110,
  },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  sendIdle: { backgroundColor: "rgba(255,255,255,0.05)" },
  sendActive: { backgroundColor: color.gold },
});

// ── User bubble ──
const ub = StyleSheet.create({
  outer: { alignItems: "flex-end", marginBottom: 12, marginRight: 2 },
  bubble: { maxWidth: "80%", borderRadius: 16, borderBottomRightRadius: 3, paddingHorizontal: 14, paddingVertical: 9 },
  text: { fontSize: 15, color: "#0D001A", lineHeight: 21 },
  triangle: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderLeftColor: "transparent", borderRightColor: "transparent", marginRight: 10, marginTop: -1 },
});

// ── Agent bubble ──
const ab = StyleSheet.create({
  outer: { alignItems: "flex-start", marginBottom: 12, marginLeft: 2 },
  bubble: {
    maxWidth: "90%", backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16, borderBottomLeftRadius: 3, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)",
  },
  cardGap: { marginTop: 10, width: "100%" },
});

// ── Typing dots ──
const td = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, paddingLeft: 18, paddingBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.15)" },
  dotActive: { backgroundColor: "#C084FF", transform: [{ scale: 1.3 }] },
});

// ── Empty state ──
const es = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  avatarRing: { borderWidth: 1, borderRadius: 99, padding: 5, marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 28, fontWeight: "900" },
  name: { fontSize: 20, fontWeight: "900", color: "#fff", marginBottom: 6 },
  desc: { fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 22, marginBottom: 28, paddingHorizontal: 10 },
  qGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  qBtn: {
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)", borderRadius: 16, paddingHorizontal: 15, paddingVertical: 10,
  },
  qText: { fontSize: 13, color: "rgba(255,255,255,0.55)" },
});
