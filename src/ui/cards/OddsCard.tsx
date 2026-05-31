import { View, Text, StyleSheet } from "react-native";
import { Trophy } from "lucide-react-native";
import { CardShell } from "./CardShell";

export function OddsCard({ items }: { items: { question: string; yes: string; volume: string }[] }) {
  return (
    <CardShell>
      <View style={s.head}>
        <Trophy size={13} color="rgba(255,255,255,0.45)" />
        <Text style={s.headText}>预测市场赔率</Text>
      </View>
      {items.map((it, i) => (
        <View key={i} style={[s.row, i < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 8, marginBottom: 8 }]}>
          <Text style={s.q} numberOfLines={2}>{it.question}</Text>
          <View style={{ alignItems: "flex-end", marginLeft: 10 }}>
            <Text style={s.yes}>{it.yes}</Text>
            <Text style={s.vol}>{it.volume}</Text>
          </View>
        </View>
      ))}
    </CardShell>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  headText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.45)" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  q: { flex: 1, fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 18 },
  yes: { fontSize: 14, fontWeight: "700", color: "#F7D56D" },
  vol: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 },
});
