import { View, Text, StyleSheet } from "react-native";
import { Landmark } from "lucide-react-native";
import { CardShell } from "./CardShell";

export function AccountCard({ usdc, pol, positions }: { usdc: string; pol: string; positions?: string }) {
  return (
    <CardShell>
      <View style={s.head}>
        <Landmark size={13} color="rgba(255,255,255,0.45)" />
        <Text style={s.headText}>Polymarket 账户</Text>
      </View>
      <Row k="USDC.e" v={usdc} />
      <Row k="POL" v={pol} />
      {positions ? <Row k="持仓" v={positions} /> : null}
    </CardShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
      <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{k}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#F7D56D" }}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.06)" },
  headText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.45)" },
});
