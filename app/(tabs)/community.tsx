import { useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { Users, TrendingUp, MessageCircle, Trophy, ArrowRight } from "lucide-react-native";

const { width: W } = Dimensions.get("window");

const BANNERS = [
  { title: "海豚社区正式上线", subtitle: "AI Agent 驱动的 Web3 社区", color: "#C063FF", bg: "rgba(192,99,255,0.1)" },
  { title: "世界杯竞猜开启", subtitle: "AI 预言帝帮你分析赔率", color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  { title: "新手任务领奖励", subtitle: "完成引导获得社区积分", color: "#34D399", bg: "rgba(52,211,153,0.1)" },
];

const FEEDS = [
  { icon: MessageCircle, title: "讨论区", desc: "交流策略与心得", color: "#C084FC" },
  { icon: TrendingUp, title: "策略广场", desc: "分享你的交易策略", color: "#F7D56D" },
  { icon: Trophy, title: "排行榜", desc: "交易大赛 & 邀请榜", color: "#FB923C" },
  { icon: Users, title: "群组", desc: "加入兴趣小组", color: "#38BDF8" },
];

const POSTS = [
  { user: "CryptoWhale", content: "BTC 这波突破 $88K，诸葛策略给的信号很准！", likes: 42, time: "2h" },
  { user: "DeFi_Degen", content: "链上猎手发现的 PEPE 地址今天又拉了 15%，跟单稳", likes: 28, time: "5h" },
  { user: "Newbie_001", content: "小海豚教我完成了第一次 DEX 兑换，太简单了！", likes: 15, time: "8h" },
];

export default function CommunityScreen() {
  const router = useRouter();
  const [bannerIdx, setBannerIdx] = useState(0);
  const carRef = useRef<ScrollView>(null);

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setBannerIdx(Math.round(e.nativeEvent.contentOffset.x / (W - 40)));
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>海豚社区</Text>
        <Text style={s.sub}>Dolphin Community</Text>
      </View>

      {/* Banner carousel */}
      <ScrollView
        ref={carRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleBannerScroll}
        style={s.carousel}
        snapToInterval={W - 40}
        snapToAlignment="center"
        decelerationRate="fast"
      >
        {BANNERS.map((b, i) => (
          <View key={i} style={[s.banner, { width: W - 40, backgroundColor: b.bg, borderColor: b.color + "30" }]}>
            <Text style={[s.bannerTitle, { color: b.color }]}>{b.title}</Text>
            <Text style={s.bannerSub}>{b.subtitle}</Text>
          </View>
        ))}
      </ScrollView>
      {/* Banner dots */}
      <View style={s.dots}>
        {BANNERS.map((_, i) => (
          <View key={i} style={[s.dot, i === bannerIdx && s.dotActive]} />
        ))}
      </View>

      {/* Community feeds */}
      <Text style={s.sectionTitle}>社区板块</Text>
      <View style={s.feeds}>
        {FEEDS.map((f) => (
          <TouchableOpacity key={f.title} style={s.feedCard} activeOpacity={0.7}>
            <View style={[s.feedIcon, { backgroundColor: f.color + "15" }]}>
              <f.icon size={22} color={f.color} />
            </View>
            <Text style={s.feedLabel}>{f.title}</Text>
            <Text style={s.feedDesc}>{f.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent posts */}
      <Text style={s.sectionTitle}>最新动态</Text>
      {POSTS.map((p, i) => (
        <View key={i} style={[s.post, i < POSTS.length - 1 && { borderBottomWidth: 0.5, borderColor: "rgba(255,255,255,0.05)", paddingBottom: 12, marginBottom: 12 }]}>
          <View style={s.postHeader}>
            <View style={s.postAvatar}>
              <Text style={s.postAvatarTxt}>{p.user[0]}</Text>
            </View>
            <Text style={s.postUser}>{p.user}</Text>
            <Text style={s.postTime}>{p.time}前</Text>
          </View>
          <Text style={s.postContent}>{p.content}</Text>
          <View style={s.postFooter}>
            <Text style={s.postLikes}>❤ {p.likes}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  content: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "900", color: "#C063FF", letterSpacing: 3 },
  sub: { fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 4, marginTop: 2 },

  // Banner
  carousel: { marginBottom: 10 },
  banner: { borderRadius: 20, borderWidth: 0.5, padding: 28, marginRight: 12, justifyContent: "center", minHeight: 120 },
  bannerTitle: { fontSize: 20, fontWeight: "900", marginBottom: 6 },
  bannerSub: { fontSize: 14, color: "rgba(255,255,255,0.5)" },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 24 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.12)" },
  dotActive: { width: 18, backgroundColor: "#F7D56D" },

  // Sections
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 12 },

  // Feeds
  feeds: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  feedCard: {
    width: "47%", backgroundColor: "rgba(35,10,62,0.4)", borderRadius: 16,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.1)",
    padding: 16, alignItems: "center", gap: 6,
  },
  feedIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  feedLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
  feedDesc: { fontSize: 11, color: "rgba(255,255,255,0.35)" },

  // Posts
  post: {},
  postHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  postAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(192,99,255,0.2)", alignItems: "center", justifyContent: "center" },
  postAvatarTxt: { fontSize: 12, fontWeight: "700", color: "#C063FF" },
  postUser: { fontSize: 13, fontWeight: "600", color: "#fff" },
  postTime: { fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: "auto" },
  postContent: { fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 20, marginBottom: 8 },
  postFooter: { flexDirection: "row" },
  postLikes: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
});
