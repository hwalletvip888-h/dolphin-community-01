// Chat screen — mirrors web app/app/page.tsx chat view
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Send, Sparkles, Zap, Brain, BarChart3, TrendingUp, Activity } from "lucide-react-native";
import { useChatStore, useAgentStore, useWalletStore } from "@/src/stores";
import { AGENTS } from "@/src/shared/constants";
import { MODELS } from "@/src/shared/constants/models";
import { AgentAvatar, TypingDots } from "@/src/components/ui";
import type { AgentId, AIModel, Message, OnchainTab } from "@/src/shared/types/chat";
import { API_BASE } from "@/src/lib/api";
import { ResponseCard } from "@/src/cards";

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text className="text-[15px] text-white/90 leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} className="font-bold text-white">
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export default function ChatScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const agent = AGENTS.find((a) => a.id === agentId) || AGENTS[0];
  const { activeAgentId, selectedModel, onchainTab, setModel, setOnchainTab } = useAgentStore();
  const { messages, isTyping, sendMessage, clearMessages, cancelStream } = useChatStore();
  const { total, fetchWallet } = useWalletStore();
  const [inputValue, setInputValue] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [simData, setSimData] = useState<{ equity?: string; pnl?: string; pnlPct?: string; positions?: Array<{ symbol: string; side: string; size: string; pnl: string; pnlPct: string }> } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isOnchain = agentId === "onchain";

  useEffect(() => {
    clearMessages();
    fetchWallet();
    if (agentId === "onchain") {
      fetch(`${API_BASE}/api/simtrade`)
        .then(r => r.json())
        .then(d => { if (d.portfolio) setSimData(d.portfolio); })
        .catch(() => {});
    } else {
      setSimData(null);
    }
  }, [agentId]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isTyping) return;
    setInputValue("");
    await sendMessage(text, agentId as AgentId, selectedModel);
  }

  function handleQuickQuestion(q: string) {
    if (isTyping) return;
    setInputValue("");
    sendMessage(q, agentId as AgentId, selectedModel);
  }

  const isEmpty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#050015]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-12 pb-3 border-b border-white/5 bg-[#050015]">
        <AgentAvatar source={agent.img} size={36} ringColor={agent.colors.hex} />
        <View className="ml-3 flex-1">
          <Text className="text-white font-bold text-[16px]">{agent.name}</Text>
          <Text className="text-[12px] text-white/40">{agent.title}</Text>
        </View>
        {total !== null && (
          <Text className="text-[#F7D56D] text-[14px] font-bold mr-3">${isNaN(parseFloat(total)) ? "0.00" : parseFloat(total).toFixed(2)}</Text>
        )}
        <TouchableOpacity
          onPress={() => setShowModelPicker(!showModelPicker)}
          className="bg-white/10 rounded-full px-3 py-1.5"
        >
          <Text className="text-white/60 text-[12px]">{selectedModel}</Text>
        </TouchableOpacity>
      </View>

      {/* Model Picker */}
      {/* Onchain sub-tabs */}
      {isOnchain && (
        <View className="flex-row border-b border-white/5 bg-[#050015]">
          {(["chat", "simtrade", "positions", "signals"] as OnchainTab[]).map((tab) => {
            const icons: Record<string, React.ReactNode> = {
              chat: <Send size={13} color={onchainTab === "chat" ? "#F7D56D" : "white"} opacity={onchainTab === "chat" ? 1 : 0.4} />,
              simtrade: <TrendingUp size={13} color={onchainTab === "simtrade" ? "#F7D56D" : "white"} opacity={onchainTab === "simtrade" ? 1 : 0.4} />,
              positions: <Activity size={13} color={onchainTab === "positions" ? "#F7D56D" : "white"} opacity={onchainTab === "positions" ? 1 : 0.4} />,
            };
            const labels: Record<string, string> = { chat: "聊天", simtrade: "模拟交易", positions: "持仓", signals: "信号" };
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setOnchainTab(tab)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 ${onchainTab === tab ? "border-b-2 border-[#F7D56D]" : ""}`}
              >
                {icons[tab]}
                <Text className={`text-[12px] font-semibold ${onchainTab === tab ? "text-[#F7D56D]" : "text-white/40"}`}>{labels[tab]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {showModelPicker && (
        <View className="absolute top-[100px] right-4 z-20 bg-[#1A0633] border border-[#8A3FFC]/30 rounded-2xl p-2 shadow-lg">
          {MODELS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => { setModel(m.id); setShowModelPicker(false); }}
              className={`flex-row items-center px-4 py-2.5 rounded-xl ${selectedModel === m.id ? "bg-[#8A3FFC]/20" : ""}`}
            >
              {m.id.includes("Lite") ? (
                <Zap size={16} color={selectedModel === m.id ? "#F7D56D" : "#8A3FFC"} />
              ) : m.id.includes("Max") ? (
                <Brain size={16} color={selectedModel === m.id ? "#F7D56D" : "#8A3FFC"} />
              ) : (
                <Sparkles size={16} color={selectedModel === m.id ? "#F7D56D" : "#8A3FFC"} />
              )}
              <Text
                className={`ml-2 text-[13px] font-bold ${selectedModel === m.id ? "text-[#F7D56D]" : "text-white/70"}`}
              >
                {m.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* SimTrade Panel */}
      {isOnchain && onchainTab === "simtrade" && (
        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20 }}>
          <Text className="text-[16px] font-bold text-white mb-4">模拟交易面板</Text>
          {simData ? (
            <>
              <View className="bg-[#1A0633]/80 border border-[#8A3FFC]/40 rounded-2xl p-4 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-white/50 text-[12px]">模拟总权益</Text>
                  <Text className="text-white/50 text-[12px]">总盈亏</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-[20px] font-bold text-white">{simData.equity || "—"}</Text>
                  <Text className={`text-[20px] font-bold ${(simData.pnlPct || "").startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>
                    {simData.pnl || "—"} ({(simData.pnlPct || "0")})
                  </Text>
                </View>
              </View>
              <Text className="text-[14px] font-semibold text-white/60 mb-2">历史战绩</Text>
              <Text className="text-white/30 text-[12px] mb-4">模拟交易数据来源: GitHub Pages (Codex 系统)</Text>
              {/* Placeholder for future chart */}
              <View className="bg-white/5 rounded-2xl p-6 items-center">
                <BarChart3 size={32} color="white" opacity={0.2} />
                <Text className="text-white/30 text-[13px] mt-2">更多数据接入中</Text>
              </View>
            </>
          ) : (
            <View className="items-center mt-16">
              <TrendingUp size={48} color="white" opacity={0.2} />
              <Text className="text-white/40 text-[14px] mt-3">模拟交易数据加载中...</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Positions Panel */}
      {isOnchain && onchainTab === "positions" && (
        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20 }}>
          <Text className="text-[16px] font-bold text-white mb-4">当前持仓</Text>
          {simData?.positions?.length ? (
            simData.positions.map((pos, i) => (
              <View key={i} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-2">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[15px] font-bold text-white">{pos.symbol}</Text>
                    <Text className={`text-[12px] font-medium ${pos.side === "long" ? "text-emerald-400" : "text-red-400"}`}>
                      {pos.side === "long" ? "多" : "空"} {pos.size}
                    </Text>
                  </View>
                  <Text className={`text-[14px] font-bold ${pos.pnl.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>
                    {pos.pnl}
                  </Text>
                </View>
                <Text className="text-[11px] text-white/30">{pos.pnlPct}</Text>
              </View>
            ))
          ) : (
            <View className="items-center mt-16">
              <Activity size={48} color="white" opacity={0.2} />
              <Text className="text-white/40 text-[14px] mt-3">暂无持仓数据</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Signals Panel (onchain agent) */}
      {isOnchain && onchainTab === "signals" && (
        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20 }}>
          <Text className="text-[16px] font-bold text-white mb-3">链上信号</Text>
          <Text className="text-white/40 text-[13px] mb-4">此处展示 OnchainOS 实时扫描的链上聪明钱信号，跳转至信号页查看安全审计详情</Text>
          <View className="bg-white/5 rounded-2xl p-6 items-center">
            <Activity size={32} color="#A78BFA" />
            <Text className="text-white/40 text-[13px] mt-2">信号数据加载中...</Text>
          </View>
        </ScrollView>
      )}

      {/* Messages */}
      {(!isOnchain || onchainTab === "chat") && (<>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6">
            <AgentAvatar
              source={agent.img}
              size={80}
              ringColor={agent.colors.hex}
              glowColor={agent.colors.hex}
            />
            <Text className="text-[20px] font-black text-white mt-4">{agent.name}</Text>
            <Text className="text-[14px] text-white/50 mt-2 text-center">{agent.welcome}</Text>

            {/* Quick Questions */}
            <View className="flex-row flex-wrap justify-center gap-3 mt-8">
              {agent.quickQuestions.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => handleQuickQuestion(q)}
                  className="bg-white/5 border border-white/10 rounded-full px-4 py-2.5"
                >
                  <Text className="text-white/70 text-[13px]">{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ChatBubble message={item} agentColor={agent.colors.hex} />
        )}
        onScrollBeginDrag={() => setShowModelPicker(false)}
      />

      {/* Typing indicator */}
      {isTyping && <TypingDots />}

      {/* Input Bar */}
      <View className="flex-row items-center px-4 py-3 border-t border-white/5 bg-[#0A0020] gap-2">
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="输入消息..."
          placeholderTextColor="rgba(235,216,255,0.4)"
          multiline
          maxLength={500}
          className="flex-1 bg-white/5 border border-white/10 rounded-[20px] px-4 py-3 text-white text-[15px] max-h-[100px]"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={isTyping ? cancelStream : handleSend}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            isTyping ? "bg-red-500/20" : inputValue ? "bg-[#F7D56D]" : "bg-white/10"
          }`}
        >
          {isTyping ? (
            <View className="w-4 h-4 rounded-sm bg-red-400" />
          ) : (
            <Send size={18} color={inputValue ? "#1A0633" : "#8A3FFC"} />
          )}
        </TouchableOpacity>
      </View>
      </>)}
    </KeyboardAvoidingView>
  );
}

function ChatBubble({ message, agentColor }: { message: Message; agentColor: string }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <View className="items-end mb-4">
        <View className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3" style={{ backgroundColor: agentColor }}>
          <Text className="text-[#1A0633] text-[15px]">{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4">
      {message.content ? (
        <View className="max-w-[85%] bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
          <RichText text={message.content} />
        </View>
      ) : null}
      {message.cards?.map((card, i) => (
        <ResponseCard key={i} data={card} />
      ))}
    </View>
  );
}
