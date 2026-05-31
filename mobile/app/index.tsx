// Login page — mirrors web app/page.tsx
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { Mail, Shield, Globe, Trophy, ArrowRight, Check } from "lucide-react-native";
import { useAuthStore } from "@/src/stores";
import { AgentAvatar } from "@/src/components/ui";
import { AGENTS } from "@/src/shared/constants";

export default function LoginScreen() {
  const router = useRouter();
  const { isLoggedIn, isLoading, login, verify } = useAuthStore();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [loginUserId, setLoginUserId] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/(app)/chat");
    }
  }, [isLoggedIn, isLoading]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function sendCode(force?: boolean) {
    if (seconds > 0 || !email) return;
    setStatus("正在发送验证码...");
    setConfirmMsg("");
    const d = await login(email);
    if (d.ok) {
      if (d.user_id) setLoginUserId(d.user_id);
      setSeconds(60);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
      setStatus("验证码已发送，请查看邮箱");
    } else if (d.confirming) {
      setConfirmMsg(d.message || "");
      setStatus("");
    } else {
      setStatus(d.message || "发送失败，请检查邮箱格式");
    }
  }

  async function handleLogin() {
    if (!code) return;
    setStatus("正在验证...");
    const d = await verify(code, email, loginUserId);
    if (d.ok) {
      setStatus("登录成功！");
      router.replace("/(app)/chat");
    } else {
      setStatus(d.message || "验证码错误");
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#090012] items-center justify-center">
        <Text className="text-[#F7D56D] text-lg">加载中...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#090012]">
      <ImageBackground
        source={require("@/assets/impact-bg.png")}
        className="flex-1 absolute inset-0"
        resizeMode="cover"
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingHorizontal: 20, paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar */}
        <View className="flex-row justify-between w-full mb-6">
          <View className="flex-row items-center gap-1.5 px-3.5 py-1.5 bg-[#1A0633]/70 border border-[#8A3FFC]/50 rounded-full">
            <Globe size={14} color="#F7D56D" />
            <Text className="text-[12px] text-white/90">简体中文</Text>
          </View>
          <View className="flex-row items-center gap-1.5 px-3.5 py-1.5 bg-[#1A0633]/70 border border-[#8A3FFC]/50 rounded-full">
            <Trophy size={14} color="#F7D56D" />
            <Text className="text-[12px] text-[#F7D56D]">参赛版本</Text>
          </View>
        </View>

        {/* Brand Hero */}
        <View className="items-center mb-8">
          <Text className="text-[40px] font-black text-[#FFF5D9] mb-3">海豚社区</Text>
          <View className="bg-[#F7D56D]/20 border border-[#F7D56D]/40 px-4 py-1 rounded-full mb-4">
            <Text className="text-[#F7D56D] text-[15px] font-bold">世界杯参赛版</Text>
          </View>
          <Text className="text-[14px] text-white/50 tracking-widest uppercase">
            AI Agent × 世界杯竞猜 × 加密社区
          </Text>
        </View>

        {/* Agent 6-Cluster */}
        <View className="w-full h-[250px] mb-6 relative">
          {AGENTS.map((agent, i) => {
            const positions: Array<{ top: number; left: string }> = [
              { top: 0, left: "35%" },
              { top: 30, left: "2%" },
              { top: 30, left: "83%" },
              { top: 120, left: "15%" },
              { top: 120, left: "70%" },
              { top: 165, left: "38%" },
            ];
            const pos = positions[i] || { top: 120, left: "40%" };
            return (
              <View
                key={agent.id}
                className="absolute items-center"
                style={pos as Record<string, unknown>}
              >
                <AgentAvatar
                  source={agent.img}
                  size={i === 0 ? 80 : 55}
                  ringColor={i === 0 ? "#F7D56D" : "#8A3FFC"}
                  glowColor={i === 0 ? "#F7D56D" : undefined}
                />
                <View className="mt-1.5 flex-row items-center bg-[#090012]/85 border border-[#8A3FFC]/50 px-1.5 py-0.5 rounded">
                  <Text className="text-[#F7D56D] text-[10px] font-bold">{agent.name}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Account Switch Confirmation */}
        {confirmMsg ? (
          <View className="w-full mb-4 bg-[rgba(35,10,62,0.95)] border border-[#F7D56D]/60 rounded-[24px] p-5">
            <Text className="text-[#F7D56D] text-[14px] font-bold mb-1">检测到账号切换</Text>
            <Text className="text-white/80 text-[13px] mb-4">{confirmMsg}</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setConfirmMsg("")}
                className="flex-1 h-[44px] rounded-[16px] border border-[#8A3FFC]/40 bg-[#1A0633]/60 items-center justify-center"
              >
                <Text className="text-white/70 text-[14px] font-bold">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendCode(true)}
                className="flex-1 h-[44px] rounded-[16px] bg-[#F7D56D] items-center justify-center"
              >
                <Text className="text-[#1A0633] text-[14px] font-bold">确认切换</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Login Form Card */}
        <View className="w-full bg-[rgba(35,10,62,0.82)] border border-[rgba(192,99,255,0.48)] rounded-[32px] p-6">
          <View className="items-center mb-6">
            <Text className="text-[26px] font-bold text-white mb-1">欢迎来到 海豚社区</Text>
            <Text className="text-[14px] text-[rgba(235,216,255,0.72)]">
              与 6 位 AI Agent 一起，赢世界杯，赢未来！
            </Text>
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-[14px] font-semibold text-white mb-2 pl-1">邮箱</Text>
            <View className="flex-row items-center bg-[#1A0633]/60 border border-[#8A3FFC]/40 rounded-[20px] h-[56px] px-4">
              <Mail size={20} color="#C063FF" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="请输入邮箱地址"
                placeholderTextColor="rgba(235,216,255,0.48)"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 text-white text-[15px] ml-3"
              />
            </View>
          </View>

          {/* Verification Code */}
          <View className="mb-4">
            <Text className="text-[14px] font-semibold text-white mb-2 pl-1">验证码</Text>
            <View className="flex-row items-center bg-[#1A0633]/60 border border-[#8A3FFC]/40 rounded-[20px] h-[56px] pl-4 pr-1.5">
              <Shield size={20} color="#C063FF" />
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="请输入验证码"
                placeholderTextColor="rgba(235,216,255,0.48)"
                maxLength={6}
                keyboardType="number-pad"
                className="flex-1 text-white text-[15px] ml-3"
              />
              <TouchableOpacity
                onPress={() => sendCode()}
                className="h-[44px] px-4 rounded-[16px] border border-[#8A3FFC]/30 items-center justify-center"
              >
                <Text className="text-[#F7D56D] text-[14px] font-bold">
                  {seconds > 0 ? `${seconds}s` : "发送验证码"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleLogin}
            className="w-full h-[58px] rounded-[22px] bg-[#F7D56D] items-center justify-center flex-row mt-2"
          >
            <Text className="text-[#1A0633] text-[18px] font-bold mr-2">立即登录 / 注册</Text>
            <ArrowRight size={20} color="#1A0633" strokeWidth={3} />
          </TouchableOpacity>

          {status ? (
            <Text className="mt-3 text-center text-[13px] text-[#C063FF]">{status}</Text>
          ) : null}

          {/* Agreement */}
          <View className="mt-6 items-center">
            <View className="flex-row items-center gap-2">
              <Check size={14} color="#C063FF" />
              <Text className="text-[12px] text-[rgba(235,216,255,0.72)]">
                我已阅读并同意《用户协议》和《隐私政策》
              </Text>
            </View>
            <Text className="mt-3 text-[13px] text-[#C063FF]">免密码登录 · 一键畅享 Web3 体验</Text>
          </View>
        </View>

        {/* TEE Security Notice */}
        <View className="mt-6 mb-2 flex-row items-start bg-[#1A0633]/60 border border-[#8A3FFC]/30 rounded-[14px] px-4 py-3 max-w-[360px]">
          <Shield size={16} color="#F7D56D" style={{ marginTop: 2 }} />
          <Text className="ml-2 text-[12px] text-[rgba(235,216,255,0.72)] flex-1">
            基于 OKX Agentic Wallet TEE 安全技术，所有私钥与敏感数据均由 TEE 硬件隔离保护，安全可信。
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
