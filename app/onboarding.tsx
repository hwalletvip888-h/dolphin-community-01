import { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, NativeScrollEvent, NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Shield, Smartphone, Key, EyeOff, Sparkles,
  ChevronRight, ArrowRight,
} from "lucide-react-native";

const { width: W } = Dimensions.get("window");

interface Card {
  icon: React.FC<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  points: { icon: React.FC<{ size: number; color: string }>; text: string }[];
  action: string;
  route?: string;
}

const CARDS: Card[] = [
  {
    icon: Shield,
    title: "H Wallet",
    subtitle: "基于 OKX Agentic Wallet\nTEE 安全签名",
    points: [
      { icon: Key, text: "私钥永不离开可信执行环境 (TEE)" },
      { icon: EyeOff, text: "平台与 AI 均无法接触或获知私钥" },
      { icon: Smartphone, text: "钱包仅限本机操作，离开此设备即失效" },
    ],
    action: "了解安全机制",
  },
  {
    icon: Sparkles,
    title: "AI Agent",
    subtitle: "一句话，AI 帮你完成\n行情分析、策略生成",
    points: [
      { icon: Sparkles, text: "6 位专业 AI 顾问，各有所长" },
      { icon: Sparkles, text: "AI 只做分析和建议，不擅自执行交易" },
      { icon: Smartphone, text: "所有敏感操作需你亲自确认" },
    ],
    action: "挑选 Agent",
    route: "/(tabs)/agents",
  },
  {
    icon: Shield,
    title: "资产安全",
    subtitle: "OKX 守护\n你对自己的资产拥有完整控制权",
    points: [
      { icon: Key, text: "邮箱即钱包，无需管理助记词" },
      { icon: EyeOff, text: "AI 无法代你转账或交易" },
      { icon: Smartphone, text: "交易签名仅在设备 TEE 内完成" },
    ],
    action: "挑选 Agent",
    route: "/(tabs)/agents",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setPage(idx);
  };

  const handleNext = (route?: string) => {
    if (route) {
      router.replace(route as any);
    } else if (page < CARDS.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * W, animated: true });
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  const card = CARDS[page];
  const isLast = page === CARDS.length - 1;

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.dots}>
          {CARDS.map((_, i) => (
            <View key={i} style={[s.dot, i === page && s.dotActive]} />
          ))}
        </View>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip} style={s.skipBtn}>
            <Text style={s.skipText}>跳过</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Swipeable cards */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={s.scroll}
      >
        {CARDS.map((c, i) => (
          <View key={i} style={[s.page, { width: W }]}>
            {/* Icon */}
            <View style={s.iconWrap}>
              <c.icon size={48} color="#F7D56D" />
            </View>

            {/* Title */}
            <Text style={s.title}>{c.title}</Text>
            <Text style={s.subtitle}>{c.subtitle}</Text>

            {/* Points */}
            <View style={s.points}>
              {c.points.map((p, j) => (
                <View key={j} style={s.point}>
                  <View style={s.pointIcon}>
                    <p.icon size={16} color="#C063FF" />
                  </View>
                  <Text style={s.pointText}>{p.text}</Text>
                </View>
              ))}
            </View>

            {/* Footer quote */}
            <View style={s.footer}>
              <Text style={s.footerText}>
                {i === 0
                  ? "资产安全由 OKX TEE 技术保障"
                  : i === 1
                  ? "AI 是你的顾问，不是你的托管人"
                  : "挑选你的第一位 AI 顾问"}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom button */}
      <View style={s.bottom}>
        <TouchableOpacity
          style={s.btn}
          onPress={() => handleNext(card.route)}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>{isLast ? "进入海豚社区" : card.action}</Text>
          <ArrowRight size={18} color="#090012" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingTop: 60, paddingHorizontal: 20, height: 100,
    position: "relative",
  },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.15)" },
  dotActive: { width: 24, backgroundColor: "#F7D56D" },
  skipBtn: { position: "absolute", right: 20, top: 60 },
  skipText: { fontSize: 14, color: "rgba(255,255,255,0.4)" },

  scroll: { flex: 1 },
  page: { flex: 1, paddingHorizontal: 32, alignItems: "center", justifyContent: "center", paddingBottom: 40 },

  // Icon
  iconWrap: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: "rgba(247,213,109,0.08)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 32,
  },

  // Title
  title: { fontSize: 32, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 24, marginBottom: 40 },

  // Points
  points: { width: "100%", gap: 16, marginBottom: 40 },
  point: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  pointIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(192,99,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  pointText: { flex: 1, fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 22, paddingTop: 4 },

  // Footer
  footer: {
    backgroundColor: "rgba(35,10,62,0.5)", borderRadius: 16,
    borderWidth: 0.5, borderColor: "rgba(192,99,255,0.15)",
    paddingVertical: 14, paddingHorizontal: 20, width: "100%",
    alignItems: "center",
  },
  footerText: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" },

  // Bottom button
  bottom: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#F7D56D", borderRadius: 16,
    paddingVertical: 16,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#090012" },
});
