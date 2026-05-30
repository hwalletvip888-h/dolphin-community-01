// Agent selector page
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useAgentStore } from "@/src/stores";
import { AGENTS } from "@/src/shared/constants";
import { AgentAvatar } from "@/src/components/ui";

export default function AgentSelector() {
  const router = useRouter();
  const { setAgent } = useAgentStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const agent = AGENTS[activeIndex];
  if (!agent) return null;

  function handlePrev() {
    setActiveIndex((i) => (i - 1 + AGENTS.length) % AGENTS.length);
  }

  function handleNext() {
    setActiveIndex((i) => (i + 1) % AGENTS.length);
  }

  function handleStart() {
    setAgent(agent.id, activeIndex);
    router.push(`/(app)/chat/${agent.id}`);
  }

  return (
    <View className="flex-1 bg-[#050015]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 }}
      >
        {/* Header */}
        <Text className="text-[28px] font-black text-[#F7D56D] mb-2">选择你的专属 Agent</Text>
        <Text className="text-[14px] text-white/50 mb-10">6 位 AI 专家，各有所长</Text>

        {/* Agent Card */}
        <View className="w-full max-w-[320px] items-center mb-8">
          <AgentAvatar
            source={agent.img}
            size={120}
            ringColor={agent.colors.hex}
            glowColor={agent.colors.hex}
          />

          <Text className="text-[24px] font-black text-white mt-4">{agent.name}</Text>
          <View className="bg-[#1A0633]/80 border px-3 py-1 rounded-full mt-2" style={{ borderColor: agent.colors.hex }}>
            <Text className="text-[13px] font-bold" style={{ color: agent.colors.hex }}>{agent.title}</Text>
          </View>
          <Text className="text-[16px] text-white/60 italic mt-3 text-center">"{agent.quote}"</Text>
          <Text className="text-[13px] text-white/40 mt-4 text-center leading-relaxed px-4">
            {agent.desc}
          </Text>

          {/* Skills */}
          <View className="flex-row flex-wrap justify-center gap-2 mt-5">
            {agent.skills.map((skill) => (
              <View key={skill} className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Text className="text-white/60 text-[12px]">{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Navigation */}
        <View className="flex-row items-center gap-6 mb-10">
          <TouchableOpacity
            onPress={handlePrev}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <ChevronLeft size={20} color="#F7D56D" />
          </TouchableOpacity>

          <View className="flex-row gap-2">
            {AGENTS.map((_, i) => (
              <View
                key={i}
                className={`w-2 h-2 rounded-full ${i === activeIndex ? "bg-[#F7D56D]" : "bg-white/20"}`}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <ChevronRight size={20} color="#F7D56D" />
          </TouchableOpacity>
        </View>

        {/* Start Chat Button */}
        <TouchableOpacity
          onPress={handleStart}
          className="w-full max-w-[320px] h-[58px] rounded-[22px] bg-[#F7D56D] items-center justify-center"
          style={{
            shadowColor: "rgba(247,198,95,0.4)",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <Text className="text-[#1A0633] text-[18px] font-bold">开启专属对话</Text>
        </TouchableOpacity>

        <Text className="text-white/20 text-[12px] mt-4">
          {activeIndex + 1} / {AGENTS.length}
        </Text>
      </ScrollView>
    </View>
  );
}
