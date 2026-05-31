import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Shield, TrendingUp, AlertTriangle } from "lucide-react-native";

interface TradeParams {
  symbol?: string;
  direction?: string;
  leverage?: string;
  amount?: string;
  entryPrice?: string;
  stopLoss?: string;
  trailDistance?: string;  // trailing stop distance after activation
  trailActivate?: string;  // when to activate trailing
}

export function TradeConfirmCard({
  params,
  onConfirm,
  onCancel,
}: {
  params: TradeParams;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const {
    symbol = "BTC/USDT",
    direction = "做多",
    leverage = "10x",
    amount = "100 USDT",
    entryPrice = "市价",
    stopLoss = "-3%",
    trailDistance = "2%",
    trailActivate = "2%",
  } = params;

  const isLong = direction.includes("多");

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <Shield size={16} color="#F7D56D" />
        <Text style={s.headerTitle}>交易确认</Text>
        <Text style={s.headerSub}>请仔细核对以下信息</Text>
      </View>

      {/* Main details */}
      <View style={s.main}>
        <View style={s.mainLeft}>
          <Text style={s.symbol}>{symbol}</Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
            <View style={[s.pill, { backgroundColor: isLong ? "rgba(52,211,153,0.12)" : "rgba(251,146,60,0.12)" }]}>
              <Text style={[s.pillText, { color: isLong ? "#34D399" : "#FB923C" }]}>{direction}</Text>
            </View>
            <View style={[s.pill, { backgroundColor: "rgba(247,213,109,0.1)" }]}>
              <Text style={[s.pillText, { color: "#F7D56D" }]}>{leverage}</Text>
            </View>
          </View>
        </View>
        <View style={s.mainRight}>
          <Text style={s.amount}>{amount}</Text>
          <Text style={s.amountLabel}>委托金额</Text>
        </View>
      </View>

      {/* Detail rows */}
      <View style={s.grid}>
        <Detail label="入场价" value={entryPrice} />
        <Detail label="硬止损" value={stopLoss} color="#FB923C" />
        <Detail label="移动止盈" value={`${trailDistance} 回撤`} color="#34D399" />
        <Detail label={`盈利 >${trailActivate} 启动`} value="追踪" color="#F7D56D" />
      </View>

      {/* Risk warning */}
      <View style={s.warn}>
        <AlertTriangle size={13} color="#F7D56D" />
        <Text style={s.warnText}>
          合约交易存在高风险，请确认已了解风险并愿意承担可能的损失
        </Text>
      </View>

      {/* Buttons */}
      <View style={s.buttons}>
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={s.cancelText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.confirmBtn, { backgroundColor: isLong ? "#34D399" : "#FB923C" }]}
          onPress={onConfirm}
          activeOpacity={0.8}
        >
          <TrendingUp size={16} color="#090012" />
          <Text style={s.confirmText}>确认{direction}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Detail({ label, value, color = "#fff" }: { label: string; value: string; color?: string }) {
  return (
    <View style={ds.item}>
      <Text style={ds.label}>{label}</Text>
      <Text style={[ds.value, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "rgba(35,10,62,0.85)", borderRadius: 20,
    borderWidth: 0.5, borderColor: "rgba(247,213,109,0.2)",
    padding: 20,
  },
  header: { alignItems: "center", marginBottom: 16, gap: 2 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#F7D56D" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  main: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 14 },
  mainLeft: {},
  symbol: { fontSize: 18, fontWeight: "900", color: "#fff" },
  pill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: "700" },
  mainRight: { alignItems: "flex-end" },
  amount: { fontSize: 20, fontWeight: "900", color: "#fff" },
  amountLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  warn: { flexDirection: "row", gap: 8, backgroundColor: "rgba(247,213,109,0.06)", borderRadius: 12, padding: 10, marginBottom: 16 },
  warnText: { flex: 1, fontSize: 11, color: "rgba(247,213,109,0.7)", lineHeight: 16 },
  buttons: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  cancelText: { fontSize: 15, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  confirmBtn: { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  confirmText: { fontSize: 15, fontWeight: "700", color: "#090012" },
});

const ds = StyleSheet.create({
  item: { width: "25%", padding: 6 },
  label: { fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 2, textAlign: "center" },
  value: { fontSize: 12, fontWeight: "700", textAlign: "center" },
});
