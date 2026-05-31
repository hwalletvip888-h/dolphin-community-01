import { View, Text, StyleSheet } from "react-native";
import { Wallet } from "lucide-react-native";
import { CardShell } from "./CardShell";

type Token = { symbol: string; chain: string; amount: string; usd: string };

export function BalanceCard({ total, tokens }: { total: string; tokens: Token[] }) {
  return (
    <CardShell>
      <View style={s.head}>
        <Wallet size={13} color="rgba(255,255,255,0.45)" />
        <Text style={s.headText}>资产</Text>
      </View>
      <Text style={s.total}>{total}</Text>
      {tokens.map((t, i) => (
        <View key={i} style={[s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.05)", paddingTop: 8, marginTop: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.sym}>{t.symbol}</Text>
            <Text style={s.chain}>{t.chain}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.amt}>{t.amount}</Text>
            <Text style={s.usd}>{t.usd}</Text>
          </View>
        </View>
      ))}
    </CardShell>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  headText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.45)" },
  total: { fontSize: 24, fontWeight: "900", color: "#F7D56D", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sym: { fontSize: 13, fontWeight: "700", color: "#fff" },
  chain: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  amt: { fontSize: 13, fontWeight: "700", color: "#fff" },
  usd: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 },
});
