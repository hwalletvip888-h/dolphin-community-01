import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, TrendingUp, TrendingDown, Globe } from "lucide-react-native";

interface SignalItem {
  symbol: string; name: string; chain: string;
  price: string; changePct: string; volume24h: string; marketCap: string;
}

export default function SignalsScreen() {
  const router = useRouter();
  const [tokens, setTokens] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chain, setChain] = useState("solana");

  useEffect(() => { fetchTokens(); }, [chain]);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const r = await fetch(`http://154.12.55.135:3000/api/h/v1/meme/scan?chain=${chain}&limit=30`, { signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      const raw = d?.data || d?.tokens || d?.results || [];
      if (Array.isArray(raw)) {
        setTokens(raw.map((t: any) => ({
          symbol: t.symbol || "?", name: t.name || "", chain: t.chain || chain,
          price: t.price || "—", changePct: t.change || t.change24h || "0",
          volume24h: t.volume24h || t.volume || "0", marketCap: t.marketCap || t.mc || "0",
        })));
      }
    } catch {}
    setLoading(false);
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>信号广场</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Chain filter */}
      <View style={s.filterRow}>
        {[
          { id: "solana", label: "Solana" },
          { id: "ethereum", label: "Ethereum" },
          { id: "base", label: "Base" },
        ].map((f) => (
          <TouchableOpacity key={f.id} style={[s.filter, chain === f.id && s.filterActive]} onPress={() => setChain(f.id)}>
            <Text style={[s.filterT, chain === f.id && s.filterTActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={s.loading}>加载中...</Text> : tokens.map((t, i) => {
          const chg = parseFloat(t.changePct || "0");
          const isUp = chg >= 0;
          const price = parseFloat(t.price);
          const priceStr = isNaN(price) ? "—" : price < 0.01 ? `$${price.toFixed(8)}` : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
          return (
            <TouchableOpacity key={i} style={s.card} onPress={() => router.push(`/chat/onchain?msg=${encodeURIComponent("帮我分析 " + t.symbol)}`)} activeOpacity={0.7}>
              <View style={s.rank}><Text style={s.rankT}>{i + 1}</Text></View>
              <View style={s.cardLeft}>
                <View style={s.avatar}><Text style={s.avatarT}>{t.symbol[0]}</Text></View>
                <View>
                  <Text style={s.sym}>{t.symbol}</Text>
                  <Text style={s.name}>{t.name || t.chain}</Text>
                </View>
              </View>
              <View style={s.cardMid}>
                <Text style={s.price}>{priceStr}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  {isUp ? <TrendingUp size={12} color="#34D399" /> : <TrendingDown size={12} color="#FB923C" />}
                  <Text style={[s.chg, { color: isUp ? "#34D399" : "#FB923C" }]}>{isUp ? "+" : ""}{chg.toFixed(1)}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingBottom: 10, paddingHorizontal: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#A78BFA" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 18, marginBottom: 14 },
  filter: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  filterActive: { backgroundColor: "rgba(167,139,250,0.15)" },
  filterT: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.4)" },
  filterTActive: { color: "#A78BFA" },
  list: { paddingHorizontal: 18, paddingBottom: 30 },
  loading: { fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", paddingTop: 40 },
  card: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", gap: 10 },
  rank: { width: 24, alignItems: "center" },
  rankT: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.3)" },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: "rgba(167,139,250,0.1)", alignItems: "center", justifyContent: "center" },
  avatarT: { fontSize: 14, fontWeight: "800", color: "#A78BFA" },
  sym: { fontSize: 14, fontWeight: "700", color: "#fff" },
  name: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 },
  cardMid: { alignItems: "flex-end" },
  price: { fontSize: 13, fontWeight: "700", color: "#fff" },
  chg: { fontSize: 12, fontWeight: "600" },
});
