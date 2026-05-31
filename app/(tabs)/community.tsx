import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { Send, Smile, Plus, TrendingUp, Target, Copy, Zap } from "lucide-react-native";

type MsgType = "text" | "signal" | "position" | "onchain";

interface ChatMsg {
  id: string; user: string; type: MsgType; content?: string; time: string; isMe?: boolean;
  signal?: { symbol: string; direction: string; entry: string; tp: string; sl: string; rr: string; confidence: string };
  position?: { symbol: string; side: string; size: string; pnl: string; pnlPct: string };
  onchain?: { token: string; action: string; amount: string; chain: string };
}

const MOCK_MSGS: ChatMsg[] = [
  { id: "1", user: "诸葛策略", type: "signal", time: "3m", signal: { symbol: "BTC/USDT", direction: "做多", entry: "87,200", tp: "89,500", sl: "85,800", rr: "2.4", confidence: "85%" } },
  { id: "2", user: "链上猎手", type: "onchain", time: "8m", onchain: { token: "PEPE", action: "鲸鱼建仓", amount: "$142K", chain: "Ethereum" } },
  { id: "3", user: "DeFi_Degen", type: "text", content: "BTC 突破 $88K！诸葛策略给的信号太准了 🔥", time: "12m" },
  { id: "4", user: "TraderMax", type: "position", time: "18m", position: { symbol: "ETH/USDT", side: "多", size: "0.5 ETH", pnl: "+$45.20", pnlPct: "+3.2%" } },
  { id: "5", user: "CryptoWhale", type: "text", content: "链上猎手发现的地址今天又拉了 15%", time: "25m" },
];

export default function CommunityScreen() {
  const [msgs, setMsgs] = useState<ChatMsg[]>(MOCK_MSGS);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<ChatMsg>>(null);

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    setMsgs((p) => [{ id: Date.now().toString(), user: "我", type: "text", content: t, time: "刚刚", isMe: true }, ...p]);
    setInput("");
  };

  const handleSharePosition = () => {
    setMsgs((p) => [{ id: Date.now().toString(), user: "我", type: "position", time: "刚刚", isMe: true, position: { symbol: "BTC/USDT", side: "多", size: "0.01 BTC", pnl: "+$12.40", pnlPct: "+1.8%" } }, ...p]);
  };

  const renderItem = ({ item }: { item: ChatMsg }) => {
    if (item.type === "signal") return <SignalCard item={item} />;
    if (item.type === "onchain") return <OnchainCard item={item} />;
    if (item.type === "position") return <PositionCard item={item} />;
    return <TextMsg item={item} />;
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View style={s.header}>
        <Text style={s.title}>海豚社区</Text>
        <View style={s.onlineRow}><View style={s.onlineDot} /><Text style={s.onlineText}>128 人在线</Text></View>
      </View>

      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        inverted
        keyboardShouldPersistTaps="handled"
      />

      <View style={s.inputBar}>
        <TouchableOpacity style={s.emojiBtn}><Smile size={22} color="rgba(255,255,255,0.4)" /></TouchableOpacity>
        <TouchableOpacity style={s.plusBtn} onPress={handleSharePosition}><Plus size={22} color="rgba(255,255,255,0.4)" /></TouchableOpacity>
        <TextInput
          value={input} onChangeText={setInput} placeholder="和大家聊聊..." placeholderTextColor="rgba(255,255,255,0.2)"
          multiline maxLength={500} style={s.input}
          onSubmitEditing={handleSend} returnKeyType="send" blurOnSubmit={false}
        />
        <TouchableOpacity onPress={handleSend} disabled={!input.trim()} style={[s.send, input.trim() ? s.sendOn : s.sendOff]}>
          <Send size={17} color={input.trim() ? "#0D001A" : "rgba(255,255,255,0.25)"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ═══ Message types ═══

function TextMsg({ item }: { item: ChatMsg }) {
  return (
    <View style={[ms.row, item.isMe && { justifyContent: "flex-end" }]}>
      {!item.isMe && <View style={ms.avatar}><Text style={ms.avatarT}>{item.user[0]}</Text></View>}
      <View style={[item.isMe ? ms.meB : ms.b, { maxWidth: "78%" }]}>
        {!item.isMe && <Text style={ms.user}>{item.user}</Text>}
        <Text style={item.isMe ? ms.meT : ms.t}>{item.content}</Text>
        <Text style={ms.time}>{item.time}</Text>
      </View>
    </View>
  );
}

function SignalCard({ item }: { item: ChatMsg }) {
  const s = item.signal!;
  return (
    <View style={cs.card}>
      <View style={cs.head}>
        <View style={cs.avatar}><Text style={cs.avatarT}>诸</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={cs.user}>诸葛策略</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><View style={cs.liveDot} /><Text style={cs.liveText}>实时信号</Text></View>
        </View>
        <Text style={cs.time}>{item.time}</Text>
      </View>
      <View style={cs.body}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={cs.symbol}>{s.symbol}</Text>
          <View style={cs.dirBadge}><Text style={cs.dirText}>{s.direction} {s.confidence}</Text></View>
        </View>
        <View style={cs.metrics}>
          <MetricBox label="入场" value={s.entry} />
          <MetricBox label="止盈" value={s.tp} color="#34D399" />
          <MetricBox label="止损" value={s.sl} color="#FB923C" />
          <MetricBox label="盈亏比" value={s.rr} color="#F7D56D" />
        </View>
      </View>
      <TouchableOpacity style={cs.followBtn} activeOpacity={0.8}>
        <Copy size={15} color="#090012" />
        <Text style={cs.followText}>一键跟单</Text>
      </TouchableOpacity>
      <Text style={cs.disclaimer}>跟单有风险，请设置个人最大亏损限额</Text>
    </View>
  );
}

function OnchainCard({ item }: { item: ChatMsg }) {
  const o = item.onchain!;
  return (
    <View style={[cs.card, { borderColor: "rgba(167,139,250,0.2)" }]}>
      <View style={cs.head}>
        <View style={[cs.avatar, { backgroundColor: "rgba(167,139,250,0.15)" }]}><Text style={[cs.avatarT, { color: "#A78BFA" }]}>猎</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={cs.user}>链上猎手</Text>
          <Text style={cs.label}>{o.chain}</Text>
        </View>
        <Text style={cs.time}>{item.time}</Text>
      </View>
      <View style={cs.body}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={cs.tokenName}>{o.token}</Text>
            <Text style={cs.tokenAction}>{o.action}</Text>
          </View>
          <Text style={cs.tokenAmt}>{o.amount}</Text>
        </View>
      </View>
      <TouchableOpacity style={[cs.followBtn, { backgroundColor: "#A78BFA" }]} activeOpacity={0.8}>
        <Zap size={15} color="#fff" />
        <Text style={[cs.followText, { color: "#fff" }]}>一键跟单</Text>
      </TouchableOpacity>
    </View>
  );
}

function PositionCard({ item }: { item: ChatMsg }) {
  const p = item.position!;
  return (
    <View style={[ms.row, item.isMe && { justifyContent: "flex-end" }]}>
      {!item.isMe && <View style={ms.avatar}><Text style={ms.avatarT}>{item.user[0]}</Text></View>}
      <View style={ps.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={ps.symbol}>{p.symbol}</Text>
          <Text style={[ps.side, { color: p.side === "多" ? "#34D399" : "#FB923C" }]}>{p.side} {p.size}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={ps.user}>{item.user} 的持仓</Text>
          <Text style={[ps.pnl, { color: p.pnl.startsWith("+") ? "#34D399" : "#FB923C" }]}>{p.pnl} ({p.pnlPct})</Text>
        </View>
      </View>
    </View>
  );
}

function MetricBox({ label, value, color = "#fff" }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color }}>{value}</Text>
    </View>
  );
}

// ═══ Styles ═══

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { alignItems: "center", paddingTop: 56, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  title: { fontSize: 20, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  onlineText: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  list: { padding: 12, paddingBottom: 20 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 6, paddingBottom: 28, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)", gap: 6, backgroundColor: "#0A0020" },
  emojiBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  plusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  input: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, color: "#fff", fontSize: 15, maxHeight: 100 },
  send: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  sendOff: { backgroundColor: "rgba(255,255,255,0.06)" },
  sendOn: { backgroundColor: "#F7D56D" },
});

// Text messages
const ms = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 14 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(192,99,255,0.2)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  avatarT: { fontSize: 12, fontWeight: "700", color: "#C063FF" },
  b: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 10 },
  meB: { backgroundColor: "#C063FF", borderRadius: 16, padding: 10 },
  user: { fontSize: 11, fontWeight: "700", color: "#C063FF", marginBottom: 2 },
  t: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20 },
  meT: { fontSize: 14, color: "#fff", lineHeight: 20 },
  time: { fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4, textAlign: "right" },
});

// Card messages (signal / onchain)
const cs = StyleSheet.create({
  card: { backgroundColor: "rgba(35,10,62,0.6)", borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)", padding: 16, marginBottom: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(192,132,252,0.15)", alignItems: "center", justifyContent: "center" },
  avatarT: { fontSize: 14, fontWeight: "800", color: "#C084FC" },
  user: { fontSize: 14, fontWeight: "700", color: "#fff" },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#34D399" },
  liveText: { fontSize: 10, color: "#34D399", fontWeight: "600" },
  label: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 },
  time: { fontSize: 10, color: "rgba(255,255,255,0.25)" },
  body: { marginBottom: 12 },
  symbol: { fontSize: 18, fontWeight: "800", color: "#fff" },
  dirBadge: { backgroundColor: "rgba(52,211,153,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dirText: { fontSize: 12, fontWeight: "700", color: "#34D399" },
  metrics: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12 },
  tokenName: { fontSize: 18, fontWeight: "800", color: "#fff" },
  tokenAction: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  tokenAmt: { fontSize: 18, fontWeight: "800", color: "#A78BFA" },
  followBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#F7D56D", borderRadius: 14, paddingVertical: 12 },
  followText: { fontSize: 14, fontWeight: "700", color: "#090012" },
  disclaimer: { fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8 },
});

// Position card
const ps = StyleSheet.create({
  card: { backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(192,99,255,0.15)", padding: 12, maxWidth: "78%" },
  symbol: { fontSize: 14, fontWeight: "700", color: "#fff" },
  side: { fontSize: 11, fontWeight: "700" },
  user: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  pnl: { fontSize: 13, fontWeight: "700" },
});
