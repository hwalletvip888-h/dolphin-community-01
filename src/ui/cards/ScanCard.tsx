import { View, Text, StyleSheet } from "react-native";
import { Radar } from "lucide-react-native";
import { CardShell } from "./CardShell";

type Item = { symbol: string; price: string; rr: string };

export function ScanCard({ coins, signals, top }: { coins: number; signals: number; top: Item[] }) {
  return (
    <CardShell>
      <View style={s.head}>
        <Radar size={13} color="rgba(255,255,255,0.45)" />
        <Text style={s.headText}>多币扫描 ({coins}币种 · {signals}信号)</Text>
      </View>
      {top.map((it, i) => (
        <View key={i} style={[s.row, i < top.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 6, marginBottom: 6 }]}>
          <Text style={s.sym}>{it.symbol}</Text>
          <Text style={s.price}>{it.price}</Text>
          <Text style={[s.rr, { color: it.rr?.startsWith("-") ? "#FB923C" : "#34D399" }]}>RR {it.rr}</Text>
        </View>
      ))}
    </CardShell>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  headText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.45)" },
  row: { flexDirection: "row", alignItems: "center", flex: 1 },
  sym: { flex: 1, fontSize: 13, fontWeight: "600", color: "#fff" },
  price: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginHorizontal: 12 },
  rr: { fontSize: 12, fontWeight: "600" },
});
