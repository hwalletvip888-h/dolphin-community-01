import { View, Text, StyleSheet } from "react-native";
import { Zap } from "lucide-react-native";
import { CardShell } from "./CardShell";

type Item = { symbol: string; direction: string; entry: string; tp: string; sl: string; rr: string };

export function SignalCard({ items }: { items: Item[] }) {
  return (
    <CardShell>
      <View style={s.head}>
        <Zap size={13} color="#F7D56D" />
        <Text style={s.headText}>交易信号</Text>
      </View>
      {items.map((it, i) => (
        <View key={i} style={[s.row, i < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 8, marginBottom: 8 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Text style={s.sym}>{it.symbol}</Text>
            <Text style={[s.dir, { color: it.direction === "long" ? "#34D399" : "#FB923C" }]}>{it.direction.toUpperCase()}</Text>
            <Text style={s.rr}>RR {it.rr}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Kv k="入场" v={it.entry} />
            <Kv k="止盈" v={it.tp} c="#34D399" />
            <Kv k="止损" v={it.sl} c="#FB923C" />
          </View>
        </View>
      ))}
    </CardShell>
  );
}

function Kv({ k, v, c }: { k: string; v: string; c?: string }) {
  return (
    <View>
      <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{k}</Text>
      <Text style={{ fontSize: 12, fontWeight: "600", color: c || "rgba(255,255,255,0.7)" }}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  headText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.45)" },
  row: {},
  sym: { fontSize: 14, fontWeight: "700", color: "#fff" },
  dir: { fontSize: 10, fontWeight: "700", backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  rr: { fontSize: 12, fontWeight: "700", color: "#F7D56D" },
});
