import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/stores/auth";

const ZHUGE = [
  { id: "c1", symbol: "BTC/USDT", side: "多", leverage: "10x", usdValue: "$4,360", entry: "87,200", mark: "87,450", liq: "78,480", pnl: "+$12.50", pnlPct: "+2.9%", strategy: "H1 布林带反转" },
  { id: "c2", symbol: "ETH/USDT", side: "空", leverage: "5x", usdValue: "$2,075", entry: "4,150", mark: "4,120", liq: "4,980", pnl: "+$15.00", pnlPct: "+3.6%", strategy: "EMA 金叉" },
];
const ONCHAIN = [
  { id: "e1", symbol: "PEPE", chain: "Ethereum", amount: "120M", buy: "$0.00118", price: "$0.00215", usdValue: "$258", pnl: "+$116.40", pnlPct: "+82.2%" },
  { id: "e2", symbol: "WIF", chain: "Solana", amount: "500", buy: "$2.45", price: "$2.98", usdValue: "$1,490", pnl: "+$265.00", pnlPct: "+21.6%" },
];
const WEALTH = [
  { id: "w1", symbol: "USDC", protocol: "AAVE", apy: "8.2%", usdValue: "$800", earned: "+$3.20", days: 12 },
  { id: "w2", symbol: "stETH", protocol: "Lido", apy: "3.8%", usdValue: "$1,250", earned: "+$12.50", days: 45 },
];

const val = (s: string) => parseFloat(s.replace(/[$,]/g, ""));
const totalVal = [...ZHUGE, ...ONCHAIN, ...WEALTH].reduce((s, p: any) => s + val(p.usdValue), 0);

export default function PositionsScreen() {
  const router = useRouter();
  const { level } = useAuth();

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}><Text style={s.headerTitle}>持仓</Text></View>

      {/* Summary */}
      <View style={s.summary}>
        <View style={{ alignItems: "center" }}><Text style={[s.sumVal, { color: "#34D399" }]}>+$42.50</Text><Text style={s.sumLbl}>今日收益</Text></View>
        <View style={{ alignItems: "center" }}><Text style={[s.sumVal, { color: "#F7D56D" }]}>+$3,280</Text><Text style={s.sumLbl}>累计收益</Text></View>
        <View style={{ alignItems: "center" }}><Text style={s.sumVal}>${totalVal.toLocaleString()}</Text><Text style={s.sumLbl}>总仓位</Text></View>
      </View>

      {/* 诸葛策略 */}
      <Text style={s.secTitle}>📊 诸葛策略</Text>
      {ZHUGE.map((p) => (
        <View key={p.id} style={s.card}>
          <View style={s.row}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={s.sym}>{p.symbol}</Text>
              <Text style={[s.badge, { color: p.side === "多" ? "#34D399" : "#FB923C" }]}>{p.side}</Text>
              <Text style={s.lev}>{p.leverage}</Text>
            </View>
            <Text style={[s.pnl, { color: p.pnl.startsWith("+") ? "#34D399" : "#FB923C" }]}>{p.pnl} ({p.pnlPct})</Text>
          </View>
          <View style={s.detailRow}>
            <D label="仓位" v={p.usdValue} /><D label="开仓" v={"$"+p.entry} /><D label="标记" v={"$"+p.mark} /><D label="强平" v={"$"+p.liq} c="#FB923C" />
          </View>
          <Text style={s.strat}>{p.strategy}</Text>
        </View>
      ))}

      {/* 链上猎手 */}
      <Text style={[s.secTitle, { marginTop: 8 }]}>🔍 链上猎手</Text>
      {ONCHAIN.map((p) => (
        <View key={p.id} style={s.card}>
          <View style={s.row}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={s.sym}>{p.symbol}</Text>
              <Text style={s.chain}>{p.chain}</Text>
            </View>
            <Text style={[s.pnl, { color: p.pnl.startsWith("+") ? "#34D399" : "#FB923C" }]}>{p.pnl} ({p.pnlPct})</Text>
          </View>
          <View style={s.detailRow}>
            <D label="数量" v={p.amount} /><D label="买入" v={p.buy} /><D label="现价" v={p.price} /><D label="价值" v={p.usdValue} />
          </View>
        </View>
      ))}

      {/* 稳盈管家 */}
      <Text style={[s.secTitle, { marginTop: 8 }]}>💎 稳盈管家</Text>
      {WEALTH.map((p) => (
        <View key={p.id} style={s.card}>
          <View style={s.row}>
            <View>
              <Text style={s.sym}>{p.symbol}</Text>
              <Text style={s.chain}>{p.protocol}</Text>
            </View>
            <Text style={s.usd}>{p.usdValue}</Text>
          </View>
          <View style={s.detailRow}>
            <D label="年化" v={p.apy} c="#34D399" /><D label="已赚" v={p.earned} c="#34D399" /><D label="天数" v={`${p.days}天`} />
          </View>
        </View>
      ))}

      <View style={s.infoRow}>
        <Text style={s.infoTxt}>Lv.{level} · OKX TEE 安全签名</Text>
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function D({ label, v, c = "rgba(255,255,255,0.7)" }: { label: string; v: string; c?: string }) {
  return <View style={{ alignItems: "center" }}><Text style={s.dLabel}>{label}</Text><Text style={[s.dVal, { color: c }]}>{v}</Text></View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 30 },
  header: { marginBottom: 18 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },
  summary: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "rgba(35,10,62,0.6)", borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.15)", padding: 18, marginBottom: 22 },
  sumVal: { fontSize: 20, fontWeight: "900", color: "#fff" },
  sumLbl: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4 },
  secTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 10 },
  card: { backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16, borderWidth: 0.5, borderColor: "rgba(192,99,255,0.1)", padding: 14, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sym: { fontSize: 15, fontWeight: "800", color: "#fff" },
  badge: { fontSize: 11, fontWeight: "700", backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  lev: { fontSize: 10, fontWeight: "700", color: "#F7D56D", backgroundColor: "rgba(247,213,109,0.1)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  chain: { fontSize: 10, color: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  pnl: { fontSize: 14, fontWeight: "700" },
  usd: { fontSize: 15, fontWeight: "800", color: "#fff" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  dLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 },
  dVal: { fontSize: 11, fontWeight: "600" },
  strat: { fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 },
  infoRow: { alignItems: "center", marginTop: 8 },
  infoTxt: { fontSize: 11, color: "rgba(255,255,255,0.2)" },
});
