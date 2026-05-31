import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, RefreshControl, ActivityIndicator as RNActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  Copy, Check, Clock, ShieldAlert, Search, X, RefreshCw, History, TrendingUp,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { API_BASE } from "@/src/lib/api";
import { useWalletStore, TokenItem, TxRecord } from "@/src/stores/wallet-store";

// ── Helpers ─────────────────────────────────────────────

function fmtUSD(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!n) return "$0.00";
  if (n > 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n > 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtTime(ts: string): string {
  const diff = Date.now() - parseInt(ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return `${Math.floor(hrs / 24)}天前`;
}

const SUGGESTED_CHAINS = "1,10,56,137,196,324,8453,42161,43114,501";

// ── Modal wrapper ────────────────────────────────────────

function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0A0020]">
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-white/10">
          <Text className="text-[20px] font-bold text-white">{title}</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={22} color="white" opacity={0.7} />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Deposit Sheet ────────────────────────────────────────

function DepositSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { evmAddress, solAddress, fetchAddresses, addresses } = useWalletStore();
  const [copied, setCopied] = useState("");

  useEffect(() => { if (visible) fetchAddresses(); }, [visible]);

  const copy = async (addr: string, label: string) => {
    await Clipboard.setStringAsync(addr);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const allAddresses = [
    { chain: "EVM", address: evmAddress },
    { chain: "Solana", address: solAddress },
    ...addresses.filter(a => a.address !== evmAddress && a.address !== solAddress),
  ].filter(a => a.address);

  return (
    <Sheet visible={visible} onClose={onClose} title="接收资产">
      <Text className="text-white/50 text-[13px] mb-4">将资产发送到以下地址，确认网络后再操作</Text>
      {allAddresses.map((a, i) => (
        <View key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
          <Text className="text-[14px] font-bold text-white mb-2">{a.chain}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-[12px] text-white/70 bg-black/30 rounded-lg px-3 py-2.5 font-mono" numberOfLines={1}>{a.address}</Text>
            <TouchableOpacity
              onPress={() => copy(a.address, a.chain)}
              className="px-4 py-2.5 rounded-lg bg-[#F7D56D]/20"
            >
              {copied === a.chain ? (
                <Check size={16} color="#34D399" />
              ) : (
                <Copy size={16} color="#F7D56D" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </Sheet>
  );
}

// ── Withdraw Sheet ───────────────────────────────────────

function WithdrawSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tokens, sendToken, fetchWallet } = useWalletStore();
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenItem | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  const handleSend = async () => {
    if (!toAddr.trim() || !amount || !selectedToken) return;
    setSending(true);
    const chainMap: Record<string, number> = { "1": 1, "10": 10, "56": 56, "137": 137, "196": 196, "324": 324, "8453": 8453, "42161": 42161, "43114": 43114, "501": 501 };
    const msg = await sendToken(toAddr.trim(), amount, selectedToken.symbol, chainMap[selectedToken.chain] || 196);
    setResult(msg);
    setSending(false);
    if (msg === "发送成功") { setToAddr(""); setAmount(""); fetchWallet(); }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="提币">
      {/* Token selector */}
      <Text className="text-[12px] text-white/40 mb-2">选择资产</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
        {tokens.map((t, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSelectedToken(t)}
            className={`px-4 py-2 rounded-xl border ${selectedToken?.symbol === t.symbol ? "bg-[#F7D56D]/20 border-[#F7D56D]" : "bg-white/5 border-white/10"}`}
          >
            <Text className={`text-[13px] font-semibold ${selectedToken?.symbol === t.symbol ? "text-[#F7D56D]" : "text-white/60"}`}>{t.symbol}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedToken && (
        <>
          <Text className="text-[12px] text-white/40 mb-2">余额: {selectedToken.balance} {selectedToken.symbol}</Text>
          <TextInput
            value={toAddr} onChangeText={setToAddr}
            placeholder="接收方地址"
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white mb-3"
          />
          <TextInput
            value={amount} onChangeText={setAmount}
            placeholder="金额"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="decimal-pad"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white mb-4"
          />
          <TouchableOpacity
            disabled={!toAddr.trim() || !amount || sending}
            onPress={handleSend}
            className="w-full py-3.5 rounded-xl bg-[#F7D56D] disabled:opacity-30 items-center"
          >
            <Text className="text-[#090012] text-[15px] font-bold">{sending ? "提交中..." : "确认提币"}</Text>
          </TouchableOpacity>
          {result ? (
            <Text className={`text-center mt-3 text-[13px] ${result === "发送成功" ? "text-emerald-400" : "text-red-400"}`}>{result}</Text>
          ) : null}
        </>
      )}
    </Sheet>
  );
}

// ── Swap Sheet ───────────────────────────────────────────

function SwapSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tokens } = useWalletStore();
  const [fromToken, setFromToken] = useState<TokenItem | null>(null);
  const [toToken, setToToken] = useState<TokenItem | null>(null);
  const [amount, setAmount] = useState("");
  const [quoteResult, setQuoteResult] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  const getQuote = async () => {
    if (!fromToken || !toToken || !amount) return;
    setQuoting(true);
    try {
      const r = await fetch(`${API_BASE}/api/dex`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quote",
          chainIndex: fromToken.chain,
          fromTokenAddress: fromToken.address,
          toTokenAddress: toToken.address,
          amount,
          slippage: "0.005",
          feePercent: "0.3",
        }),
      });
      const d = await r.json();
      if (d.ok && d.quote) {
        setQuoteResult(`预计获得 ${d.quote.toTokenAmount} ${toToken.symbol} · 路由: ${d.quote.dexRouterList?.map((x: { name: string }) => x.name).join(", ") || "OKX DEX"}`);
      } else {
        setQuoteResult("报价失败: " + (d.message || "未知错误"));
      }
    } catch {
      setQuoteResult("网络异常");
    }
    setQuoting(false);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="兑换代币">
      {/* From token */}
      <Text className="text-[12px] text-white/40 mb-2">支付</Text>
      <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2">
        <TextInput
          value={amount} onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="decimal-pad"
          className="flex-1 text-[18px] text-white font-bold"
        />
        <TokenPicker tokens={tokens} selected={fromToken} onSelect={setFromToken} />
      </View>
      {fromToken && <Text className="text-[11px] text-white/30 mb-3">余额: {fromToken.balance}</Text>}

      {/* Arrow */}
      <View className="items-center my-2">
        <ArrowLeftRight size={18} color="white" opacity={0.3} />
      </View>

      {/* To token */}
      <Text className="text-[12px] text-white/40 mb-2">获得</Text>
      <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3">
        <Text className="flex-1 text-[18px] text-white/40 font-bold">
          {quoteResult ? quoteResult.match(/预计获得 (\S+)/)?.[1] || "—" : "—"}
        </Text>
        <TokenPicker tokens={tokens} selected={toToken} onSelect={setToToken} />
      </View>

      {/* Quote button */}
      <TouchableOpacity
        disabled={!fromToken || !toToken || !amount || quoting}
        onPress={getQuote}
        className="w-full py-3 rounded-xl bg-white/10 border border-white/10 disabled:opacity-30 items-center mb-3"
      >
        <Text className="text-white text-[14px] font-semibold">{quoting ? "询价中..." : "获取报价"}</Text>
      </TouchableOpacity>

      {quoteResult && (
        <View className="bg-white/5 rounded-xl p-3 mb-3">
          <Text className="text-[12px] text-white/70">{quoteResult}</Text>
        </View>
      )}

      <TouchableOpacity
        disabled={!quoteResult || quoting}
        onPress={() => {}}
        className="w-full py-3.5 rounded-xl bg-[#F7D56D] disabled:opacity-30 items-center"
      >
        <Text className="text-[#090012] text-[15px] font-bold">确认兑换</Text>
      </TouchableOpacity>
      <Text className="text-[10px] text-white/30 text-center mt-2">通过 OKX DEX 聚合器执行 · 含 0.3% 返佣</Text>
    </Sheet>
  );
}

function TokenPicker({ tokens, selected, onSelect }: { tokens: TokenItem[]; selected: TokenItem | null; onSelect: (t: TokenItem) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(!open)} className="bg-white/10 px-3 py-1.5 rounded-lg">
        <Text className="text-[13px] font-semibold text-white">{selected?.symbol || "选择"}</Text>
      </TouchableOpacity>
      {open && (
        <View className="absolute top-full right-0 mt-1 bg-[#1A0633] border border-white/10 rounded-xl w-32 max-h-40 z-50">
          <ScrollView>
            {tokens.map((t, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { onSelect(t); setOpen(false); }}
                className="px-3 py-2 border-b border-white/5"
              >
                <Text className="text-[13px] text-white">{t.symbol}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ── Lookup Sheet ─────────────────────────────────────────

function LookupSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { lookupAddress } = useWalletStore();
  const [searchAddr, setSearchAddr] = useState("");
  const [results, setResults] = useState<TokenItem[]>([]);
  const [totalVal, setTotalVal] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!searchAddr.trim()) return;
    setSearching(true);
    setSearched(true);
    const tokens = await lookupAddress(searchAddr.trim(), SUGGESTED_CHAINS);
    setResults(tokens);
    const sum = tokens.reduce((s, t) => s + parseFloat(t.value || "0"), 0);
    setTotalVal(fmtUSD(sum));
    setSearching(false);
  };

  return (
    <Sheet visible={visible} onClose={() => { onClose(); setSearched(false); setResults([]); }} title="地址查资产">
      <Text className="text-white/50 text-[13px] mb-4">输入任意链上地址，查看多链持仓</Text>
      <View className="flex-row gap-2 mb-4">
        <TextInput
          value={searchAddr} onChangeText={setSearchAddr}
          placeholder="输入地址 0x... / Solana..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white"
          onSubmitEditing={search}
        />
        <TouchableOpacity
          onPress={search}
          disabled={searching || !searchAddr.trim()}
          className="px-4 py-3 rounded-xl bg-[#F7D56D] disabled:opacity-30 items-center justify-center"
        >
          <Search size={18} color="#090012" />
        </TouchableOpacity>
      </View>

      {searching && <RNActivityIndicator color="#F7D56D" className="my-8" />}

      {searched && !searching && results.length === 0 && (
        <Text className="text-white/40 text-center mt-8">未找到资产或地址无效</Text>
      )}

      {results.length > 0 && (
        <>
          <View className="bg-[#1A0633]/80 border border-[#8A3FFC]/40 rounded-2xl p-4 mb-4">
            <Text className="text-white/50 text-[12px]">地址总资产</Text>
            <Text className="text-[28px] font-black text-white">{totalVal}</Text>
            <Text className="text-white/30 text-[10px] mt-1 font-mono">{searchAddr.slice(0, 12)}...{searchAddr.slice(-8)}</Text>
          </View>
          {results.map((t, i) => (
            <View key={i} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-bold">{t.symbol}</Text>
                  {t.isRiskToken && (
                    <View className="bg-red-500/20 px-1.5 py-0.5 rounded">
                      <Text className="text-[9px] font-bold text-red-400">风险</Text>
                    </View>
                  )}
                </View>
                <Text className="text-white/40 text-[12px]">{t.balance}</Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-bold">{fmtUSD(t.value)}</Text>
                <Text className="text-white/30 text-[11px]">链 {t.chain}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </Sheet>
  );
}

// ── Tx History Sheet ─────────────────────────────────────

function TxHistorySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { transactions, txLoading, fetchTxHistory, evmAddress } = useWalletStore();
  useEffect(() => { if (visible && evmAddress) fetchTxHistory(evmAddress); }, [visible, evmAddress]);

  return (
    <Sheet visible={visible} onClose={onClose} title="交易记录">
      {txLoading ? (
        <RNActivityIndicator color="#F7D56D" className="mt-12" />
      ) : transactions.length === 0 ? (
        <View className="items-center mt-12">
          <History size={40} color="white" opacity={0.3} />
          <Text className="text-white/40 text-[14px] mt-3">暂无交易记录</Text>
        </View>
      ) : (
        transactions.map((tx, i) => (
          <TxRow key={i} tx={tx} />
        ))
      )}
    </Sheet>
  );
}

function TxRow({ tx }: { tx: TxRecord }) {
  const isSuccess = tx.txStatus === "success";
  const isPending = tx.txStatus === "pending";
  const isOutgoing = tx.from?.length > 0 && tx.from[0]?.address !== tx.to?.[0]?.address;
  return (
    <View className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          {isSuccess ? (
            <Check size={14} color="#34D399" />
          ) : isPending ? (
            <Clock size={14} color="#FBBF24" />
          ) : (
            <X size={14} color="#F87171" />
          )}
          <Text className="text-[13px] font-bold text-white">{tx.symbol || "Transfer"}</Text>
          {tx.hitBlacklist && (
            <View className="bg-red-500/20 px-1.5 py-0.5 rounded">
              <Text className="text-[9px] font-bold text-red-400">风险</Text>
            </View>
          )}
        </View>
        <Text className={`text-[11px] font-medium ${isSuccess ? "text-emerald-400" : isPending ? "text-amber-400" : "text-red-400"}`}>
          {isSuccess ? "成功" : isPending ? "待确认" : "失败"}
        </Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-[11px] text-white/40">{fmtTime(tx.txTime)} · 链 {tx.chainIndex}</Text>
        <Text className="text-[12px] text-white/60 font-mono" numberOfLines={1}>
          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────

export default function WalletScreen() {
  const router = useRouter();
  const { total, tokens, loggedIn, loading, fetchWallet, evmAddress } = useWalletStore();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchWallet(evmAddress || undefined); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWallet(evmAddress || undefined);
    setRefreshing(false);
  }, [evmAddress]);

  if (!loggedIn) {
    return (
      <View className="flex-1 bg-[#050015] items-center justify-center px-8">
        <Wallet size={48} color="#8A3FFC" />
        <Text className="text-white text-[20px] font-bold mt-4">钱包</Text>
        <Text className="text-white/50 text-[14px] mt-2 text-center">请先在对话页面登录钱包</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050015]">
      <ScrollView
        className="flex-1 px-5 pt-14"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F7D56D" />}
      >
        <Text className="text-[28px] font-black text-[#F7D56D] mb-6">钱包</Text>

        {/* Balance Card */}
        <View className="bg-[#1A0633]/80 border border-[#8A3FFC]/40 rounded-[24px] p-6 mb-4">
          <Text className="text-white/50 text-[13px]">总资产</Text>
          <Text className="text-[36px] font-black text-white mt-1">
            {loading ? "..." : fmtUSD(total)}
          </Text>
        </View>

        {/* Main Actions */}
        <View className="flex-row gap-3 mb-3">
          <ActionButton icon={<ArrowDownToLine size={22} color="#34D399" />} label="充币" color="#34D399" onPress={() => setShowDeposit(true)} />
          <ActionButton icon={<ArrowUpFromLine size={22} color="#F87171" />} label="提币" color="#F87171" onPress={() => setShowWithdraw(true)} />
          <ActionButton icon={<ArrowLeftRight size={22} color="#F7D56D" />} label="兑换" color="#F7D56D" onPress={() => setShowSwap(true)} />
        </View>

        {/* Secondary Actions */}
        <View className="flex-row gap-3 mb-6">
          <ActionButton icon={<Search size={20} color="white" opacity={0.6} />} label="查地址" onPress={() => setShowLookup(true)} />
          <ActionButton icon={<History size={20} color="white" opacity={0.6} />} label="记录" onPress={() => setShowHistory(true)} />
          <ActionButton icon={<TrendingUp size={20} color="white" opacity={0.6} />} label="理财" onPress={() => router.push("/(app)/defi" as any)} />
        </View>

        {/* Token List */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white/70 text-[14px] font-bold">资产列表</Text>
          <Text className="text-white/30 text-[11px]">{tokens.length} 个代币</Text>
        </View>
        {tokens.map((t, i) => (
          <View key={`${t.symbol}-${i}`} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 mb-2 flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center">
                  <Text className="text-[12px] font-bold text-white/80">{t.symbol.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-bold text-[15px]">{t.symbol}</Text>
                    {t.isRiskToken && (
                      <View className="bg-red-500/20 px-1.5 py-0.5 rounded">
                        <Text className="text-[9px] font-bold text-red-400">风险</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white/40 text-[12px]">链 {t.chain}</Text>
                </View>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-white font-bold text-[15px]">{t.balance}</Text>
              <Text className="text-white/40 text-[12px]">{fmtUSD(t.value)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Sheets */}
      <DepositSheet visible={showDeposit} onClose={() => setShowDeposit(false)} />
      <WithdrawSheet visible={showWithdraw} onClose={() => setShowWithdraw(false)} />
      <SwapSheet visible={showSwap} onClose={() => setShowSwap(false)} />
      <LookupSheet visible={showLookup} onClose={() => setShowLookup(false)} />
      <TxHistorySheet visible={showHistory} onClose={() => setShowHistory(false)} />
    </View>
  );
}

function ActionButton({ icon, label, color, onPress }: { icon: React.ReactNode; label: string; color?: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 h-[56px] bg-white/5 border border-white/10 rounded-2xl items-center justify-center gap-1"
      style={color ? { borderColor: `${color}30` } : undefined}
    >
      {icon}
      <Text className="text-white/50 text-[11px] font-medium">{label}</Text>
    </TouchableOpacity>
  );
}
