import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Modal,
} from "react-native";
import { Send, Smile, Plus, Copy, Zap, X, CheckCircle, Share2, TrendingUp, BarChart3, Trophy, Gift, Users } from "lucide-react-native";
import { useAuth } from "@/src/stores/auth";

type MsgType = "text" | "signal" | "position" | "onchain";
interface ChatMsg {
  id: string; user: string; type: MsgType; content?: string; time: string; isMe?: boolean;
  signal?: { symbol: string; direction: string; entry: string; tp: string; sl: string; rr: string; confidence: string };
  position?: { symbol: string; side: string; size: string; pnl: string; pnlPct: string };
  onchain?: { token: string; action: string; amount: string; chain: string };
}

const MOCK: ChatMsg[] = [
  { id: "1", user: "诸葛策略", type: "signal", time: "3m", signal: { symbol: "BTC/USDT", direction: "做多", entry: "87,200", tp: "89,500", sl: "85,800", rr: "2.4", confidence: "85%" } },
  { id: "2", user: "链上猎手", type: "onchain", time: "8m", onchain: { token: "PEPE", action: "鲸鱼建仓", amount: "$142K", chain: "Ethereum" } },
  { id: "3", user: "DeFi_Degen", type: "text", content: "BTC 突破 $88K！诸葛策略给的信号太准了 🔥", time: "12m" },
  { id: "4", user: "TraderMax", type: "position", time: "18m", position: { symbol: "ETH/USDT", side: "多", size: "0.5 ETH", pnl: "+$45.20", pnlPct: "+3.2%" } },
  { id: "5", user: "CryptoWhale", type: "text", content: "链上猎手发现的地址今天又拉了 15%", time: "25m" },
];

const CONTRACT_POS = [
  { id: "c1", symbol: "BTC/USDT", side: "多", leverage: "10x", usdValue: "$4,360", entryPrice: "87,200", markPrice: "87,450", liqPrice: "78,480", unrealizedPnl: "+$12.50", pnlPct: "+2.9%", strategy: "H1 布林带反转", agent: "诸葛策略" },
  { id: "c2", symbol: "ETH/USDT", side: "空", leverage: "5x", usdValue: "$2,075", entryPrice: "4,150", markPrice: "4,120", liqPrice: "4,980", unrealizedPnl: "+$15.00", pnlPct: "+3.6%", strategy: "EMA 金叉趋势", agent: "诸葛策略" },
];

const EARN_POS = [
  { id: "e1", protocol: "AAVE", chain: "Ethereum", token: "USDC", usdValue: "$800.00", apy: "8.2%", earned: "+$3.20", days: 12, type: "借贷" },
  { id: "e2", protocol: "Lido", chain: "Ethereum", token: "stETH", usdValue: "$1,250.00", apy: "3.8%", earned: "+$12.50", days: 45, type: "质押" },
  { id: "e3", protocol: "Uniswap V3", chain: "Arbitrum", token: "ETH/USDC LP", usdValue: "$420.00", apy: "18.5%", earned: "+$8.10", days: 20, type: "做市" },
];

export default function CommunityScreen() {
  const [msgs, setMsgs] = useState<ChatMsg[]>(MOCK);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [menuPage, setMenuPage] = useState<"main" | "position">("main");
  const [tab, setTab] = useState<"chat" | "positions">("chat");
  const { level } = useAuth();
  const listRef = useRef<FlatList<ChatMsg>>(null);
  // Mock positions for "current positions" tab
  const myContractPos = CONTRACT_POS;
  const myEarnPos = EARN_POS;

  const totalContract = myContractPos.reduce((s, p) => s + parseFloat(p.usdValue.replace("$","").replace(",","")), 0);
  const totalEarn = myEarnPos.reduce((s, p) => s + parseFloat(p.usdValue.replace("$","").replace(",","")), 0);
  const totalPnl = myContractPos.reduce((s, p) => s + parseFloat(p.unrealizedPnl.replace("$","").replace("+","")), 0) + myEarnPos.reduce((s, p) => s + parseFloat(p.earned.replace("$","").replace("+","")), 0);

  const addMsg = (msg: ChatMsg) => { setMsgs((p) => [msg, ...p]); setShowMenu(false); setMenuPage("main"); };

  const ACTIONS = [
    { icon: CheckCircle, label: "签到", color: "#34D399", action: () => addMsg({ id: Date.now().toString(), user: "小海豚", type: "text", content: "✅ 签到成功！+10 积分，连续签到 3 天额外 +20 积分", time: "刚刚" }) },
    { icon: Share2, label: "分享持仓", color: "#F7D56D", action: () => setMenuPage("position") },
    { icon: TrendingUp, label: "分享收益", color: "#C084FC", action: () => addMsg({ id: Date.now().toString(), user: "我", type: "text", content: `📊 收益报告\n\n今日 +$12.40 (+1.8%)\n本周 +$45.20 (+6.5%)\n本月 +$128.50 (+18.2%)\nLv.${level} · 连胜 12 天`, time: "刚刚", isMe: true }) },
    { icon: Users, label: "邀请排行", color: "#38BDF8", action: () => addMsg({ id: Date.now().toString(), user: "小海豚", type: "text", content: "🏆 邀请榜\n1. CryptoWhale 23人\n2. DeFi_Degen 18人\n3. TraderMax 15人\n\n你的排名 #8 (5人)", time: "刚刚" }) },
    { icon: Trophy, label: "交易赛", color: "#FB923C", action: () => addMsg({ id: Date.now().toString(), user: "小海豚", type: "text", content: "🏆 6月交易大赛\n奖池 $10,000 USDT\n参赛 Lv.5+ | 收益率排名\n\n1st $3,000 | 2nd $1,500 | 3rd $800\n回复「报名」参与", time: "刚刚" }) },
    { icon: Gift, label: "我的积分", color: "#FBBF24", action: () => addMsg({ id: Date.now().toString(), user: "小海豚", type: "text", content: `🎁 积分: 285\nLv.${level}\n\n签到 +10 | 邀请 +5\n跟单 +20 | 发帖 +5\n\n距下一级 215 积分`, time: "刚刚" }) },
  ];

  const handleSend = () => {
    const t = input.trim(); if (!t) return;
    addMsg({ id: Date.now().toString(), user: "我", type: "text", content: t, time: "刚刚", isMe: true }); setInput("");
  };

  const sharePosition = (pos: typeof CONTRACT_POS[0]) => {
    addMsg({ id: Date.now().toString(), user: "我", type: "position", time: "刚刚", isMe: true, position: pos });
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
        <Text style={s.hTitle}>海豚社区</Text>
        <View style={s.tabRow}>
          <TouchableOpacity style={[s.tab, tab === "positions" && s.tabActive]} onPress={() => setTab("positions")}>
            <Text style={[s.tabText, tab === "positions" && s.tabTextActive]}>当前仓位</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === "chat" && s.tabActive]} onPress={() => setTab("chat")}>
            <Text style={[s.tabText, tab === "chat" && s.tabTextActive]}>社区群聊</Text>
          </TouchableOpacity>
        </View>
        {tab === "chat" && <View style={s.hRow}><View style={s.hDot} /><Text style={s.hSub}>128 在线</Text></View>}
      </View>

      {tab === "chat" ? (
      <FlatList ref={listRef} data={msgs} keyExtractor={(m) => m.id} renderItem={renderItem} contentContainerStyle={s.list} inverted keyboardShouldPersistTaps="handled" />
      ) : (
      <ScrollView style={ps.posScroll} contentContainerStyle={ps.posContent}>
        {/* Summary */}
        <View style={ps.summaryCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ alignItems: "center" }}><Text style={ps.sumVal}>${totalContract.toLocaleString()}</Text><Text style={ps.sumLabel}>合约策略</Text></View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
            <View style={{ alignItems: "center" }}><Text style={ps.sumVal}>${totalEarn.toLocaleString()}</Text><Text style={ps.sumLabel}>链上赚币</Text></View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
            <View style={{ alignItems: "center" }}><Text style={[ps.sumVal, { color: totalPnl >= 0 ? "#34D399" : "#FB923C" }]}>{totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}</Text><Text style={ps.sumLabel}>总盈亏</Text></View>
          </View>
        </View>

        {/* Contract positions */}
        <Text style={ps.sectionTitle}>📊 合约策略仓位</Text>
        {myContractPos.map((pos) => (
          <View key={pos.id} style={ps.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={ps.symbol}>{pos.symbol}</Text>
                <Text style={[ps.side, { color: pos.side === "多" ? "#34D399" : "#FB923C" }]}>{pos.side}</Text>
                <Text style={ps.lev}>{pos.leverage}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[ps.pnl, { color: pos.unrealizedPnl.startsWith("+") ? "#34D399" : "#FB923C" }]}>{pos.unrealizedPnl} ({pos.pnlPct})</Text>
              </View>
            </View>
            <View style={ps.detailRow}>
              <View style={ps.detail}><Text style={ps.dLabel}>仓位价值</Text><Text style={ps.dVal}>{pos.usdValue}</Text></View>
              <View style={ps.detail}><Text style={ps.dLabel}>开仓价</Text><Text style={ps.dVal}>${pos.entryPrice}</Text></View>
              <View style={ps.detail}><Text style={ps.dLabel}>标记价</Text><Text style={ps.dVal}>${pos.markPrice}</Text></View>
              <View style={ps.detail}><Text style={ps.dLabel}>强平</Text><Text style={[ps.dVal, { color: "#FB923C" }]}>${pos.liqPrice}</Text></View>
            </View>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>策略: {pos.strategy} · {pos.agent}</Text>
            <TouchableOpacity style={ps.closeBtn} activeOpacity={0.7}>
              <Text style={ps.closeBtnText}>平仓</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Earn positions */}
        <Text style={[ps.sectionTitle, { marginTop: 8 }]}>💰 链上赚币仓位</Text>
        {myEarnPos.map((pos) => (
          <View key={pos.id} style={ps.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <View>
                <Text style={ps.symbol}>{pos.token}</Text>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{pos.protocol} · {pos.chain} · {pos.type}</Text>
              </View>
              <Text style={ps.usdVal}>{pos.usdValue}</Text>
            </View>
            <View style={ps.detailRow}>
              <View style={ps.detail}><Text style={ps.dLabel}>年化</Text><Text style={[ps.dVal, { color: "#34D399" }]}>{pos.apy}</Text></View>
              <View style={ps.detail}><Text style={ps.dLabel}>已赚</Text><Text style={[ps.dVal, { color: "#34D399" }]}>{pos.earned}</Text></View>
              <View style={ps.detail}><Text style={ps.dLabel}>天数</Text><Text style={ps.dVal}>{pos.days}天</Text></View>
            </View>
            <TouchableOpacity style={[ps.closeBtn, { backgroundColor: "rgba(251,146,60,0.1)", borderColor: "rgba(251,146,60,0.2)" }]} activeOpacity={0.7}>
              <Text style={[ps.closeBtnText, { color: "#FB923C" }]}>赎回</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      )}

      {tab === "chat" && <View style={s.bar}>
        <TouchableOpacity style={s.emoji}><Smile size={22} color="rgba(255,255,255,0.4)" /></TouchableOpacity>
        <TouchableOpacity style={s.plus} onPress={() => { setMenuPage("main"); setShowMenu(true); }}><Plus size={22} color="rgba(255,255,255,0.4)" /></TouchableOpacity>
        <TextInput value={input} onChangeText={setInput} placeholder="和大家聊聊..." placeholderTextColor="rgba(255,255,255,0.2)" multiline maxLength={500} style={s.inp} onSubmitEditing={handleSend} returnKeyType="send" blurOnSubmit={false} />
        <TouchableOpacity onPress={handleSend} disabled={!input.trim()} style={[s.send, input.trim() ? s.sendOn : s.sendOff]}><Send size={17} color={input.trim() ? "#0D001A" : "rgba(255,255,255,0.25)"} /></TouchableOpacity>
      </View>}

      {/* + Menu Modal */}
      <Modal visible={showMenu} transparent animationType="slide" onRequestClose={() => setShowMenu(false)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.head}>
              <TouchableOpacity onPress={() => menuPage === "position" ? setMenuPage("main") : setShowMenu(false)}>
                <Text style={m.back}>{menuPage === "position" ? "← 返回" : ""}</Text>
              </TouchableOpacity>
              <Text style={m.title}>{menuPage === "position" ? "选择持仓" : "社区功能"}</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}><X size={20} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
            </View>
            {menuPage === "main" ? (
              <View style={m.grid}>
                {ACTIONS.map((a, i) => (
                  <TouchableOpacity key={i} style={m.item} onPress={a.action} activeOpacity={0.7}>
                    <View style={[m.icon, { backgroundColor: a.color + "15" }]}><a.icon size={22} color={a.color} /></View>
                    <Text style={m.label}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>合约持仓</Text>
                {myContractPos.map((pos, i) => (
                  <TouchableOpacity key={"c"+i} style={m.posRow} onPress={() => sharePosition(pos)}>
                    <View>
                      <Text style={m.posSym}>{pos.symbol}</Text>
                      <Text style={{ fontSize: 12, color: pos.side === "多" ? "#34D399" : "#FB923C", fontWeight: "600" }}>{pos.side} {pos.leverage}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: pos.unrealizedPnl.startsWith("+") ? "#34D399" : "#FB923C" }}>{pos.unrealizedPnl}</Text>
                      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{pos.pnlPct}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ═══ Components ═══

function TextMsg({ item }: { item: ChatMsg }) {
  return (
    <View style={[ms.row, item.isMe && { justifyContent: "flex-end" }]}>
      {!item.isMe && <View style={ms.av}><Text style={ms.avT}>{item.user[0]}</Text></View>}
      <View style={[item.isMe ? ms.me : ms.bb]}>
        {!item.isMe && <Text style={ms.un}>{item.user}</Text>}
        <Text style={item.isMe ? ms.meT : ms.tx}>{item.content}</Text>
        <Text style={ms.tm}>{item.time}</Text>
      </View>
    </View>
  );
}

function SignalCard({ item }: { item: ChatMsg }) { const s = item.signal!; return (
  <View style={cs.card}>
    <View style={cs.head}><View style={cs.av}><Text style={cs.avT}>诸</Text></View><View style={{ flex: 1 }}><Text style={cs.un}>诸葛策略</Text><View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><View style={cs.live} /><Text style={cs.liveT}>实时信号</Text></View></View><Text style={cs.tm}>{item.time}</Text></View>
    <View style={cs.bd}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}><Text style={cs.sym}>{s.symbol}</Text><View style={cs.dir}><Text style={cs.dirT}>{s.direction} {s.confidence}</Text></View></View>
    <View style={cs.metrics}><M label="入场" v={s.entry} /><M label="止盈" v={s.tp} c="#34D399" /><M label="止损" v={s.sl} c="#FB923C" /><M label="RR" v={s.rr} c="#F7D56D" /></View></View>
    <TouchableOpacity style={cs.btn}><Copy size={15} color="#090012" /><Text style={cs.btnT}>一键跟单</Text></TouchableOpacity>
    <Text style={cs.disc}>跟单有风险，请设置个人最大亏损限额</Text>
  </View>
);}

function OnchainCard({ item }: { item: ChatMsg }) { const o = item.onchain!; return (
  <View style={[cs.card, { borderColor: "rgba(167,139,250,0.2)" }]}>
    <View style={cs.head}><View style={[cs.av, { backgroundColor: "rgba(167,139,250,0.15)" }]}><Text style={[cs.avT, { color: "#A78BFA" }]}>猎</Text></View><View style={{ flex: 1 }}><Text style={cs.un}>链上猎手</Text><Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{o.chain}</Text></View><Text style={cs.tm}>{item.time}</Text></View>
    <View style={cs.bd}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><View><Text style={{ fontSize: 18, fontWeight: "800", color: "#fff" }}>{o.token}</Text><Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{o.action}</Text></View><Text style={{ fontSize: 18, fontWeight: "800", color: "#A78BFA" }}>{o.amount}</Text></View></View>
    <TouchableOpacity style={[cs.btn, { backgroundColor: "#A78BFA" }]}><Zap size={15} color="#fff" /><Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>一键跟单</Text></TouchableOpacity>
  </View>
);}

function PositionCard({ item }: { item: ChatMsg }) { const p = item.position!; return (
  <View style={[ms.row, item.isMe && { justifyContent: "flex-end" }]}>
    {!item.isMe && <View style={ms.av}><Text style={ms.avT}>{item.user[0]}</Text></View>}
    <View style={psc.c}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}><Text style={psc.s}>{p.symbol}</Text><Text style={{ fontSize: 11, fontWeight: "700", color: p.side === "多" ? "#34D399" : "#FB923C" }}>{p.side} {p.size}</Text></View>
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.user}的持仓</Text><Text style={{ fontSize: 13, fontWeight: "700", color: p.pnl.startsWith("+") ? "#34D399" : "#FB923C" }}>{p.pnl} ({p.pnlPct})</Text></View></View>
  </View>
);}

function M({ label, v, c = "#fff" }: { label: string; v: string; c?: string }) { return <View style={{ alignItems: "center" }}><Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>{label}</Text><Text style={{ fontSize: 13, fontWeight: "700", color: c }}>{v}</Text></View>; }

// ═══ Styles ═══

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { alignItems: "center", paddingTop: 56, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  hTitle: { fontSize: 20, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },
  hRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  tabRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 3, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "rgba(192,99,255,0.2)" },
  tabText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.4)" },
  tabTextActive: { color: "#C063FF" },
  hDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  hSub: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 },
  list: { padding: 12, paddingBottom: 20 },
  bar: { flexDirection: "row", alignItems: "flex-end", padding: 6, paddingBottom: 28, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)", gap: 6, backgroundColor: "#0A0020" },
  emoji: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  inp: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, color: "#fff", fontSize: 15, maxHeight: 100 },
  send: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  sendOff: { backgroundColor: "rgba(255,255,255,0.06)" },
  sendOn: { backgroundColor: "#F7D56D" },
});

// Modal
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#150530", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  back: { fontSize: 14, color: "#F7D56D" },
  title: { fontSize: 17, fontWeight: "800", color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  item: { width: "30%", alignItems: "center", gap: 8, paddingVertical: 8 },
  icon: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  posRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.06)" },
  posSym: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

// Generic message
const ms = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 14 },
  av: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(192,99,255,0.2)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  avT: { fontSize: 12, fontWeight: "700", color: "#C063FF" },
  bb: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 10, maxWidth: "78%" },
  me: { backgroundColor: "#C063FF", borderRadius: 16, padding: 10, maxWidth: "78%" },
  un: { fontSize: 11, fontWeight: "700", color: "#C063FF", marginBottom: 2 },
  tx: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20 },
  meT: { fontSize: 14, color: "#fff", lineHeight: 20 },
  tm: { fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4, textAlign: "right" },
});

// Signal / onchain card
const cs = StyleSheet.create({
  card: { backgroundColor: "rgba(35,10,62,0.6)", borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)", padding: 16, marginBottom: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  av: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(192,132,252,0.15)", alignItems: "center", justifyContent: "center" },
  avT: { fontSize: 14, fontWeight: "800", color: "#C084FC" },
  un: { fontSize: 14, fontWeight: "700", color: "#fff" },
  live: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#34D399" },
  liveT: { fontSize: 10, color: "#34D399", fontWeight: "600" },
  tm: { fontSize: 10, color: "rgba(255,255,255,0.25)" },
  bd: { marginBottom: 12 },
  sym: { fontSize: 18, fontWeight: "800", color: "#fff" },
  dir: { backgroundColor: "rgba(52,211,153,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dirT: { fontSize: 12, fontWeight: "700", color: "#34D399" },
  metrics: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#F7D56D", borderRadius: 14, paddingVertical: 12 },
  btnT: { fontSize: 14, fontWeight: "700", color: "#090012" },
  disc: { fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8 },
});

// Position view tab
const ps = StyleSheet.create({
  posScroll: { flex: 1 },
  posContent: { padding: 16, paddingBottom: 40 },
  summaryCard: { backgroundColor: "rgba(35,10,62,0.6)", borderRadius: 18, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.15)", padding: 18, marginBottom: 20 },
  sumVal: { fontSize: 20, fontWeight: "900", color: "#fff" },
  sumLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 10 },
  card: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.1)", padding: 14, marginBottom: 10 },
  symbol: { fontSize: 15, fontWeight: "800", color: "#fff" },
  side: { fontSize: 11, fontWeight: "700", backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  lev: { fontSize: 10, fontWeight: "700", color: "#F7D56D", backgroundColor: "rgba(247,213,109,0.1)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pnl: { fontSize: 14, fontWeight: "700" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  detail: { alignItems: "center" },
  dLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 },
  dVal: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  usdVal: { fontSize: 15, fontWeight: "800", color: "#fff" },
  closeBtn: { marginTop: 10, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 12, borderWidth: 0.5, borderColor: "rgba(239,68,68,0.2)", paddingVertical: 9, alignItems: "center" },
  closeBtnText: { fontSize: 13, fontWeight: "700", color: "#EF4444" },
});

// Position message card
const psc = StyleSheet.create({
  c: { backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(192,99,255,0.15)", padding: 12, maxWidth: "78%" },
  s: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
