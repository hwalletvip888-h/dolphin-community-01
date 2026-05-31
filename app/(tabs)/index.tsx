import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Shield, Copy, X, Download, Search, User, MessageSquare, BookOpen, FileText, Gift, AlertCircle } from "lucide-react-native";
import { AGENTS } from "@/src/data/agents";
import { useAuth } from "@/src/stores/auth";
import { useMarket } from "@/src/stores/market";
import { Sparkline } from "@/src/ui/Sparkline";

const ADDRESSES = [
  { chain: "EVM (ERC20)", addr: "0x7F4e...b3D2", fullAddr: "0x7F4e8c9A1b2C3d4E5f6A7B8C9D0E1F2A3B4C5D6" },
  { chain: "Solana", addr: "DR5x...9KmP", fullAddr: "DR5xY8zW3vU2tS1rQ4pO7nM6lK9jI8hG5fD3sA2" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { total, level, refreshWallet, loggedIn } = useAuth();
  const { tickers, candles, start: startWS, loadCandles } = useMarket();
  const [showDeposit, setShowDeposit] = useState(false);
  const [signals, setSignals] = useState<any[]>([]);
  useEffect(() => { if (loggedIn) refreshWallet(); }, [loggedIn]);
  useEffect(() => { startWS(); loadCandles(); fetchSignals(); }, []);
  const fetchSignals = async () => {
    try { const d = await (await fetch("https://api.hvip.ink/api/signals", { signal: AbortSignal.timeout(8000) })).json(); setSignals(d.signals || []); } catch {}
  };

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

      {/* 链上信号 — OKX Market API 真实数据 */}
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>链上信号</Text>
        <TouchableOpacity onPress={() => router.push("/signals")}><Text style={s.moreLink}>更多 →</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>
        {(signals.length > 0 ? signals : [{ symbol: "—", name: "", price: "—", securityScore: 0, volume1h: "0", marketCap: "0" }]).slice(0, 8).map((c, i) => {
          const score = c.securityScore || 0;
          const scoreColor = score >= 80 ? "#34D399" : score >= 50 ? "#F7D56D" : "#FB923C";
          const price = parseFloat(c.price);
          const priceStr = isNaN(price) ? "—" : price < 0.01 ? `$${price.toFixed(6)}` : `$${price.toFixed(2)}`;
          return (
          <TouchableOpacity key={i} style={s.pickCard} onPress={() => router.push(`/chat/onchain?msg=${encodeURIComponent("帮我分析链上信号: " + c.symbol)}`)} activeOpacity={0.85}>
            <View style={s.pickBadge}><Text style={s.pickBadgeT}>{c.symbol?.[0] || "?"}</Text></View>
            <Text style={s.pickSym}>{c.symbol}</Text>
            <Text style={s.pickPrice}>{priceStr}</Text>
            <View style={[s.scoreBadge, { backgroundColor: scoreColor + "18" }]}>
              <Text style={[s.scoreText, { color: scoreColor }]}>{Math.round(score)}分</Text>
            </View>
            <View style={s.pickReason}><Text style={s.pickReasonT}>安全评分</Text></View>
          </TouchableOpacity>
        );
        })}
      </ScrollView>

      {/* 行情速览 — 实时价格 + K线, 不做方向判断 */}
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>行情速览</Text>
        <TouchableOpacity onPress={() => router.push("/chat/zhuge")}>
          <Text style={s.moreLink}>交易 →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>
        {[
          { coin: "₿", name: "BTC", pair: "BTC/USDT", instId: "BTC-USDT-SWAP", color: "#F7931A" },
          { coin: "Ξ", name: "ETH", pair: "ETH/USDT", instId: "ETH-USDT-SWAP", color: "#627EEA" },
          { coin: "S", name: "SOL", pair: "SOL/USDT", instId: "SOL-USDT-SWAP", color: "#9945FF" },
        ].map((c, i) => {
          const t = tickers[c.instId];
          const chg = t ? parseFloat(t.changePct) : 0;
          const isUp = chg >= 0;
          return (
          <TouchableOpacity key={i} style={s.sigCard} onPress={() => router.push(`/chat/zhuge?msg=${encodeURIComponent("帮我分析 " + c.pair + " 的走势")}`)} activeOpacity={0.85}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <View style={[s.coinBadge, { backgroundColor: c.color + "18" }]}>
                <Text style={[s.coinBadgeT, { color: c.color }]}>{c.coin}</Text>
              </View>
              <View>
                <Text style={s.coinName}>{c.name}</Text>
                <Text style={s.coinPair}>{c.pair}</Text>
              </View>
              {t && <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[s.heroChg, { color: isUp ? "#34D399" : "#FB923C" }]}>{isUp ? "+" : ""}{t.changePct}%</Text>
              </View>}
            </View>

            <Text style={[s.heroPrice, { color: isUp ? "#34D399" : "#FB923C" }]}>
              {t ? `$${parseFloat(t.last).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
            </Text>
            <Sparkline data={candles[c.instId] || []} width={180} height={36} color="#34D399" negativeColor="#FB923C" />

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 10 }}>
              <View style={{ alignItems: "center" }}><Text style={s.mLabel}>24h高</Text><Text style={s.mVal}>{t ? `$${parseFloat(t.high24h).toLocaleString()}` : "—"}</Text></View>
              <View style={{ alignItems: "center" }}><Text style={s.mLabel}>24h低</Text><Text style={s.mVal}>{t ? `$${parseFloat(t.low24h).toLocaleString()}` : "—"}</Text></View>
              <View style={{ alignItems: "center" }}><Text style={s.mLabel}>成交量</Text><Text style={s.mVal}>{t ? `$${(parseFloat(t.vol24h)/1e6).toFixed(0)}M` : "—"}</Text></View>
            </View>
          </TouchableOpacity>
        );
        })}
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
  // 精选信号 cards
  pickCard: { width: 130, backgroundColor: "rgba(35,10,62,0.55)", borderRadius: 18, borderWidth: 0.5, borderColor: "rgba(167,139,250,0.15)", padding: 16, alignItems: "center", gap: 6 },
  pickBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(167,139,250,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 2 },
  pickBadgeT: { fontSize: 16, fontWeight: "900", color: "#A78BFA" },
  pickSym: { fontSize: 14, fontWeight: "800", color: "#fff" },
  pickPrice: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  pickChg: { fontSize: 15, fontWeight: "800" },
  pickReason: { backgroundColor: "rgba(167,139,250,0.08)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pickReasonT: { fontSize: 10, color: "#A78BFA", fontWeight: "600" },
  scoreBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  scoreText: { fontSize: 11, fontWeight: "700" },
  // 合约信号 cards
  sigCard: { width: 240, backgroundColor: "rgba(35,10,62,0.6)", borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.15)", padding: 18 },
  coinBadge: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  coinBadgeT: { fontSize: 18, fontWeight: "900" },
  coinName: { fontSize: 15, fontWeight: "800", color: "#fff" },
  coinPair: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
  dirPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dirPillT: { fontSize: 11, fontWeight: "700" },
  heroPrice: { fontSize: 24, fontWeight: "900" },
  heroChg: { fontSize: 13, fontWeight: "700" },
  heroLabel: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  mLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 },
  mVal: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.85)" },
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
