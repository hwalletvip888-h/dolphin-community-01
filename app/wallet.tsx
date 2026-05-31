import { useEffect, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft, RefreshCw, TrendingUp, TrendingDown,
  ArrowUp, ArrowDown, Calendar, Clock, Shield,
} from "lucide-react-native";
import { useAuth } from "@/src/stores/auth";

const { width: W } = Dimensions.get("window");

// ── Mock K-line data (20 points) ──
const KLINE = [82, 85, 83, 88, 86, 91, 89, 94, 92, 97, 95, 100, 98, 103, 101, 106, 104, 109, 107, 112];

// ── Mock calendar (30 days) ──
function generateCalendar(): { day: number; pnl: number }[] {
  const days: { day: number; pnl: number }[] = [];
  for (let i = 1; i <= 30; i++) {
    const pnl = ((Math.random() - 0.45) * 20).toFixed(1);
    days.push({ day: i, pnl: parseFloat(pnl) });
  }
  return days;
}

// ── Mock transactions ──
const TXS = [
  { type: "deposit", symbol: "USDT", amount: "+500.00", time: "05-30 14:22", status: "confirmed" },
  { type: "swap", symbol: "ETH", amount: "+0.15", time: "05-29 09:15", status: "confirmed" },
  { type: "send", symbol: "USDT", amount: "-100.00", time: "05-28 16:40", status: "confirmed" },
  { type: "deposit", symbol: "BTC", amount: "+0.002", time: "05-27 11:05", status: "pending" },
  { type: "swap", symbol: "SOL", amount: "+5.5", time: "05-26 08:30", status: "confirmed" },
];

const TX_LABELS: Record<string, { label: string; color: string }> = {
  deposit: { label: "充值", color: "#34D399" },
  swap: { label: "兑换", color: "#F7D56D" },
  send: { label: "转出", color: "#FB923C" },
};

export default function WalletScreen() {
  const router = useRouter();
  const { total, tokens, refreshWallet } = useAuth();
  const calendar = useMemo(() => generateCalendar(), []);

  useEffect(() => { refreshWallet(); }, []);

  const maxK = Math.max(...KLINE);
  const minK = Math.min(...KLINE);
  const range = maxK - minK || 1;

  const totalPnL = calendar.reduce((s, d) => s + d.pnl, 0);
  const winDays = calendar.filter((d) => d.pnl > 0).length;
  const loseDays = calendar.filter((d) => d.pnl < 0).length;

  return (
    <View style={ss.root}>
      {/* Header */}
      <View style={ss.header}>
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={ss.headerTitle}>AI 钱包</Text>
        <TouchableOpacity onPress={refreshWallet} style={ss.refreshBtn}>
          <RefreshCw size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      <ScrollView style={ss.scroll} contentContainerStyle={ss.content} showsVerticalScrollIndicator={false}>
        {/* ── Balance card ── */}
        <View style={ss.balanceCard}>
          <Text style={ss.balanceLabel}>总资产 (USD)</Text>
          <Text style={ss.balanceValue}>
            {total !== null ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
          </Text>

          {/* K-line chart */}
          <View style={ss.chart}>
            <View style={ss.chartY}>
              <Text style={ss.chartYText}>${maxK}</Text>
              <Text style={ss.chartYText}>${Math.round((maxK + minK) / 2)}</Text>
              <Text style={ss.chartYText}>${minK}</Text>
            </View>
            <View style={ss.chartArea}>
              {KLINE.map((v, i) => {
                const h = ((v - minK) / range) * 100;
                const nextV = KLINE[i + 1];
                const isUp = nextV ? nextV >= v : true;
                return (
                  <View key={i} style={ss.chartCol}>
                    <View style={[ss.chartWick, { height: 4, backgroundColor: isUp ? "#34D399" : "#FB923C" }]} />
                    <View style={[ss.chartBar, { height: `${h}%`, backgroundColor: isUp ? "#34D399" : "#FB923C" + "90" }]} />
                  </View>
                );
              })}
            </View>
          </View>

          {/* PnL summary */}
          <View style={ss.pnlRow}>
            <View style={ss.pnlItem}>
              <Text style={[ss.pnlVal, { color: totalPnL >= 0 ? "#34D399" : "#FB923C" }]}>
                {totalPnL >= 0 ? "+" : ""}{totalPnL.toFixed(1)} USDT
              </Text>
              <Text style={ss.pnlLabel}>本月收益</Text>
            </View>
            <View style={ss.pnlDivider} />
            <View style={ss.pnlItem}>
              <Text style={[ss.pnlVal, { color: "#34D399" }]}>{winDays}天</Text>
              <Text style={ss.pnlLabel}>盈利</Text>
            </View>
            <View style={ss.pnlDivider} />
            <View style={ss.pnlItem}>
              <Text style={[ss.pnlVal, { color: "#FB923C" }]}>{loseDays}天</Text>
              <Text style={ss.pnlLabel}>亏损</Text>
            </View>
          </View>
        </View>

        {/* ── PnL Calendar ── */}
        <View style={ss.sectionHead}>
          <Calendar size={14} color="rgba(255,255,255,0.5)" />
          <Text style={ss.sectionTitle}>收益日历</Text>
        </View>
        <View style={ss.calendar}>
          {/* Weekday headers */}
          <View style={ss.calHeader}>
            {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
              <Text key={d} style={ss.calHeaderText}>{d}</Text>
            ))}
          </View>
          {/* Days grid */}
          <View style={ss.calGrid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={ss.calCell} />
            ))}
            {calendar.map((d, i) => {
              const intensity = Math.min(Math.abs(d.pnl) / 15, 1);
              const isProfit = d.pnl >= 0;
              return (
                <View key={i} style={ss.calCell}>
                  <View
                    style={[
                      ss.calDay,
                      {
                        backgroundColor: isProfit
                          ? `rgba(52,211,153,${0.08 + intensity * 0.25})`
                          : `rgba(251,146,60,${0.08 + intensity * 0.25})`,
                        borderColor: isProfit
                          ? `rgba(52,211,153,${0.2 + intensity * 0.3})`
                          : `rgba(251,146,60,${0.2 + intensity * 0.3})`,
                      },
                    ]}
                  >
                    <Text style={[ss.calDayText, { color: isProfit ? "#34D399" : "#FB923C" }]}>{d.day}</Text>
                    <Text style={[ss.calPnlText, { color: isProfit ? "rgba(52,211,153,0.6)" : "rgba(251,146,60,0.6)" }]}>
                      {d.pnl >= 0 ? "+" : ""}{d.pnl}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Token breakdown ── */}
        <View style={ss.sectionHead}>
          <TrendingUp size={14} color="rgba(255,255,255,0.5)" />
          <Text style={ss.sectionTitle}>资产分布</Text>
        </View>
        <View style={ss.tokenList}>
          {tokens.length > 0 ? (
            tokens.map((t, i) => (
              <View key={i} style={[ss.tokenRow, i < tokens.length - 1 && ss.tokenBorder]}>
                <View style={ss.tokenIcon}>
                  <Text style={ss.tokenIconText}>{t.symbol[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ss.tokenName}>{t.symbol}</Text>
                  <Text style={ss.tokenChain}>{t.chain}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={ss.tokenAmt}>{t.amount}</Text>
                  <Text style={ss.tokenUsd}>{t.usd}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={ss.empty}>暂无链上资产</Text>
          )}
        </View>

        {/* ── Recent transactions ── */}
        <View style={ss.sectionHead}>
          <Clock size={14} color="rgba(255,255,255,0.5)" />
          <Text style={ss.sectionTitle}>最近交易</Text>
        </View>
        <View style={ss.txList}>
          {TXS.map((tx, i) => {
            const meta = TX_LABELS[tx.type];
            return (
              <View key={i} style={[ss.txRow, i < TXS.length - 1 && ss.tokenBorder]}>
                <View style={[ss.txBadge, { backgroundColor: meta.color + "15" }]}>
                  <Text style={[ss.txBadgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ss.txSymbol}>{tx.symbol}</Text>
                  <Text style={ss.txTime}>{tx.time}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[ss.txAmount, { color: tx.amount.startsWith("+") ? "#34D399" : "#FB923C" }]}>
                    {tx.amount}
                  </Text>
                  <Text style={[ss.txStatus, { color: tx.status === "confirmed" ? "rgba(255,255,255,0.35)" : "#F7D56D" }]}>
                    {tx.status === "confirmed" ? "已完成" : "确认中"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Security ── */}
        <View style={ss.security}>
          <Shield size={14} color="rgba(52,211,153,0.5)" />
          <Text style={ss.securityText}>基于 OKX TEE 安全签名 · 私钥永不离开设备 · 平台无法动用你的资产</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingBottom: 12, paddingHorizontal: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center" },
  refreshBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { padding: 16 },

  // ── Balance ──
  balanceCard: {
    backgroundColor: "rgba(35,10,62,0.7)", borderRadius: 24,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.2)",
    padding: 20, marginBottom: 24,
  },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: "900", color: "#fff", marginBottom: 16 },

  // K-line chart
  chart: { flexDirection: "row", height: 140, marginBottom: 14 },
  chartY: { width: 40, justifyContent: "space-between", paddingVertical: 4 },
  chartYText: { fontSize: 9, color: "rgba(255,255,255,0.25)", textAlign: "right" },
  chartArea: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 2, paddingLeft: 8 },
  chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  chartWick: { width: 1.5, borderRadius: 1, marginBottom: 1 },
  chartBar: { width: "80%", borderRadius: 2, minHeight: 2 },

  // PnL
  pnlRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  pnlItem: { alignItems: "center" },
  pnlVal: { fontSize: 15, fontWeight: "700" },
  pnlLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  pnlDivider: { width: 0.5, height: 30, backgroundColor: "rgba(255,255,255,0.08)" },

  // ── Section ──
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.7)" },

  // ── Calendar ──
  calendar: {
    backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.1)",
    padding: 14, marginBottom: 24,
  },
  calHeader: { flexDirection: "row", marginBottom: 8 },
  calHeaderText: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.25)" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: `${100 / 7}%` as unknown as number, padding: 2 },
  calDay: { borderRadius: 10, padding: 6, borderWidth: 0.5, alignItems: "center" },
  calDayText: { fontSize: 11, fontWeight: "700" },
  calPnlText: { fontSize: 8, fontWeight: "600", marginTop: 1 },

  // ── Tokens ──
  tokenList: {
    backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.1)",
    padding: 14, marginBottom: 24,
  },
  tokenRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 },
  tokenBorder: { borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 10, marginBottom: 10 },
  tokenIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  tokenIconText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  tokenName: { fontSize: 13, fontWeight: "700", color: "#fff" },
  tokenChain: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 },
  tokenAmt: { fontSize: 13, fontWeight: "600", color: "#fff" },
  tokenUsd: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 },
  empty: { fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", paddingVertical: 16 },

  // ── Transactions ──
  txList: {
    backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 18,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.1)",
    padding: 14, marginBottom: 24,
  },
  txRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 },
  txBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  txBadgeText: { fontSize: 10, fontWeight: "700" },
  txSymbol: { fontSize: 13, fontWeight: "600", color: "#fff" },
  txTime: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 },
  txAmount: { fontSize: 13, fontWeight: "700" },
  txStatus: { fontSize: 9, fontWeight: "500", marginTop: 1 },

  // ── Security ──
  security: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  securityText: { flex: 1, fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 15 },
});
