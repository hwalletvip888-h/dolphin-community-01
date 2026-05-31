import { View, Text, StyleSheet } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { CardShell } from "./CardShell";

export function PriceCard({ items }: { items: { symbol: string; price: string; change: string }[] }) {
  return (
    <CardShell>
      <View style={s.head}>
        <Text style={s.headText}>实时行情</Text>
      </View>
      {items.map((it, i) => {
        const up = it.change?.startsWith("+");
        const color = up ? "#34D399" : "#FB923C";
        const Icon = up ? TrendingUp : TrendingDown;
        return (
          <View key={i} style={[s.row, i < items.length - 1 && s.border]}>
            <Text style={s.sym}>{it.symbol}</Text>
            <Text style={s.price}>{it.price}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2, minWidth: 60, justifyContent: "flex-end" }}>
              <Icon size={11} color={color} />
              <Text style={[s.change, { color }]}>{it.change}</Text>
            </View>
          </View>
        );
      })}
    </CardShell>
  );
}

const s = StyleSheet.create({
  head: { marginBottom: 8, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  headText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.45)" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.04)" },
  sym: { fontSize: 13, fontWeight: "700", color: "#fff", flex: 1 },
  price: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginHorizontal: 12 },
  change: { fontSize: 12, fontWeight: "600" },
});
