import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, ShieldCheck, Mail } from "lucide-react-native";
import { useAuth } from "@/src/stores/auth";
import { AGENTS } from "@/src/data/agents";

const AGENT_COLORS = AGENTS.map((a) => a.color);

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleSendCode = async () => {
    if (!email.trim() || loading) return;
    setLoading(true);
    setMsg("");
    try {
      const r = await useAuth.getState().login(email.trim());
      if (r.ok) { setStep("code"); setMsg("验证码已发送"); }
      else setMsg(r.message || "发送失败");
    } catch { setMsg("网络异常"); }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setMsg("");
    try {
      const uid = useAuth.getState().userId || "";
      const r = await useAuth.getState().verifyCode(code.trim(), email.trim(), uid);
      if (r.ok) { router.replace("/onboarding"); }
      else setMsg(r.message || "验证失败");
    } catch { setMsg("网络异常"); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.content}>
        {/* Agent ring */}
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]}>
          <View style={styles.ringInner}>
            {AGENTS.map((a, i) => {
              const deg = (360 / AGENTS.length) * i - 90;
              const rad = (deg * Math.PI) / 180;
              const r = 90;
              const left = 80 + Math.cos(rad) * r - 16;
              const top = 80 + Math.sin(rad) * r - 16;
              return (
                <View
                  key={a.id}
                  style={[styles.dot, { left, top, borderColor: a.color, backgroundColor: a.color + "18" }]}
                >
                  <Text style={[styles.dotText, { color: a.color }]}>{a.name[0]}</Text>
                </View>
              );
            })}
            <View style={styles.centerBadge}>
              <Text style={styles.centerEmoji}>AI</Text>
            </View>
          </View>
        </Animated.View>

        {/* Text */}
        <Text style={styles.title}>海豚社区</Text>
        <Text style={styles.tagline}>一句话，构建任意策略</Text>
        <Text style={styles.desc}>AI Agent 驱动的 Web3 社区 App</Text>

        {/* Card */}
        <View style={styles.card}>
          {step === "email" ? (
            <>
              <View style={styles.inputRow}>
                <Mail size={18} color="rgba(255,255,255,0.35)" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="请输入邮箱地址"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  onSubmitEditing={handleSendCode}
                  returnKeyType="send"
                />
              </View>
              <TouchableOpacity
                style={[styles.btn, !email.trim() && styles.btnOff]}
                onPress={handleSendCode}
                disabled={!email.trim() || loading}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>{loading ? "发送中..." : "发送验证码"}</Text>
                {!loading && <ArrowRight size={18} color="#090012" />}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.hint}>验证码已发送至 {email}</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor="rgba(255,255,255,0.15)"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.codeInput}
                onSubmitEditing={handleVerify}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.btn, !code.trim() && styles.btnOff]}
                onPress={handleVerify}
                disabled={!code.trim() || loading}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>{loading ? "验证中..." : "立即进入"}</Text>
                {!loading && <ArrowRight size={18} color="#090012" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep("email"); setMsg(""); }} style={styles.linkBtn}>
                <Text style={styles.linkText}>更换邮箱</Text>
              </TouchableOpacity>
            </>
          )}
          {msg ? <Text style={[styles.msg, msg.includes("失败") || msg.includes("异常") ? styles.msgErr : styles.msgOk]}>{msg}</Text> : null}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <ShieldCheck size={13} color="rgba(255,255,255,0.3)" />
          <Text style={styles.footerText}>Agent Wallet 安全创建 · 敏感操作需用户确认</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090012" },
  glowTop: {
    position: "absolute", top: "5%", left: "10%",
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: "#C063FF", opacity: 0.06,
  },
  glowBottom: {
    position: "absolute", bottom: 0, right: 0,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: "#F7D56D", opacity: 0.04,
  },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },

  // Ring
  ring: { width: 180, height: 180, marginBottom: 32 },
  ringInner: { width: 180, height: 180, position: "relative" },
  dot: {
    position: "absolute", width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
  dotText: { fontSize: 13, fontWeight: "700" },
  centerBadge: {
    position: "absolute", left: 64, top: 64,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(26,6,51,0.9)", borderWidth: 1.5,
    borderColor: "rgba(192,99,255,0.3)", alignItems: "center", justifyContent: "center",
  },
  centerEmoji: { fontSize: 18, fontWeight: "900", color: "#F7D56D" },

  // Text
  title: { fontSize: 34, fontWeight: "900", color: "#C063FF", letterSpacing: 4, marginBottom: 4 },
  tagline: { fontSize: 17, fontWeight: "500", color: "#F7D56D", marginBottom: 4 },
  desc: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 28 },

  // Card
  card: {
    width: "100%", maxWidth: 360,
    backgroundColor: "rgba(35,10,62,0.72)", borderRadius: 24,
    borderWidth: 1, borderColor: "rgba(192,99,255,0.25)",
    padding: 22,
  },

  // Input
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  input: {
    flex: 1, color: "#fff", fontSize: 15,
    backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  codeInput: {
    color: "#fff", fontSize: 26, fontWeight: "700", letterSpacing: 10, textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14,
    paddingVertical: 18, marginBottom: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  hint: { fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 14 },

  // Button
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#F7D56D", borderRadius: 16,
    paddingVertical: 14,
  },
  btnOff: { opacity: 0.3 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#090012" },

  // Link
  linkBtn: { alignItems: "center", marginTop: 12 },
  linkText: { fontSize: 13, color: "rgba(255,255,255,0.5)" },

  // Message
  msg: { fontSize: 13, textAlign: "center", marginTop: 10 },
  msgOk: { color: "#34D399" },
  msgErr: { color: "#FB923C" },

  // Footer
  footerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 32 },
  footerText: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
});
