import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Modal } from "react-native";
import { Search, TrendingUp, DollarSign, Shield, X, ChevronRight } from "lucide-react-native";
import { API_BASE, authHeaders } from "@/src/lib/api";

interface DeFiProduct {
  investmentId: number;
  name: string;
  platformName: string;
  rate: string;
  tvl: string;
  chainIndex: string;
  productGroup: string;
}

interface DeFiDetail {
  investmentName: string;
  platformName: string;
  chainIndex: string;
  network: string;
  rate: string;
  rateTypeDesc: string;
  tvl: string;
  isInvestable: boolean;
  isSupportRedeem: boolean;
  underlyingToken: { tokenSymbol: string; tokenAddress: string }[];
  rateDetails: { rate: string; title: string }[];
  aboutToken: { tokenSymbol: string; price: string; marketCap: string }[];
}

const GROUP_LABELS: Record<string, string> = {
  SINGLE_EARN: "单币理财",
  DEX_POOL: "流动性挖矿",
  LENDING: "借贷",
};

function formatUSD(v: string): string {
  const n = parseFloat(v);
  if (!n) return "$0";
  if (n > 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n > 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${Number(n).toLocaleString()}`;
}

export default function DeFiScreen() {
  const [search, setSearch] = useState("USDC");
  const [products, setProducts] = useState<DeFiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DeFiDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [error, setError] = useState("");

  const doSearch = async (keyword?: string) => {
    const kw = keyword || search;
    if (!kw.trim()) return;
    setLoading(true);
    setError("");
    try {
      const h = await authHeaders();
      const r = await fetch(`${API_BASE}/api/wallet`, {
        method: "POST", headers: h,
        body: JSON.stringify({ action: "defiSearch", tokenKeywordList: [kw.trim().toUpperCase()] }),
      });
      const d = await r.json();
      if (d.ok) setProducts(d.list || []);
      else setError(d.message || "查询失败");
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  };

  const viewDetail = async (id: number) => {
    try {
      const h = await authHeaders();
      const r = await fetch(`${API_BASE}/api/wallet`, {
        method: "POST", headers: h,
        body: JSON.stringify({ action: "defiDetail", investmentId: id }),
      });
      const d = await r.json();
      if (d.ok && d.detail) {
        setDetail(d.detail);
        setShowDetail(true);
      }
    } catch { /* */ }
  };

  useEffect(() => { doSearch("USDC"); }, []);

  return (
    <View className="flex-1 bg-[#050015]">
      <ScrollView className="flex-1 px-5 pt-14" contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => doSearch()} tintColor="#F7D56D" />}>
        <Text className="text-[28px] font-black text-[#F7D56D] mb-6">理财</Text>

        {/* Search */}
        <View className="flex-row items-center bg-white/10 rounded-xl px-3 py-2.5 mb-4">
          <Search size={14} color="white" opacity={0.4} />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="ETH, USDC, SOL..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="flex-1 ml-2 text-[13px] text-white"
            onSubmitEditing={() => doSearch()}
          />
          <TouchableOpacity onPress={() => doSearch()} className="px-3 py-1.5 rounded-lg bg-[#F7D56D]/20">
            <Text className="text-[#F7D56D] text-[12px] font-semibold">搜索</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text className="text-red-400 text-center my-4">{error}</Text> : null}

        {/* Product list */}
        {products.map((p, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => viewDetail(p.investmentId)}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-2"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-[16px] font-bold text-white">{p.name}</Text>
                <Text className="text-[12px] text-white/40">{p.platformName} · {GROUP_LABELS[p.productGroup] || p.productGroup}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[18px] font-bold text-emerald-400">{(parseFloat(p.rate) * 100).toFixed(2)}%</Text>
                <Text className="text-[11px] text-white/30">APY</Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[12px] text-white/40">TVL {formatUSD(p.tvl)}</Text>
              <ChevronRight size={14} color="white" opacity={0.3} />
            </View>
          </TouchableOpacity>
        ))}

        {!loading && products.length === 0 && (
          <View className="items-center mt-10">
            <DollarSign size={40} color="white" opacity={0.2} />
            <Text className="text-white/30 text-[14px] mt-3">搜索代币查看理财产品</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetail} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowDetail(false)}>
        <View className="flex-1 bg-[#0A0020]">
          <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-white/10">
            <Text className="text-[20px] font-bold text-white">产品详情</Text>
            <TouchableOpacity onPress={() => setShowDetail(false)} className="p-2">
              <X size={22} color="white" opacity={0.7} />
            </TouchableOpacity>
          </View>
          {detail && (
            <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
              <View className="bg-[#1A0633]/80 border border-[#8A3FFC]/40 rounded-2xl p-5 mb-4">
                <Text className="text-[22px] font-bold text-white mb-1">{detail.investmentName}</Text>
                <Text className="text-[13px] text-white/50">{detail.platformName} · {detail.network}</Text>
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                  <Text className="text-[11px] text-white/40 mb-1">{detail.rateTypeDesc}</Text>
                  <Text className="text-[20px] font-bold text-emerald-400">{(parseFloat(detail.rate) * 100).toFixed(2)}%</Text>
                </View>
                <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                  <Text className="text-[11px] text-white/40 mb-1">TVL</Text>
                  <Text className="text-[18px] font-bold text-white">{formatUSD(detail.tvl)}</Text>
                </View>
                <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                  <Text className="text-[11px] text-white/40 mb-1">状态</Text>
                  <Text className="text-[14px] font-bold text-[#F7D56D]">{detail.isInvestable ? "可投资" : "暂停"}</Text>
                </View>
              </View>

              {/* Rate breakdown */}
              {detail.rateDetails.length > 0 && (
                <View className="mb-4">
                  <Text className="text-[13px] font-semibold text-white/60 mb-2">收益明细</Text>
                  {detail.rateDetails.map((rd, i) => (
                    <View key={i} className="flex-row justify-between py-2 px-3 bg-white/5 rounded-lg mb-1">
                      <Text className="text-[13px] text-white/70">{rd.title}</Text>
                      <Text className="text-[13px] font-semibold text-emerald-400">{(parseFloat(rd.rate) * 100).toFixed(2)}%</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Underlying tokens */}
              {detail.underlyingToken.length > 0 && (
                <View className="mb-4">
                  <Text className="text-[13px] font-semibold text-white/60 mb-2">底层资产</Text>
                  {detail.underlyingToken.map((t, i) => (
                    <View key={i} className="flex-row items-center gap-2 py-2">
                      <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                        <Text className="text-[11px] font-bold text-white/80">{t.tokenSymbol.slice(0, 3)}</Text>
                      </View>
                      <Text className="text-white text-[14px]">{t.tokenSymbol}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Token info */}
              {detail.aboutToken.length > 0 && (
                <View className="mb-4">
                  <Text className="text-[13px] font-semibold text-white/60 mb-2">代币市场数据</Text>
                  {detail.aboutToken.map((t, i) => (
                    <View key={i} className="bg-white/5 rounded-lg p-3 mb-1">
                      <Text className="text-white font-bold text-[14px]">{t.tokenSymbol}</Text>
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-white/40 text-[12px]">价格 {t.price}</Text>
                        <Text className="text-white/40 text-[12px]">市值 {formatUSD(t.marketCap)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
