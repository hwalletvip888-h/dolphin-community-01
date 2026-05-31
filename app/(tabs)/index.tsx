import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Shield, Copy, X, Download, Search, User, MessageSquare, BookOpen, FileText, Gift, AlertCircle } from "lucide-react-native";
import { AGENTS } from "@/src/data/agents";
import { useAuth } from "@/src/stores/auth";
import { useMarket } from "@/src/stores/market";

const ADDRESSES = [
  { chain: "EVM (ERC20)", addr: "0x7F4e...b3D2", fullAddr: "0x7F4e8c9A1b2C3d4E5f6A7B8C9D0E1F2A3B4C5D6" },
  { chain: "Solana", addr: "DR5x...9KmP", fullAddr: "DR5xY8zW3vU2tS1rQ4pO7nM6lK9jI8hG5fD3sA2" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { total, level, refreshWallet, loggedIn } = useAuth();
  const { tickers, start: startWS } = useMarket();
  const [showDeposit, setShowDeposit] = useState(false);
  useEffect(() => { if (loggedIn) refreshWallet(); }, [loggedIn]);
  useEffect(() => { startWS(); }, []);

  const mkLabels: Record<string, string> = { "BTC-USDT-SWAP": "BTC", "ETH-USDT-SWAP": "ETH", "SOL-USDT-SWAP": "SOL" };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Top bar: profile + search */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.profileBtn} onPress={() => router.push("/settings")}>
          <User size={20} color="#fff" />
        </TouchableOpacity>
        <View style={s.searchBox}>
          <Search size={16} color="rgba(255,255,255,0.3)" />
          <Text style={s.searchPlaceholder}>搜索代币 / 策略 / 信号...</Text>
        </View>
        <TouchableOpacity style={s.msgBtn} onPress={() => router.push("/messages")}>
          <MessageSquare size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>

      {/* Real-time price ticker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tickerRow}>
        {["BTC-USDT-SWAP", "ETH-USDT-SWAP", "SOL-USDT-SWAP"].map((id) => {
          const t = tickers[id];
          const isUp = t && !t.changePct.startsWith("-");
          return (
            <View key={id} style={s.tickerItem}>
              <Text style={s.tickerSym}>{mkLabels[id]}</Text>
              <Text style={[s.tickerPrice, isUp ? s.tickerUp : s.tickerDown]}>
                {t ? `$${parseFloat(t.last).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
              </Text>
              {t && (
                <Text style={[s.tickerChg, isUp ? s.tickerUp : s.tickerDown]}>
                  {isUp ? "+" : ""}{t.changePct}%
                </Text>
              )}
            </View>
          );
        })}
        <Text style={s.tickerNote}>实时行情</Text>
      </ScrollView>

      {/* Wallet card */}
      <TouchableOpacity style={s.walletCard} onPress={() => router.push("/wallet")} activeOpacity={0.85}>
        <View style={s.walletRow}>
          <Text style={s.walletLabel}>总资产</Text>
          <View style={s.levelBadge}><Shield size={11} color="#34D399" /><Text style={s.levelText}>Lv.{level}</Text></View>
        </View>
        <Text style={s.walletTotal}>{total !== null ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}</Text>
        <TouchableOpacity style={s.depositBtn} onPress={() => setShowDeposit(true)} activeOpacity={0.7}>
          <Download size={14} color="#F7D56D" />
          <Text style={s.depositText}>充值</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Deposit Modal */}
      <Modal visible={showDeposit} transparent animationType="slide" onRequestClose={() => setShowDeposit(false)}>
        <View style={d.overlay}>
          <View style={d.sheet}>
            <View style={d.head}>
              <Text style={d.title}>充值</Text>
              <TouchableOpacity onPress={() => setShowDeposit(false)}><X size={20} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
            </View>
            <Text style={d.hint}>向以下地址转账即可到账</Text>
            {ADDRESSES.map((a, i) => (
              <View key={i} style={d.addrCard}>
                <Text style={d.addrChain}>{a.chain}</Text>
                <View style={d.addrRow}>
                  <Text style={d.addrText} selectable>{a.fullAddr}</Text>
                  <TouchableOpacity style={d.copyBtn}>
                    <Copy size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={d.warn}>⚠️ 请确认网络正确，充值错误无法找回</Text>
          </View>
        </View>
      </Modal>

      {/* Agent quick access */}
      <Text style={s.sectionTitle}>AI Agent</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.agentRow}>
        {AGENTS.map((a) => {
          const ok = level >= a.unlockLevel;
          return (
            <TouchableOpacity key={a.id} style={[s.agentCard, { borderColor: ok ? a.color + "30" : "rgba(255,255,255,0.06)" }]} onPress={() => ok && router.push(`/chat/${a.id}?msg=${encodeURIComponent("你好")}`)} activeOpacity={ok ? 0.7 : 1}>
              <View style={[s.agentAv, { borderColor: ok ? a.color : "rgba(255,255,255,0.15)" }, !ok && { opacity: 0.4 }]}>
                <Text style={[s.agentAvT, { color: ok ? a.color : "rgba(255,255,255,0.3)" }]}>{a.name[0]}</Text>
              </View>
              <Text style={[s.agentName, !ok && { color: "rgba(255,255,255,0.3)" }]}>{a.name}</Text>
              <Text style={s.agentTitle}>{a.title}</Text>
              {!ok && <Text style={s.lockLabel}>Lv.{a.unlockLevel}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 链上赚币 — horizontal cards */}
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>链上赚币</Text>
        <TouchableOpacity onPress={() => router.push("/chat/onchain")}>
          <Text style={s.moreLink}>更多 →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>
        {[
          { token: "PEPE", chain: "ETH", pnl: "+82%", price: "$0.00215", signal: "🐋 鲸鱼买入", msg: "帮我分析 PEPE 这个鲸鱼买入信号", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
          { token: "WIF", chain: "SOL", pnl: "+22%", price: "$2.98", signal: "🧠 聪明钱建仓", msg: "WIF 聪明钱建仓了，帮我看看能不能跟", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" },
          { token: "DEGEN", chain: "BASE", pnl: "-27%", price: "$0.038", signal: "📊 大额转账", msg: "DEGEN 有大额转账，帮我分析一下", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" },
          { token: "BONK", chain: "SOL", pnl: "+15%", price: "$0.00003", signal: "🆕 新钱包创建", msg: "BONK 有新钱包创建，帮我看看什么情况", bg: "rgba(192,99,255,0.08)", border: "rgba(192,99,255,0.2)" },
        ].map((c, i) => (
          <TouchableOpacity key={i} style={[s.earnCard, { backgroundColor: c.bg, borderColor: c.border }]} onPress={() => router.push(`/chat/onchain?msg=${encodeURIComponent(c.msg)}`)} activeOpacity={0.8}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={s.earnToken}>{c.token}</Text>
              <Text style={s.earnChain}>{c.chain}</Text>
            </View>
            <Text style={[s.earnPnl, { color: c.pnl.startsWith("+") ? "#34D399" : "#FB923C" }]}>{c.pnl}</Text>
            <Text style={s.earnPrice}>{c.price}</Text>
            <Text style={s.earnSignal}>{c.signal}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 合约信号 — horizontal cards */}
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>合约信号</Text>
        <TouchableOpacity onPress={() => router.push("/chat/zhuge")}>
          <Text style={s.moreLink}>更多 →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>
        {[
          { pair: "BTC/USDT", dir: "多", lev: "10x", entry: "87,200", tp: "89,500", sl: "85,800", rr: "2.4", pnl: "+2.9%", msg: "帮我跟单 BTC 做多 入场87200 目标89500 止损85800", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.15)" },
          { pair: "ETH/USDT", dir: "空", lev: "5x", entry: "4,150", tp: "3,900", sl: "4,300", rr: "1.8", pnl: "+3.6%", msg: "帮我跟单 ETH 做空 入场4150 目标3900 止损4300", bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.15)" },
          { pair: "SOL/USDT", dir: "多", lev: "3x", entry: "178.5", tp: "195", sl: "172", rr: "2.1", pnl: "+10.1%", msg: "帮我跟单 SOL 做多 入场178.5 目标195 止损172", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.15)" },
        ].map((c, i) => (
          <TouchableOpacity key={i} style={[s.sigCard, { backgroundColor: c.bg, borderColor: c.border }]} onPress={() => router.push(`/chat/zhuge?msg=${encodeURIComponent(c.msg)}`)} activeOpacity={0.8}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={s.sigPair}>{c.pair}</Text>
              <Text style={[s.sigDir, { color: c.dir === "多" ? "#34D399" : "#FB923C" }]}>{c.dir} {c.lev}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 4 }}>
              <View><Text style={s.sigLabel}>入场</Text><Text style={s.sigVal}>{c.entry}</Text></View>
              <View><Text style={s.sigLabel}>止盈</Text><Text style={[s.sigVal, { color: "#34D399" }]}>{c.tp}</Text></View>
              <View><Text style={s.sigLabel}>止损</Text><Text style={[s.sigVal, { color: "#FB923C" }]}>{c.sl}</Text></View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[s.earnPnl, { color: c.pnl.startsWith("+") ? "#34D399" : "#FB923C" }]}>{c.pnl}</Text>
              <Text style={s.sigRR}>RR {c.rr}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick links */}
      <View style={s.quickRow}>
        {[
          { icon: BookOpen, label: "新人指南", color: "#38BDF8", route: "/chat/dolphin", msg: "我是新人，介绍一下平台功能" },
          { icon: FileText, label: "平台规则", color: "#A78BFA", route: "/chat/dolphin", msg: "平台的交易规则是什么" },
          { icon: Gift, label: "邀请好友", color: "#FBBF24", route: "/chat/reward", msg: "邀请好友有什么奖励" },
          { icon: AlertCircle, label: "投诉建议", color: "#FB923C", route: "/chat/dolphin", msg: "我有一些建议想反馈" },
        ].map((q) => (
          <TouchableOpacity key={q.label} style={s.quickItem} onPress={() => router.push(`${q.route}?msg=${encodeURIComponent(q.msg)}`)} activeOpacity={0.7}>
            <View style={[s.quickIcon, { backgroundColor: q.color + "15" }]}>
              <q.icon size={20} color={q.color} />
            </View>
            <Text style={s.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 30 },
  // Top bar
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  profileBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.06)" },
  searchPlaceholder: { fontSize: 13, color: "rgba(255,255,255,0.25)" },
  msgBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  // Ticker
  tickerRow: { flexDirection: "row", gap: 16, marginBottom: 12, paddingVertical: 4 },
  tickerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  tickerSym: { fontSize: 13, fontWeight: "700", color: "#fff" },
  tickerPrice: { fontSize: 13, fontWeight: "700", fontFamily: "Courier" },
  tickerChg: { fontSize: 11, fontWeight: "600" },
  tickerUp: { color: "#34D399" },
  tickerDown: { color: "#FB923C" },
  tickerNote: { fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: 4 },
  // Wallet
  walletCard: { backgroundColor: "rgba(35,10,62,0.7)", borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)", padding: 20, marginBottom: 24 },
  walletRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  walletLabel: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(52,211,153,0.1)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  levelText: { fontSize: 11, fontWeight: "700", color: "#34D399" },
  walletTotal: { fontSize: 30, fontWeight: "900", color: "#fff", marginBottom: 10 },
  depositBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(247,213,109,0.1)", borderRadius: 12, paddingVertical: 8 },
  depositText: { fontSize: 13, fontWeight: "700", color: "#F7D56D" },
  // Section
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 12, marginTop: 4 },
  // Agents
  agentRow: { gap: 10 },
  agentCard: { width: 90, alignItems: "center", gap: 4, backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16, borderWidth: 0.5, paddingVertical: 14, paddingHorizontal: 8 },
  agentAv: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  agentAvT: { fontSize: 17, fontWeight: "800" },
  agentName: { fontSize: 12, fontWeight: "700", color: "#fff" },
  agentTitle: { fontSize: 10, color: "rgba(255,255,255,0.35)" },
  lockLabel: { fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2 },
  // Section header
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 12 },
  moreLink: { fontSize: 12, color: "rgba(255,255,255,0.3)" },
  // Card rows
  cardRow: { gap: 10, paddingBottom: 8 },
  // 链上赚币 cards
  earnCard: { width: 150, borderRadius: 16, borderWidth: 0.5, padding: 14 },
  earnToken: { fontSize: 16, fontWeight: "800", color: "#fff" },
  earnChain: { fontSize: 10, color: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  earnPnl: { fontSize: 15, fontWeight: "800" },
  earnPrice: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 },
  earnSignal: { fontSize: 10, color: "rgba(255,255,255,0.35)" },
  // 合约信号 cards
  sigCard: { width: 180, borderRadius: 16, borderWidth: 0.5, padding: 14 },
  sigPair: { fontSize: 14, fontWeight: "800", color: "#fff" },
  sigDir: { fontSize: 12, fontWeight: "700" },
  sigLabel: { fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 1 },
  sigVal: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.8)" },
  sigRR: { fontSize: 11, fontWeight: "700", color: "#F7D56D" },
  // Quick links
  quickRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 8 },
  quickItem: { flex: 1, alignItems: "center", gap: 6, backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 14, paddingVertical: 14 },
  quickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.55)" },
});

// Deposit modal
const d = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#150530", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "800", color: "#fff" },
  hint: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 },
  addrCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 14, marginBottom: 10 },
  addrChain: { fontSize: 11, fontWeight: "700", color: "#F7D56D", marginBottom: 6 },
  addrRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addrText: { flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Courier" },
  copyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  warn: { fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 10 },
});
