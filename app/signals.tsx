import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Shield, Activity, TrendingUp, Zap, Search } from "lucide-react-native";

interface TokenItem {
  symbol: string; name: string; price: string;
  marketCap: string; volume1h: string; securityScore: number;
  holders?: string; created?: string;
}

const RISK_COLORS = { safe: "#34D399", medium: "#F7D56D", high: "#FB923C", critical: "#EF4444" };
const getRisk = (score: number) => score >= 80 ? "safe" : score >= 50 ? "medium" : score >= 30 ? "high" : "critical";
const getRiskLabel = (score: number) => score >= 80 ? "安全" : score >= 50 ? "注意" : score >= 30 ? "危险" : "避开";
const formatMC = (v: string) => { const n = parseFloat(v); if (n > 1e9) return `$${(n/1e9).toFixed(1)}B`; if (n > 1e6) return `$${(n/1e6).toFixed(1)}M`; if (n > 1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${n.toFixed(0)}`; };

export default function SignalsScreen() {
  const router = useRouter();
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "mc" | "volume">("score");
  const [minScore, setMinScore] = useState(0);

  useEffect(() => { fetchTokens(); }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const r = await fetch("https://api.hvip.ink/api/signals", { signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      const raw: TokenItem[] = (d?.signals || []).map((t: any) => ({
        symbol: t.symbol || "?", name: t.name || "", price: t.price || "—",
        marketCap: t.marketCap || "0", volume1h: t.volume1h || t.volume || "0",
        securityScore: t.securityScore || 0, holders: t.holders, created: t.created,
      }));
      setTokens(raw);
    } catch {}
    setLoading(false);
  };

  const sorted = [...tokens]
    .filter(t => t.securityScore >= minScore)
    .sort((a, b) => sortBy === "score" ? b.securityScore - a.securityScore :
                      sortBy === "mc" ? parseFloat(b.marketCap) - parseFloat(a.marketCap) :
                      parseFloat(b.volume1h) - parseFloat(a.volume1h));

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={23} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>信号广场</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Sort & filter bar */}
      <View style={s.bar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sortRow}>
          {[
            { id: "score" as const, label: "安全度", icon: Shield },
            { id: "mc" as const, label: "市值", icon: TrendingUp },
            { id: "volume" as const, label: "成交量", icon: Activity },
          ].map(f => (
            <TouchableOpacity key={f.id} style={[s.sortBtn, sortBy === f.id && s.sortBtnActive]} onPress={() => setSortBy(f.id)}>
              <f.icon size={13} color={sortBy === f.id ? "#090012" : "rgba(255,255,255,0.5)"} />
              <Text style={[s.sortT, sortBy === f.id && s.sortTActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Score filter */}
        <View style={s.scoreFilter}>
          {[0, 50, 80].map(level => (
            <TouchableOpacity key={level} style={[s.scoreBtn, minScore === level && s.scoreBtnActive]} onPress={() => setMinScore(level)}>
              <Text style={[s.scoreBtnT, minScore === level && { color: "#090012" }]}>
                {level === 0 ? "全部" : `≥${level}分`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Token list */}
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={s.loading}>加载中...</Text> : sorted.map((t, i) => {
          const risk = getRisk(t.securityScore);
          const color = RISK_COLORS[risk];
          const price = parseFloat(t.price);
          const priceStr = isNaN(price) ? "—" : price < 0.01 ? `$${price.toFixed(6)}` : `$${price.toFixed(4)}`;
          return (
            <View key={i} style={s.card}>
              <View style={s.rank}><Text style={s.rankT}>{i + 1}</Text></View>

              {/* Left: avatar + info */}
              <View style={s.cardLeft}>
                <View style={[s.avatar, { backgroundColor: color + "15" }]}>
                  <Text style={[s.avatarT, { color }]}>{t.symbol[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.sym}>{t.symbol}</Text>
                    <View style={[s.riskBadge, { backgroundColor: color + "15" }]}>
                      <Text style={[s.riskText, { color }]}>{getRiskLabel(t.securityScore)} · {Math.round(t.securityScore)}分</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                    <Text style={s.meta}>市值 {formatMC(t.marketCap)}</Text>
                    <Text style={s.meta}>24h 量 {formatMC(t.volume1h)}</Text>
                  </View>
                </View>
              </View>

              {/* Right: price + actions */}
              <View style={s.cardRight}>
                <Text style={s.price}>{priceStr}</Text>
                <View style={s.actions}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => router.push(`/chat/onchain?msg=${encodeURIComponent("分析链上数据: " + t.symbol)}`)}>
                    <Search size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={s.actionT}>分析</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.actionPrimary]} onPress={() => router.push(`/chat/onchain?msg=${encodeURIComponent("我想跟单买入 " + t.symbol)}`)}>
                    <Zap size={12} color="#090012" />
                    <Text style={[s.actionT, { color: "#090012" }]}>跟单</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
  bar: { paddingHorizontal: 16, marginBottom: 12 },
  sortRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  sortBtnActive: { backgroundColor: "#F7D56D" },
  sortT: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  sortTActive: { color: "#090012" },
  scoreFilter: { flexDirection: "row", gap: 6 },
  scoreBtn: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  scoreBtnActive: { backgroundColor: "#C063FF" },
  scoreBtnT: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.4)" },
  list: { paddingHorizontal: 14, paddingBottom: 30 },
  loading: { fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", paddingTop: 40 },
  card: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", gap: 8 },
  rank: { width: 20, alignItems: "center" },
  rankT: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.25)" },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  avatarT: { fontSize: 15, fontWeight: "800" },
  sym: { fontSize: 14, fontWeight: "800", color: "#fff" },
  riskBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  riskText: { fontSize: 10, fontWeight: "700" },
  meta: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
  cardRight: { alignItems: "flex-end", gap: 6 },
  price: { fontSize: 13, fontWeight: "700", color: "#fff" },
  actions: { flexDirection: "row", gap: 6 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  actionPrimary: { backgroundColor: "#F7D56D" },
  actionT: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
});
