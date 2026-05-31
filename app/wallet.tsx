import { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Copy, ArrowDown, ArrowUp, RefreshCw, TrendingUp, Shield } from "lucide-react-native";
import { useAuth } from "@/src/stores/auth";

export default function WalletScreen() {
  const router = useRouter();
  const { total, tokens, level, refreshWallet } = useAuth();

  useEffect(() => { refreshWallet(); }, []);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>AI 钱包</Text>
        <TouchableOpacity onPress={refreshWallet} style={s.refreshBtn}>
          <RefreshCw size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Total balance */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>总资产 (USD)</Text>
          <Text style={s.totalValue}>
            {total !== null ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
          </Text>
          {/* Mini sparkline placeholder */}
          <View style={s.sparkline}>
            {[2, 5, 3, 8, 4, 6, 9, 7, 10, 8, 11, 9, 12, 10, 13, 11, 14, 12, 15, 13].map((v, i) => (
              <View
                key={i}
                style={[s.sparkBar, { height: v * 3, backgroundColor: v > 7 ? "#34D399" : "#FB923C" + "80" }]}
              />
            ))}
          </View>
          <View style={s.pnlRow}>
            <View style={s.pnlItem}>
              <ArrowUp size={12} color="#34D399" />
              <Text style={[s.pnlValue, { color: "#34D399" }]}>+$12.40</Text>
              <Text style={s.pnlLabel}>今日收益</Text>
            </View>
            <View style={s.pnlItem}>
              <TrendingUp size={12} color="#34D399" />
              <Text style={[s.pnlValue, { color: "#34D399" }]}>+3.2%</Text>
              <Text style={s.pnlLabel}>总收益率</Text>
            </View>
          </View>
        </View>

        {/* Token list */}
        <Text style={s.sectionTitle}>资产列表</Text>
        <View style={s.tokenList}>
          {tokens.length > 0 ? (
            tokens.map((t, i) => (
              <View key={i} style={[s.tokenRow, i < tokens.length - 1 && { borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 12, marginBottom: 12 }]}>
                <View style={s.tokenIcon}>
                  <Text style={s.tokenIconText}>{t.symbol[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tokenSymbol}>{t.symbol}</Text>
                  <Text style={s.tokenChain}>{t.chain}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.tokenAmount}>{t.amount}</Text>
                  <Text style={s.tokenUsd}>{t.usd}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={s.emptyText}>暂无链上资产</Text>
          )}
        </View>

        {/* Wallet info & security */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Shield size={14} color="#34D399" />
            <Text style={s.infoText}>基于 OKX TEE 安全签名</Text>
          </View>
          <View style={s.infoRow}>
            <Shield size={14} color="#34D399" />
            <Text style={s.infoText}>私钥永不离开设备</Text>
          </View>
          <View style={s.infoRow}>
            <Shield size={14} color="#34D399" />
            <Text style={s.infoText}>平台无法动用你的资产</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingBottom: 12, paddingHorizontal: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center" },
  refreshBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { padding: 18 },

  totalCard: {
    backgroundColor: "rgba(35,10,62,0.7)", borderRadius: 24,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)",
    padding: 22, marginBottom: 24, alignItems: "center",
  },
  totalLabel: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 6 },
  totalValue: { fontSize: 36, fontWeight: "900", color: "#fff", marginBottom: 16 },
  sparkline: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 45, marginBottom: 14 },
  sparkBar: { width: 6, borderRadius: 3 },
  pnlRow: { flexDirection: "row", gap: 40 },
  pnlItem: { alignItems: "center", gap: 3 },
  pnlValue: { fontSize: 15, fontWeight: "700" },
  pnlLabel: { fontSize: 11, color: "rgba(255,255,255,0.35)" },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 12 },
  tokenList: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.1)", padding: 16, marginBottom: 24 },
  tokenRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  tokenIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  tokenIconText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  tokenSymbol: { fontSize: 14, fontWeight: "700", color: "#fff" },
  tokenChain: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  tokenAmount: { fontSize: 14, fontWeight: "600", color: "#fff" },
  tokenUsd: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  emptyText: { fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", paddingVertical: 20 },

  infoCard: { backgroundColor: "rgba(52,211,153,0.06)", borderRadius: 16, borderWidth: 0.5, borderColor: "rgba(52,211,153,0.12)", padding: 16, gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
});
