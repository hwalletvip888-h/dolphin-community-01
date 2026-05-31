"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Mail, Shield, Globe, Trophy, ArrowRight, Check } from "lucide-react";

const agentsData = [
  { img: "/agents/agent-dolphin.jpg", name: "小海豚", desc: "新手引导", classPos: "left-[2%] top-[30px] z-20" },
  { img: "/agents/agent-reward.jpg", name: "派奖福星", desc: "好运派奖", classPos: "right-[2%] top-[30px] z-20" },
  { img: "/agents/agent-onchain.jpg", name: "链上猎手", desc: "链上侦察", classPos: "left-[15%] top-[120px] z-10" },
  { img: "/agents/agent-zhuge.jpg", name: "诸葛策略", desc: "策略大师", classPos: "right-[15%] top-[120px] z-10" },
  { img: "/agents/agent-wealth.jpg", name: "稳盈管家", desc: "收益护航", classPos: "left-1/2 -translate-x-1/2 top-[165px] z-0" },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [loginUserId, setLoginUserId] = useState("");
  const timerRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function sendCode(force?: boolean) {
    const f = force ?? false;
    if (seconds > 0 || !email) return;
    setStatus("正在发送验证码...");
    setConfirmMsg("");
    try {
      const r = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, force: f }),
      });
      const d = await r.json();
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
        setConfirmMsg(d.message);
        setStatus("");
      } else if (d.message?.includes("too frequent") || d.message?.includes("Too frequent")) {
        setStatus("操作太频繁，请等 1-2 分钟后再试，或换一个邮箱地址");
      } else if (d.message?.includes("try later") || d.message?.includes("Try again")) {
        setStatus("操作太频繁，请稍后再试，或换个邮箱");
      } else {
        setStatus(d.message || "发送失败，请检查邮箱格式");
      }
    } catch {
      setStatus("网络异常，请稍后重试");
    }
  }

  async function handleLogin() {
    if (!code) return;
    setStatus("正在验证...");
    try {
      const r = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code, email, user_id: loginUserId }),
      });
      const d = await r.json();
      if (d.ok) {
        setStatus("登录成功！");
        if (d.token) localStorage.setItem("dolphin_token", d.token);
        if (d.user_id) localStorage.setItem("dolphin_user_id", d.user_id);
        (window as Window).location.href = "/app";
      } else {
        setStatus(d.message || "验证码错误");
      }
    } catch {
      setStatus("网络异常，请稍后重试");
    }
  }

  return (
    <div className="min-h-screen bg-[#090012] text-[#FFF5D9] flex flex-col items-center overflow-x-hidden relative font-sans selection:bg-[#8A3FFC]/40">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/impact-bg.png)" }}
      />
      <div className="fixed inset-0 bg-[#090012]/10 z-0 pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-[150px] bg-gradient-to-b from-[#090012]/90 to-transparent z-0 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-[#090012]/95 via-[#090012]/60 to-transparent z-0 pointer-events-none" />

      {/* Main Content */}
      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col relative z-10 px-5 py-4 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center w-full mb-6">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A0633]/70 border border-[#8A3FFC]/50 rounded-full backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:bg-[#1A0633] transition-colors">
            <Globe className="w-3.5 h-3.5 text-[#F7D56D]" />
            <span className="text-[12px] font-medium text-white/90">简体中文</span>
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A0633]/70 border border-[#8A3FFC]/50 rounded-full backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:bg-[#1A0633] transition-colors">
            <Trophy className="w-3.5 h-3.5 text-[#F7D56D]" />
            <span className="text-[12px] font-medium text-[#F7D56D]">参赛版本</span>
          </button>
        </div>

        {/* Brand Hero */}
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-[40px] font-black tracking-tight leading-none mb-3 text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5D9] via-white to-[#C063FF] drop-shadow-[0_4px_15px_rgba(192,99,255,0.6)]">
            海豚社区
          </h1>
          <div className="bg-gradient-to-r from-[#FFE48A] via-[#F6C659] to-[#D99A2B] px-4 py-1 rounded-full mb-4 shadow-[0_0_20px_rgba(247,213,109,0.35)]">
            <span className="text-[#090012] text-[15px] font-bold tracking-wide">世界杯参赛版</span>
          </div>
          <p className="text-[14px] text-[rgba(235,216,255,0.72)] font-medium tracking-widest uppercase">
            AI Agent × 世界杯竞猜 × 加密社区
          </p>
        </div>

        {/* Agent 6-Cluster */}
        <div className="relative w-full h-[250px] mb-6 mt-4 flex-shrink-0">
          {/* Center: AI预言帝 */}
          <Link href="/app?agent=agent-worldcup" className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center z-30 group cursor-pointer">
            <div className="relative w-[100px] h-[100px] rounded-full p-[2px] bg-gradient-to-br from-[#FFE48A] via-[#F6C659] to-[#D99A2B] shadow-[0_0_35px_rgba(247,213,109,0.5)] group-hover:scale-105 transition-transform duration-300">
              <img src="/agents/agent-worldcup.jpg" alt="AI 预言帝" className="w-full h-full rounded-full border-[2.5px] border-[#090012] object-cover" />
            </div>
            <div className="mt-2.5 flex items-center bg-[#8A3FFC] border border-[#C063FF] px-3 py-1 rounded-lg shadow-[0_4px_15px_rgba(138,63,252,0.6)] whitespace-nowrap">
              <span className="text-[#F7D56D] text-[12px] font-black tracking-wide">AI预言帝</span>
              <span className="text-white/50 mx-2 text-[10px]">|</span>
              <span className="text-white text-[12px] font-bold">赛事预测</span>
            </div>
          </Link>

          {/* Orbiting Agents */}
          {agentsData.map((agent, i) => (
            <div key={i} className={`absolute flex flex-col items-center group cursor-pointer ${agent.classPos}`}>
              <div className="w-[60px] h-[60px] rounded-full p-[2px] bg-gradient-to-b from-[#8A3FFC] to-[#1A0633] shadow-[0_0_20px_rgba(138,63,252,0.3)] group-hover:scale-110 group-hover:from-[#C063FF] transition-all duration-300">
                <img src={agent.img} alt={agent.name} className="w-full h-full rounded-full border-2 border-[#090012] object-cover opacity-90 group-hover:opacity-100" />
              </div>
              <div className="mt-1.5 flex items-center bg-[#090012]/85 border border-[#8A3FFC]/50 px-1.5 py-0.5 rounded backdrop-blur-md whitespace-nowrap shadow-lg group-hover:border-[#C063FF]/80 transition-colors">
                <span className="text-[#F7D56D] text-[10px] font-bold">{agent.name}</span>
                <span className="text-[rgba(235,216,255,0.4)] mx-1 text-[9px]">|</span>
                <span className="text-[rgba(235,216,255,0.8)] text-[9px] font-medium">{agent.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Account Switch Confirmation Dialog */}
        {confirmMsg && (
          <div className="w-full mb-4 relative z-30 bg-[rgba(35,10,62,0.95)] backdrop-blur-xl border border-[#F7D56D]/60 rounded-[24px] p-5 shadow-[0_0_30px_rgba(247,213,109,0.3)]">
            <p className="text-[#F7D56D] text-[14px] font-bold mb-1">检测到账号切换</p>
            <p className="text-white/80 text-[13px] leading-relaxed mb-4">{confirmMsg}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmMsg("")}
                className="flex-1 h-[44px] rounded-[16px] border border-[#8A3FFC]/40 bg-[#1A0633]/60 text-white/70 text-[14px] font-bold"
              >
                取消
              </button>
              <button
                onClick={() => sendCode(true)}
                className="flex-1 h-[44px] rounded-[16px] bg-gradient-to-r from-[#FFF0A8] to-[#F7C65F] text-[#1A0633] text-[14px] font-bold"
              >
                确认切换
              </button>
            </div>
          </div>
        )}

        {/* Login Form Card */}
        <div className="w-full mt-auto relative z-30">
          <div className="relative bg-[rgba(35,10,62,0.82)] backdrop-blur-2xl border border-[rgba(192,99,255,0.48)] rounded-[32px] p-6 shadow-[0_0_40px_rgba(138,63,252,0.15)] overflow-hidden">
            <div className="absolute top-0 left-[20%] right-[20%] h-[1.5px] bg-gradient-to-r from-transparent via-[#F7D56D]/80 to-transparent" />
            <div className="absolute top-0 left-0 w-full h-[30px] bg-gradient-to-b from-[#C063FF]/10 to-transparent pointer-events-none" />

            <div className="text-center mb-6">
              <h2 className="text-[26px] font-bold text-white mb-1 drop-shadow-md">欢迎来到 海豚社区</h2>
              <p className="text-[14px] text-[rgba(235,216,255,0.72)] font-medium">
                与 6 位 AI Agent 一起，赢世界杯，赢未来！
              </p>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[14px] font-semibold text-white mb-2 pl-1">邮箱</label>
                <div className="relative flex items-center bg-[#1A0633]/60 border border-[#8A3FFC]/40 rounded-[20px] h-[56px] px-4 focus-within:border-[#F7D56D]/80 focus-within:shadow-[0_0_15px_rgba(247,213,109,0.15)] transition-all group">
                  <Mail className="w-5 h-5 text-[#C063FF] group-focus-within:text-[#F7D56D] transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱地址"
                    className="flex-1 bg-transparent text-white placeholder-[rgba(235,216,255,0.48)] text-[15px] ml-3 focus:outline-none"
                  />
                </div>
              </div>

              {/* Verification Code */}
              <div>
                <label className="block text-[14px] font-semibold text-white mb-2 pl-1">验证码</label>
                <div className="relative flex items-center bg-[#1A0633]/60 border border-[#8A3FFC]/40 rounded-[20px] h-[56px] pl-4 pr-1.5 focus-within:border-[#F7D56D]/80 focus-within:shadow-[0_0_15px_rgba(247,213,109,0.15)] transition-all group">
                  <Shield className="w-5 h-5 text-[#C063FF] group-focus-within:text-[#F7D56D] transition-colors" />
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入验证码"
                    className="flex-1 w-full bg-transparent text-white placeholder-[rgba(235,216,255,0.48)] text-[15px] ml-3 focus:outline-none"
                  />
                  <div className="h-[24px] w-[1px] bg-[#8A3FFC]/30 mx-1" />
                  <button
                    onClick={() => sendCode()}
                    className="h-[44px] px-4 rounded-[16px] bg-gradient-to-r from-[#8A3FFC]/20 to-[#1A0633]/20 hover:bg-[#8A3FFC]/40 border border-[#8A3FFC]/30 text-[#F7D56D] text-[14px] font-bold whitespace-nowrap transition-colors active:scale-95"
                  >
                    {seconds > 0 ? `${seconds}s` : "发送验证码"}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleLogin}
                className="w-full h-[58px] mt-2 rounded-[22px] bg-gradient-to-r from-[#FFF0A8] via-[#F7C65F] to-[#C97E22] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(247,198,95,0.4)] hover:opacity-90 active:scale-[0.98] transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="text-[#1A0633] text-[18px] font-bold tracking-wide">立即登录 / 注册</span>
                <ArrowRight className="w-5 h-5 text-[#1A0633] stroke-[3]" />
              </button>

              {/* Status message */}
              {status && (
                <p className="mt-3 text-center text-[13px] text-[#C063FF]">{status}</p>
              )}
            </div>

            {/* Agreement */}
            <div className="mt-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-[12px] text-[rgba(235,216,255,0.72)] cursor-pointer group">
                <div className="w-4 h-4 rounded-full border border-[#8A3FFC] flex items-center justify-center bg-[#1A0633] group-hover:border-[#C063FF] transition-colors">
                  <Check className="w-2.5 h-2.5 text-[#C063FF]" />
                </div>
                <span>我已阅读并同意《用户协议》和《隐私政策》</span>
              </div>
              <p className="text-[13px] text-[#C063FF] font-medium tracking-wide">免密码登录 · 一键畅享 Web3 体验</p>
            </div>
          </div>
        </div>

        {/* TEE Security Notice */}
        <div className="mt-6 mb-2 flex items-start justify-center gap-2 bg-[#1A0633]/60 backdrop-blur-md border border-[#8A3FFC]/30 rounded-[14px] px-4 py-3 mx-auto w-full max-w-[360px] shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <Shield className="w-4 h-4 text-[#F7D56D] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[rgba(235,216,255,0.72)] leading-relaxed text-left font-medium">
            基于 OKX Agentic Wallet TEE 安全技术，所有私钥与敏感数据均由 TEE 硬件隔离保护，安全可信。
          </p>
        </div>
      </div>
    </div>
  );
}
