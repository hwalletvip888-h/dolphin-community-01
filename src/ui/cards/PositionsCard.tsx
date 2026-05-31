import { View, Text, StyleSheet } from "react-native";
import { Briefcase } from "lucide-react-native";
import { CardShell } from "./CardShell";

type Item = { symbol: string; side: string; size: string; entry: string; pnl: string };

export function PositionsCard({ items }: { items: Item[] }) {
  return (
    <CardShell>
      <View style={s.head}>
        <Briefcase size={13} color="rgba(255,255,255,0.45)" />
        <Text style={s.headText}>当前持仓</Text>
      </View>
      {items.map((it, i) => (
        <View key={i} style={[s.row, i < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 8, marginBottom: 8 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <Text style={s.sym}>{it.symbol}</Text>
            <Text style={[s.side, { color: it.side.toLowerCase() === "long" ? "#34D399" : "#FB923C" }]}>{it.side} {it.size}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={s.entry}>入场 {it.entry}</Text>
            <Text style={[s.pnl, { color: it.pnl?.startsWith("-") ? "#FB923C" : "#34D399" }]}>{it.pnl}</Text>
          </View>
        </View>
      ))}
    </CardShell>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  headText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.45)" },
  row: {},
  sym: { fontSize: 14, fontWeight: "700", color: "#fff" },
  side: { fontSize: 10, fontWeight: "700", backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  entry: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  pnl: { fontSize: 15, fontWeight: "700" },
});
