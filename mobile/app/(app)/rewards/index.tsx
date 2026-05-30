import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { Trophy, Gift, TrendingUp, Share2, Copy, Check, Medal } from "lucide-react-native";
import { API_BASE, authHeaders } from "@/src/lib/api";
import * as Clipboard from "expo-clipboard";

interface LeaderboardEntry {
  user_id: string;
  invite_count: number;
  total_rewards: number;
}

interface RewardItem {
  id: number;
  type: string;
  amount: string;
  token: string;
  status: string;
  created_at: string;
}

interface CampaignItem {
  id: number;
  title: string;
  description: string;
  reward_type: string;
  reward_amount: string;
  start_at: string;
  end_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  invite: "邀请奖励",
  checkin: "签到奖励",
  campaign: "活动奖励",
  airdrop: "空投",
};

export default function RewardsScreen() {
  const [tab, setTab] = useState<"leaderboard" | "campaigns" | "my">("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [myRewards, setMyRewards] = useState<RewardItem[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteStats, setInviteStats] = useState({ totalInvites: 0, totalRewards: 0 });
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const h = await authHeaders();
      const [lbRes, campRes, rewardRes, codeRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/referral`, { method: "POST", headers: h, body: JSON.stringify({ action: "leaderboard" }) }),
        fetch(`${API_BASE}/api/referral`, { method: "POST", headers: h, body: JSON.stringify({ action: "campaigns" }) }),
        fetch(`${API_BASE}/api/referral`, { method: "POST", headers: h, body: JSON.stringify({ action: "myRewards" }) }),
        fetch(`${API_BASE}/api/referral`, { method: "POST", headers: h, body: JSON.stringify({ action: "generateCode" }) }),
        fetch(`${API_BASE}/api/referral`, { method: "POST", headers: h, body: JSON.stringify({ action: "stats" }) }),
      ]);
      const [lb, camp, rewards, code, stats] = await Promise.all([lbRes.json(), campRes.json(), rewardRes.json(), codeRes.json(), statsRes.json()]);
      if (lb.ok) setLeaderboard(lb.leaderboard || []);
      if (camp.ok) setCampaigns(camp.campaigns || []);
      if (rewards.ok) setMyRewards(rewards.rewards || []);
      if (code.ok) setInviteCode(code.code || "");
      if (stats.ok) setInviteStats({ totalInvites: stats.totalInvites || 0, totalRewards: stats.totalRewards || 0 });
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const copyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="flex-1 bg-[#050015]">
      <ScrollView
        className="flex-1 px-5 pt-14"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); }} tintColor="#F7D56D" />}
      >
        <Text className="text-[28px] font-black text-[#F7D56D] mb-6">派奖福星</Text>

        {/* Invite card */}
        <View className="bg-[#1A0633]/80 border border-[#FB923C]/30 rounded-2xl p-5 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Share2 size={18} color="#FB923C" />
            <Text className="text-[16px] font-bold text-white">邀请好友</Text>
          </View>
          <Text className="text-[13px] text-white/60 mb-3">
            每邀请一位好友，双方各得 USDT 奖励。邀请越多，奖励越多。
          </Text>
          {inviteCode ? (
            <TouchableOpacity onPress={copyCode} className="flex-row items-center justify-between bg-black/30 rounded-xl px-4 py-3">
              <Text className="text-[16px] font-bold text-[#FB923C] font-mono">{inviteCode}</Text>
              {copied ? <Check size={18} color="#34D399" /> : <Copy size={18} color="#FB923C" />}
            </TouchableOpacity>
          ) : (
            <Text className="text-white/30 text-[13px]">登录后获取邀请码</Text>
          )}
          <View className="flex-row mt-3 gap-4">
            <Text className="text-white/40 text-[12px]">已邀请 {inviteStats.totalInvites} 人</Text>
            <Text className="text-white/40 text-[12px]">累计奖励 {inviteStats.totalRewards} USDT</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View className="flex-row mb-4 bg-white/5 rounded-xl p-1">
          {(["leaderboard", "campaigns", "my"] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} className={`flex-1 py-2 rounded-lg items-center ${tab === t ? "bg-[#F7D56D]/20" : ""}`}>
              <Text className={`text-[13px] font-semibold ${tab === t ? "text-[#F7D56D]" : "text-white/40"}`}>
                {t === "leaderboard" ? "排行榜" : t === "campaigns" ? "活动" : "我的奖励"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard */}
        {tab === "leaderboard" && (
          <View>
            {leaderboard.map((entry, i) => (
              <View key={i} className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2">
                <View className="w-8 items-center">
                  {i === 0 ? <Medal size={20} color="#F7D56D" /> :
                   i === 1 ? <Medal size={20} color="#9CA3AF" /> :
                   i === 2 ? <Medal size={20} color="#D97706" /> :
                   <Text className="text-white/40 font-bold text-[14px]">{i + 1}</Text>}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-bold text-[14px]">{entry.user_id.slice(0, 8)}...</Text>
                  <Text className="text-white/40 text-[11px]">邀请了 {entry.invite_count} 人</Text>
                </View>
                <Text className="text-[#F7D56D] font-bold text-[14px]">{entry.total_rewards} USDT</Text>
              </View>
            ))}
            {leaderboard.length === 0 && !loading && (
              <Text className="text-white/30 text-center mt-6">暂无排行数据</Text>
            )}
          </View>
        )}

        {/* Campaigns */}
        {tab === "campaigns" && (
          <View>
            {campaigns.map((c) => (
              <View key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center gap-2 mb-1.5">
                  <Gift size={16} color="#F7D56D" />
                  <Text className="text-[15px] font-bold text-white">{c.title}</Text>
                </View>
                <Text className="text-[13px] text-white/60 mb-2">{c.description}</Text>
                <View className="flex-row justify-between">
                  <Text className="text-[12px] text-[#F7D56D] font-semibold">奖励 {c.reward_amount} {c.reward_type}</Text>
                  <Text className="text-[11px] text-white/30">{new Date(c.end_at).toLocaleDateString("zh-CN")} 截止</Text>
                </View>
              </View>
            ))}
            {campaigns.length === 0 && (
              <Text className="text-white/30 text-center mt-6">暂无进行中的活动</Text>
            )}
          </View>
        )}

        {/* My rewards */}
        {tab === "my" && (
          <View>
            {myRewards.map((r) => (
              <View key={r.id} className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2">
                <Gift size={16} color={r.status === "claimed" ? "#34D399" : "#FBBF24"} />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-bold text-[14px]">{TYPE_LABELS[r.type] || r.type}</Text>
                  <Text className="text-white/40 text-[11px]">{new Date(r.created_at).toLocaleDateString("zh-CN")}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[#F7D56D] font-bold text-[14px]">{r.amount} {r.token}</Text>
                  <Text className={`text-[11px] font-medium ${r.status === "claimed" ? "text-emerald-400" : "text-amber-400"}`}>
                    {r.status === "claimed" ? "已领取" : "待领取"}
                  </Text>
                </View>
              </View>
            ))}
            {myRewards.length === 0 && (
              <Text className="text-white/30 text-center mt-6">暂无奖励记录</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
