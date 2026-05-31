import { useState, useRef, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { Lock, ArrowRight, MessageSquare, Zap } from "lucide-react-native";
import { AGENTS } from "@/src/data/agents";
import { useAuth } from "@/src/stores/auth";

const { width: W } = Dimensions.get("window");

export default function AgentsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { level } = useAuth();

  const userLevel = useMemo(() => level || 1, [level]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / W));
  };

  const agent = AGENTS[page];
  const unlocked = userLevel >= agent.unlockLevel;

  const handleStart = () => {
    if (!unlocked) return;
    router.push(`/chat/${agent.id}`);
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>选择你的 AI Agent</Text>
        <Text style={s.headerSub}>左右滑动浏览 · 解锁更多能力</Text>

        {/* Level indicator */}
        <View style={s.levelBadge}>
          <Zap size={13} color="#F7D56D" />
          <Text style={s.levelText}>Lv.{userLevel}</Text>
        </View>

        {/* Dots */}
        <View style={s.dots}>
          {AGENTS.map((a, i) => (
            <View
              key={a.id}
              style={[
                s.dot,
                i === page && s.dotActive,
                a.unlockLevel > userLevel && s.dotLocked,
              ]}
            />
          ))}
        </View>
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
        decelerationRate="fast"
        snapToInterval={W}
        snapToAlignment="center"
      >
        {AGENTS.map((a) => {
          const isUnlocked = userLevel >= a.unlockLevel;
          return (
            <View key={a.id} style={[s.cardPage, { width: W }]}>
              <View style={[s.card, { borderColor: isUnlocked ? a.color + "30" : "rgba(255,255,255,0.08)" }]}>
                {/* Lock overlay */}
                {!isUnlocked && (
                  <View style={s.lockOverlay}>
                    <View style={s.lockBadge}>
                      <Lock size={18} color="#F7D56D" />
                      <Text style={s.lockBadgeText}>Lv.{a.unlockLevel} 解锁</Text>
                    </View>
                  </View>
                )}

                {/* Avatar */}
                <View style={[s.avatarRing, { borderColor: isUnlocked ? a.color + "25" : "rgba(255,255,255,0.06)" }]}>
                  <View style={[s.avatar, { borderColor: isUnlocked ? a.color : "rgba(255,255,255,0.15)" }, !isUnlocked && { opacity: 0.4 }]}>
                    <Text style={[s.avatarTxt, { color: isUnlocked ? a.color : "rgba(255,255,255,0.3)" }]}>{a.name[0]}</Text>
                  </View>
                </View>

                {/* Name & title */}
                <Text style={[s.name, !isUnlocked && { color: "rgba(255,255,255,0.3)" }]}>{a.name}</Text>
                <View style={[s.badge, { backgroundColor: isUnlocked ? a.color + "18" : "rgba(255,255,255,0.04)" }]}>
                  <Text style={[s.badgeTxt, { color: isUnlocked ? a.color : "rgba(255,255,255,0.3)" }]}>{a.title}</Text>
                </View>
                <Text style={[s.quote, !isUnlocked && { color: "rgba(255,255,255,0.2)" }]}>「{a.quote}」</Text>

                {/* Description */}
                <Text style={[s.desc, !isUnlocked && { color: "rgba(255,255,255,0.2)" }]}>{a.desc}</Text>

                {/* Skills */}
                <View style={s.skills}>
                  {a.skills.map((sk) => (
                    <View key={sk} style={[s.skill, { borderColor: isUnlocked ? a.color + "20" : "rgba(255,255,255,0.05)" }]}>
                      <Text style={[s.skillTxt, { color: isUnlocked ? a.color : "rgba(255,255,255,0.25)" }]}>{sk}</Text>
                    </View>
                  ))}
                </View>

                {/* Welcome */}
                <View style={[s.welcomeBubble, !isUnlocked && { opacity: 0.3 }]}>
                  <MessageSquare size={14} color={isUnlocked ? a.color : "rgba(255,255,255,0.2)"} />
                  <Text style={[s.welcomeText, !isUnlocked && { color: "rgba(255,255,255,0.2)" }]} numberOfLines={2}>{a.welcome}</Text>
                </View>
              </View>

              {/* Action button */}
              {isUnlocked ? (
                <TouchableOpacity
                  style={[s.startBtn, { backgroundColor: a.color }]}
                  onPress={handleStart}
                  activeOpacity={0.8}
                >
                  <Text style={s.startBtnText}>开启专属对话</Text>
                  <ArrowRight size={18} color="#090012" />
                </TouchableOpacity>
              ) : (
                <View style={s.lockedBtn}>
                  <Lock size={16} color="rgba(255,255,255,0.3)" />
                  <Text style={s.lockedBtnText}>Lv.{a.unlockLevel} 解锁后可用</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Counter */}
      <View style={s.counter}>
        <Text style={s.counterText}>
          {page + 1} / {AGENTS.length} · 已解锁 {AGENTS.filter(a => userLevel >= a.unlockLevel).length} 位
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  header: { paddingTop: 60, alignItems: "center", paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#C063FF", letterSpacing: 2 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4, marginBottom: 10 },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(247,213,109,0.1)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 14 },
  levelText: { fontSize: 13, fontWeight: "700", color: "#F7D56D" },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.12)" },
  dotActive: { width: 24, backgroundColor: "#F7D56D" },
  dotLocked: { backgroundColor: "rgba(255,255,255,0.04)" },

  scroll: { flex: 1 },
  cardPage: { paddingHorizontal: 20, alignItems: "center", justifyContent: "center", paddingBottom: 20 },
  card: {
    width: "100%", backgroundColor: "rgba(35,10,62,0.55)", borderRadius: 28,
    borderWidth: 0.5, paddingHorizontal: 24, paddingVertical: 28,
    alignItems: "center", position: "relative", overflow: "hidden",
  },

  // Lock
  lockOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(9,0,18,0.55)", zIndex: 10, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
  },
  lockBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(247,213,109,0.12)", borderRadius: 14,
    borderWidth: 0.5, borderColor: "rgba(247,213,109,0.25)",
    paddingHorizontal: 20, paddingVertical: 12,
  },
  lockBadgeText: { fontSize: 15, fontWeight: "700", color: "#F7D56D" },

  // Avatar
  avatarRing: { borderWidth: 1, borderRadius: 99, padding: 6, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2.5, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)" },
  avatarTxt: { fontSize: 30, fontWeight: "900" },
  name: { fontSize: 24, fontWeight: "900", color: "#fff", marginBottom: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, marginBottom: 10 },
  badgeTxt: { fontSize: 12, fontWeight: "700" },
  quote: { fontSize: 14, color: "rgba(255,255,255,0.4)", fontStyle: "italic", marginBottom: 16 },
  desc: { fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 20, marginBottom: 18 },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 18 },
  skill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  skillTxt: { fontSize: 12, fontWeight: "600" },
  welcomeBubble: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14,
    padding: 12, width: "100%",
  },
  welcomeText: { flex: 1, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 18 },

  // Buttons
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", borderRadius: 18, paddingVertical: 16, marginTop: 16,
  },
  startBtnText: { fontSize: 16, fontWeight: "800", color: "#090012" },
  lockedBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", borderRadius: 18, paddingVertical: 16, marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.08)",
  },
  lockedBtnText: { fontSize: 14, color: "rgba(255,255,255,0.35)" },

  counter: { position: "absolute", bottom: 40, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  counterText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.5)" },
});
