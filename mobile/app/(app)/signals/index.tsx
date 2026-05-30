import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { Activity, Shield, ShieldAlert, ShieldCheck, TrendingUp, TrendingDown, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useSignalStore, SignalItem } from "@/src/stores/signal-store";

function formatUSD(v: string): string {
  const n = parseFloat(v);
  if (!n) return "$0";
  if (n > 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n > 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n > 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function SecurityBadge({ score }: { score: number }) {
  if (score >= 80) return <ShieldCheck size={14} color="#34D399" />;
  if (score >= 50) return <Shield size={14} color="#FBBF24" />;
  return <ShieldAlert size={14} color="#F87171" />;
}

function SecurityBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View className="flex-row items-center gap-1 mb-0.5">
      <Text className="text-[9px] text-white/40 w-12" numberOfLines={1}>{label}</Text>
      <View className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </View>
      <Text className="text-[9px] text-white/30 w-8 text-right">{pct.toFixed(0)}%</Text>
    </View>
  );
}

function SignalCard({ item }: { item: SignalItem }) {
  const [expanded, setExpanded] = useState(false);
  const buyRate = parseFloat(item.buyTx1h) + parseFloat(item.sellTx1h) > 0
    ? parseFloat(item.buyTx1h) / (parseFloat(item.buyTx1h) + parseFloat(item.sellTx1h))
    : 0.5;
  const isRisk = item.security.phishing > 5 || item.security.insiders > 80 || item.security.bundlers > 80;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
      className="bg-white/5 border border-white/10 rounded-2xl mb-2 overflow-hidden"
    >
      {/* Main row */}
      <View className="px-4 py-3 flex-row items-center gap-3">
        {/* Logo */}
        <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
          <Text className="text-[13px] font-bold text-white/80">{item.symbol.slice(0, 2).toUpperCase()}</Text>
        </View>

        {/* Info */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-bold text-white">{item.symbol}</Text>
            <SecurityBadge score={item.securityScore} />
            {isRisk && (
              <View className="bg-red-500/20 px-1.5 py-0.5 rounded">
                <Text className="text-[9px] font-bold text-red-400">风险</Text>
              </View>
            )}
          </View>
          <Text className="text-[11px] text-white/40" numberOfLines={1}>{item.name}</Text>
        </View>

        {/* Price + volume */}
        <View className="items-end">
          <Text className="text-[14px] font-bold text-white">{item.price || formatUSD(item.marketCap)}</Text>
          <Text className="text-[11px] text-white/40">Vol {formatUSD(item.volume1h)}</Text>
        </View>

        {/* Buy/sell indicator */}
        <View className="items-center">
          <View className={`w-2 h-2 rounded-full mb-0.5 ${buyRate > 0.5 ? "bg-emerald-400" : "bg-red-400"}`} />
          <Text className={`text-[10px] font-bold ${buyRate > 0.5 ? "text-emerald-400" : "text-red-400"}`}>
            {buyRate > 0.6 ? "强买" : buyRate > 0.5 ? "偏买" : "偏卖"}
          </Text>
        </View>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View className="px-4 pb-3 border-t border-white/5 pt-3 bg-white/[0.02]">
          {/* Market stats */}
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-white/5 rounded-lg px-2 py-1.5">
              <Text className="text-[10px] text-white/40">持有人</Text>
              <Text className="text-[13px] font-bold text-white/80">{parseInt(item.holders).toLocaleString()}</Text>
            </View>
            <View className="flex-1 bg-white/5 rounded-lg px-2 py-1.5">
              <Text className="text-[10px] text-white/40">市值</Text>
              <Text className="text-[13px] font-bold text-white/80">{formatUSD(item.marketCap)}</Text>
            </View>
            <View className="flex-1 bg-white/5 rounded-lg px-2 py-1.5">
              <Text className="text-[10px] text-white/40">内盘</Text>
              <Text className="text-[13px] font-bold text-[#F7D56D]">{item.bondingPercent}%</Text>
            </View>
            <View className="flex-1 bg-white/5 rounded-lg px-2 py-1.5">
              <Text className="text-[10px] text-white/40">安全分</Text>
              <Text className={`text-[13px] font-bold ${item.securityScore >= 80 ? "text-emerald-400" : item.securityScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                {item.securityScore}
              </Text>
            </View>
          </View>

          {/* Security breakdown */}
          <Text className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wider">安全审计</Text>
          <SecurityBar label="前十集中" value={item.security.top10Holdings} color={item.security.top10Holdings > 60 ? "#F87171" : "#34D399"} />
          <SecurityBar label="开发者" value={item.security.devHoldings} color={item.security.devHoldings > 20 ? "#F87171" : "#34D399"} />
          <SecurityBar label="内幕" value={item.security.insiders} color={item.security.insiders > 30 ? "#F87171" : "#FBBF24"} />
          <SecurityBar label="庄家" value={item.security.bundlers} color={item.security.bundlers > 40 ? "#F87171" : "#FBBF24"} />
          <SecurityBar label="狙击手" value={item.security.snipers} color={item.security.snipers > 20 ? "#F87171" : "#34D399"} />
          <SecurityBar label="新钱包" value={item.security.freshWallets} color={item.security.freshWallets > 50 ? "#FBBF24" : "#34D399"} />
          <SecurityBar label="钓鱼" value={item.security.phishing} color={item.security.phishing > 0 ? "#F87171" : "#34D399"} />

          {/* Flags row */}
          <View className="flex-row flex-wrap gap-1.5 mt-3">
            {item.flags.communityTakeover && <FlagBadge label="CTO" />}
            {item.flags.liveOnPumpFun && <FlagBadge label="直播中" color="#FBBF24" />}
            {item.flags.dexScreenerPaid && <FlagBadge label="Dex付费" color="#38BDF8" />}
            {item.social.x && <FlagBadge label="X" color="#1DA1F2" />}
            {item.social.telegram && <FlagBadge label="TG" color="#38BDF8" />}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function FlagBadge({ label, color = "#A78BFA" }: { label: string; color?: string }) {
  return (
    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20` }}>
      <Text className="text-[9px] font-semibold" style={{ color }}>{label}</Text>
    </View>
  );
}

// ── Sort options ────────────────────────────────────────

type SortKey = "securityScore" | "volume1h" | "marketCap" | "holders" | "created";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "securityScore", label: "安全分" },
  { key: "volume1h", label: "交易量" },
  { key: "marketCap", label: "市值" },
  { key: "holders", label: "持有人" },
  { key: "created", label: "最新" },
];

// ── Main Screen ─────────────────────────────────────────

export default function SignalsScreen() {
  const { signals, loading, fetchSignals } = useSignalStore();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("securityScore");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchSignals(); }, []);

  const filtered = useMemo(() => {
    let list = [...signals];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case "securityScore": return b.securityScore - a.securityScore;
        case "volume1h": return parseFloat(b.volume1h) - parseFloat(a.volume1h);
        case "marketCap": return parseFloat(b.marketCap) - parseFloat(a.marketCap);
        case "holders": return parseInt(b.holders) - parseInt(a.holders);
        case "created": return parseInt(b.created) - parseInt(a.created);
        default: return 0;
      }
    });
    return list;
  }, [signals, search, sortKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSignals();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-[#050015]">
      <ScrollView
        className="flex-1 px-5 pt-14"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F7D56D" />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[28px] font-black text-[#F7D56D]">信号</Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)} className="p-2">
              <SlidersHorizontal size={18} color={showFilters ? "#F7D56D" : "white"} opacity={showFilters ? 1 : 0.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View className="flex-row items-center bg-white/10 rounded-xl px-3 py-2.5 mb-3">
          <Search size={14} color="white" opacity={0.4} />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="搜索代币..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="flex-1 ml-2 text-[13px] text-white"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={14} color="white" opacity={0.5} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Sort bar */}
        {showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 4 }}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => { setSortKey(opt.key); setShowFilters(false); }}
                className={`px-3 py-1.5 rounded-full ${sortKey === opt.key ? "bg-[#F7D56D]/20 border border-[#F7D56D]/40" : "bg-white/5 border border-white/10"}`}
              >
                <Text className={`text-[11px] font-semibold ${sortKey === opt.key ? "text-[#F7D56D]" : "text-white/50"}`}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Source indicator */}
        <Text className="text-[10px] text-white/20 mb-2">数据源: OKX Market API · Solana</Text>

        {/* Signal list */}
        {loading && signals.length === 0 ? (
          <Text className="text-white/50 text-center mt-20">加载中...</Text>
        ) : filtered.length === 0 ? (
          <View className="items-center mt-20">
            <Activity size={48} color="#8A3FFC" />
            <Text className="text-white/50 text-[14px] mt-4">{search ? "无匹配结果" : "暂无信号数据"}</Text>
          </View>
        ) : (
          filtered.map((item, i) => (
            <SignalCard key={`${item.symbol}-${i}`} item={item} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
