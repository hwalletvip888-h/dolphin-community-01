import { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Wallet, TrendingUp, Clock, Shield, LogOut } from "lucide-react-native";
import { useAuth } from "@/src/stores/auth";

const TXS = [
  { type: "充值", symbol: "USDT", amount: "+500.00", time: "05-30 14:22", color: "#34D399" },
  { type: "兑换", symbol: "ETH", amount: "+0.15", time: "05-29 09:15", color: "#F7D56D" },
  { type: "转出", symbol: "USDT", amount: "-100.00", time: "05-28 16:40", color: "#FB923C" },
];

export default function AssetScreen() {
  const router = useRouter();
  const { total, tokens, level, refreshWallet, logout } = useAuth();
  useEffect(() => { refreshWallet(); }, []);

  return (
    <ScrollView style={ss.root} contentContainerStyle={ss.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={ss.header}><Text style={ss.headerTitle}>资产</Text></View>

      {/* Balance card */}
      <View style={ss.balanceCard}>
        <Text style={ss.balanceLabel}>总资产 (USD)</Text>
        <Text style={ss.balanceValue}>{total !== null ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}</Text>
        <View style={ss.pnlRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><TrendingUp size={13} color="#34D399" /><Text style={ss.pnlGreen}>+$12.40 今日</Text></View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><TrendingUp size={13} color="#34D399" /><Text style={ss.pnlGreen}>+$3,280 累计</Text></View>
        </View>
      </View>

      {/* Token list */}
      <Text style={ss.sectionTitle}>持仓</Text>
      <View style={ss.tokenCard}>
        {tokens.length > 0 ? tokens.map((t, i) => (
          <View key={i} style={[ss.tokenRow, i < tokens.length - 1 && { borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 10, marginBottom: 10 }]}>
            <View style={ss.tokenIcon}><Text style={ss.tokenIconT}>{t.symbol[0]}</Text></View>
            <View style={{ flex: 1 }}><Text style={ss.tokenName}>{t.symbol}</Text><Text style={ss.tokenChain}>{t.chain}</Text></View>
            <View style={{ alignItems: "flex-end" }}><Text style={ss.tokenAmt}>{t.amount}</Text><Text style={ss.tokenUsd}>{t.usd}</Text></View>
          </View>
        )) : <Text style={ss.emptyText}>暂无持仓</Text>}
      </View>

      {/* Transactions */}
      <Text style={ss.sectionTitle}>最近交易</Text>
      <View style={ss.tokenCard}>
        {TXS.map((tx, i) => (
          <View key={i} style={[ss.txRow, i < TXS.length - 1 && { borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 8, marginBottom: 8 }]}>
            <View style={[ss.txBadge, { backgroundColor: tx.color + "15" }]}><Text style={[ss.txBadgeT, { color: tx.color }]}>{tx.type}</Text></View>
            <View style={{ flex: 1 }}><Text style={ss.txSym}>{tx.symbol}</Text><Text style={ss.txTime}>{tx.time}</Text></View>
            <Text style={[ss.txAmt, { color: tx.amount.startsWith("+") ? "#34D399" : "#FB923C" }]}>{tx.amount}</Text>
          </View>
        ))}
      </View>

      {/* Info */}
      <View style={ss.infoCard}>
        <Shield size={14} color="rgba(52,211,153,0.5)" />
        <Text style={ss.infoText}>OKX TEE 安全签名 · Lv.{level}</Text>
      </View>
      <TouchableOpacity style={ss.logout} onPress={() => { logout(); router.replace("/login"); }}>
        <LogOut size={16} color="#FB923C" /><Text style={ss.logoutText}>退出登录</Text>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 30 },
  header: { marginBottom: 18 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },
  balanceCard: { backgroundColor: "rgba(35,10,62,0.7)", borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)", padding: 20, marginBottom: 22 },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 4 },
  balanceValue: { fontSize: 30, fontWeight: "900", color: "#fff", marginBottom: 10 },
  pnlRow: { flexDirection: "row", gap: 24 },
  pnlGreen: { fontSize: 12, fontWeight: "600", color: "#34D399" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 10 },
  tokenCard: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.06)", padding: 14, marginBottom: 20 },
  tokenRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tokenIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  tokenIconT: { fontSize: 13, fontWeight: "700", color: "#fff" },
  tokenName: { fontSize: 13, fontWeight: "700", color: "#fff" },
  tokenChain: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 },
  tokenAmt: { fontSize: 13, fontWeight: "600", color: "#fff" },
  tokenUsd: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 },
  emptyText: { fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", paddingVertical: 16 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  txBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  txBadgeT: { fontSize: 10, fontWeight: "700" },
  txSym: { fontSize: 12, fontWeight: "600", color: "#fff" },
  txTime: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 },
  txAmt: { fontSize: 13, fontWeight: "700" },
  infoCard: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10 },
  infoText: { fontSize: 11, color: "rgba(255,255,255,0.25)" },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 16, backgroundColor: "rgba(251,146,60,0.06)", marginTop: 8 },
  logoutText: { fontSize: 13, fontWeight: "600", color: "#FB923C" },
});
