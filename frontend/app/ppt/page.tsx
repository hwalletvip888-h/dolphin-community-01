"use client";

import { useState } from "react";
import { MessageSquare, Shield, Zap, ChevronDown, ArrowRight, Sparkles, Wallet, TrendingUp, Mail } from "lucide-react";

const agents = [
  { emoji: "🔮", name: "AI预言帝", role: "赛事预测", desc: "Polymarket 链上赔率实时追踪，世界杯、大选、FOMC — 赔率分析+下单一站式", color: "#FBBF24" },
  { emoji: "🎯", name: "链上猎手", role: "链上交易", desc: "查钱包、追聪明钱、Meme扫链、跨链桥 — 链上没有我不知道的", color: "#A78BFA" },
  { emoji: "🧠", name: "诸葛策略", role: "量化分析", desc: "BTC/ETH/SOL 深度行情，HURST趋势+布林带+Pivot 三策略共振", color: "#C084FC" },
  { emoji: "🐬", name: "小海豚", role: "新手引导", desc: "充币、提币、转账、兑换 — 一步一步带你走，像邻家姐姐一样耐心", color: "#38BDF8" },
  { emoji: "💰", name: "稳盈管家", role: "稳健理财", desc: "稳定币收益、蓝筹定投、DeFi 策略 — 睡得着才是好投资", color: "#34D399" },
  { emoji: "🎁", name: "派奖福星", role: "福利派送", desc: "活动奖励、竞赛排行、空投领取 — 哪里有奖哪里有我", color: "#FB923C" },
];

const features = [
  { icon: Mail, title: "邮箱即钱包", desc: "不记助记词，不碰私钥。OKX Agent Wallet TEE 硬件安全芯片自动生成并保护你的资产。注册只需一个邮箱。" },
  { icon: MessageSquare, title: "打字即交易", desc: "\"用 100U 买 BTC\" \"巴西赢了下 20U\" — 像跟朋友聊天一样操作。不用学会看K线，Agent 帮你分析。" },
  { icon: Sparkles, title: "6 个 AI Agent", desc: "每个 Agent 有人格、有记忆、有专长。像选基金经理一样，找个对胃口的。它会记住你的偏好，越聊越懂你。" },
  { icon: Shield, title: "OKX 保驾护航", desc: "底层跑在 OKX Agent Wallet TEE 安全环境。DEX 聚合 500+ 流动性源，跨链桥覆盖 9 条链。不是玩具，是生产级。" },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#050015] text-[#FFF5D9] font-sans overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050015]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-black tracking-tight">
            <span className="gold-text">海豚社区</span>
          </span>
          <a href="/" className="gold-button px-5 py-2 rounded-full text-sm font-bold">
            免费开始
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-24 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          {/* 轮播图/Banner */}
          <img src="/images/banner-carousel.jpg" alt="海豚社区" className="w-full rounded-2xl shadow-2xl border border-white/10 mb-8" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F7D56D]/30 bg-[#F7D56D]/5 text-[13px] text-[#F7D56D] font-bold mb-6">
            <Zap size={14} /> OKX Agent Wallet TEE 安全护航
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            <span className="gold-text">打字就能交易</span>
            <br />
            <span className="text-white/90">Web3 入门，没那么难</span>
          </h1>
          <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            不需要助记词，不需要懂K线，不需要研究Gas费。
            <br />
            输入你的邮箱，选一个 AI Agent，像跟朋友聊天一样开始你的第一笔链上交易。
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/" className="gold-button inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-black">
              立即体验 <ArrowRight size={20} />
            </a>
            <a href="/xcup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 bg-white/5 text-white/80 text-lg font-bold hover:bg-white/10 transition-colors">
              了解更多
            </a>
          </div>
        </div>
      </section>

      {/* ── 项目简介 ── */}
      <section className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black gold-text text-center mb-8">项目简介</h2>
          <div className="hwallet-panel rounded-2xl p-6 md:p-10 text-sm leading-relaxed text-white/70 space-y-5">
            <p className="text-base text-white/90 font-bold">
              海豚社区是一款 <span className="gold-text">AI 对话式交互的 Web3 社区 App</span>。
            </p>
            <blockquote className="border-l-2 border-[#FB923C] pl-4 text-white/60 italic">
              去年 10 月，我们引导 <strong className="text-white">300+ 社区用户</strong> 首次使用 OKX Web3 Wallet，统一反馈：<strong className="text-[#FB923C]">用不明白</strong>——不会看链、不会跟单、不懂止损止盈。
            </blockquote>
            <p className="text-white/50 text-xs">为此，我们基于 <strong className="text-white">OKX Agent Wallet + Onchain OS + OKX Agent Trade Kit</strong> 构建了 <strong className="text-white">6 个 AI Agent</strong>，提供两大核心功能：</p>
            <div className="grid md:grid-cols-2 gap-5 mt-4">
              <div className="rounded-xl bg-[#A78BFA]/8 border border-[#A78BFA]/25 p-5">
                <h3 className="font-black text-[#A78BFA] text-lg mb-3">🔗 链上赚币（跟单）</h3>
                <div className="text-white/50 text-xs space-y-1.5 leading-relaxed">
                  <div className="flex items-start gap-2"><span className="text-[#A78BFA] mt-0.5">→</span> Onchain OS Skill 组合模拟交易指标</div>
                  <div className="flex items-start gap-2"><span className="text-[#A78BFA] mt-0.5">→</span> 生成 7×24h 模拟数据库</div>
                  <div className="flex items-start gap-2"><span className="text-[#A78BFA] mt-0.5">→</span> 用户按胜率/盈利跟单</div>
                  <div className="flex items-start gap-2"><span className="text-[#A78BFA] mt-0.5">→</span> <strong className="text-white">Agent 统一决策止损止盈</strong>（用户可设最大限额）</div>
                </div>
              </div>
              <div className="rounded-xl bg-[#C084FC]/8 border border-[#C084FC]/25 p-5">
                <h3 className="font-black text-[#C084FC] text-lg mb-3">📊 合约策略（量化）</h3>
                <div className="text-white/50 text-xs space-y-1.5 leading-relaxed">
                  <div className="flex items-start gap-2"><span className="text-[#C084FC] mt-0.5">→</span> OKX Agent Trade Kit 构建 AI 量化 Agent</div>
                  <div className="flex items-start gap-2"><span className="text-[#C084FC] mt-0.5">→</span> VBT Pro 回测验证</div>
                  <div className="flex items-start gap-2"><span className="text-[#C084FC] mt-0.5">→</span> 7×24h 模拟盘信号下单</div>
                  <div className="flex items-start gap-2"><span className="text-[#C084FC] mt-0.5">→</span> 构建可复用的策略数据库</div>
                </div>
              </div>
            </div>
            <p className="text-center gold-text font-black text-lg pt-2">App 将于 6 月初上线。Build 🔥</p>
          </div>
        </div>
      </section>

      {/* ── APP 预览 ── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black gold-text text-center mb-4">App 界面预览</h2>
          <p className="text-center text-white/40 mb-10 text-sm">邮箱注册 → 选 Agent → 打字即交易</p>

          {/* 设计稿 */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="flex flex-col items-center">
              <img src="/images/ui-screen-1.png" alt="海豚社区登录页面" className="w-full max-w-[360px] rounded-2xl shadow-2xl border border-white/10" />
              <span className="text-xs text-white/40 mt-3">登录页面</span>
            </div>
            <div className="flex flex-col items-center">
              <img src="/images/ui-screen-2.png" alt="海豚社区界面" className="w-full max-w-[360px] rounded-2xl shadow-2xl border border-white/10" />
              <span className="text-xs text-white/40 mt-3">Agent 对话界面</span>
            </div>
          </div>

          {/* 功能亮点卡片 */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { emoji:"📧", title:"邮箱一键登录", desc:"OKX Agent Wallet TEE 自动创建钱包，不记助记词" },
              { emoji:"🤖", title:"6 Agent 各有所长", desc:"链上猎手/诸葛策略/AI预言帝...各司其职" },
              { emoji:"💬", title:"打字即交易", desc:"「换2U的XDOG」→ OKX执行 → 返回TX哈希" },
              { emoji:"📊", title:"模拟盘先行验证", desc:"Agent模拟交易盈利+7.6%后才输出跟单信号" },
            ].map((f,i) => (
              <div key={i} className="hwallet-panel rounded-2xl p-5 text-center">
                <div className="text-2xl mb-3">{f.emoji}</div>
                <h3 className="font-black text-white text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO VIDEO ── */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black gold-text mb-6">2 分钟看懂海豚社区</h2>
          <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <iframe
              src="https://www.youtube.com/embed/k8zXkNImYns"
              title="海豚社区演示"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <p className="mt-3 text-xs text-white/30">手机版演示：<a href="https://youtube.com/shorts/-Vyv4-caDcE" target="_blank" rel="noopener noreferrer" className="text-[#F7D56D] hover:underline">YouTube Shorts</a></p>
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ── */}
      <section className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
            <p className="text-red-300 font-black text-lg mb-3">没有海豚社区之前</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li>❌ 下载钱包 → 抄助记词 → 怕丢怕盗</li>
              <li>❌ 看不懂 Gas、滑点、交易对</li>
              <li>❌ K线头大，不知道该不该买</li>
              <li>❌ 链上信息分散，不知道去哪查</li>
              <li>❌ 只想投点小钱玩玩，门槛高得离谱</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-green-400/20 bg-green-400/5 p-6">
            <p className="text-green-300 font-black text-lg mb-3">有了海豚社区之后</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li>✅ 邮箱注册，1 分钟搞定</li>
              <li>✅ 打字 \"买 100U BTC\"，Agent 自动执行</li>
              <li>✅ Agent 帮你分析行情，给信号带止损</li>
              <li>✅ 链上猎手一键扫链查余额查聪明钱</li>
              <li>✅ 从 0 到第一笔交易，不超过 3 分钟</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black gold-text mb-12">三步开始</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", icon: Mail, title: "邮箱注册", desc: "输入邮箱，收验证码，OKX Agent Wallet TEE 自动创建你的安全钱包", color: "#38BDF8" },
              { step: "2", icon: Sparkles, title: "选一个 Agent", desc: "6 个 AI Agent 各有特长，挑个顺眼的 — 像选基金经理一样", color: "#FBBF24" },
              { step: "3", icon: MessageSquare, title: "打字即交易", desc: "\"用 100U 买 BTC\" — Agent 分析行情、给出建议、帮你执行", color: "#34D399" },
            ].map((s) => (
              <div key={s.step} className="hwallet-panel rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4" style={{ background: `${s.color}20`, color: s.color }}>
                  {s.step}
                </div>
                <s.icon className="w-8 h-8 mx-auto mb-3" style={{ color: s.color }} />
                <h3 className="font-black text-white text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black gold-text text-center mb-12">为什么选海豚社区</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(247,213,109,0.1)" }}>
                  <f.icon size={20} className="text-[#F7D56D]" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base mb-1">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black gold-text text-center mb-4">6 个 AI Agent，各有所长</h2>
          <p className="text-center text-white/50 mb-12 text-sm">每个 Agent 有独立人格和专属记忆，会记住你的偏好。越聊越懂你。</p>
          <div className="grid md:grid-cols-3 gap-4">
            {agents.map((a) => (
              <div key={a.name} className="hwallet-panel rounded-2xl p-5 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{a.emoji}</span>
                  <div>
                    <h3 className="font-black text-white">{a.name}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: a.color, background: `${a.color}15` }}>{a.role}</span>
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH BADGES ── */}
      <section className="py-12 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-white/40 mb-6">底层技术栈</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["OKX Agent Wallet TEE", "OnchainOS 多链网关", "DEX 500+ 流动性源", "DeepSeek V4 AI", "Polymarket 链上预测", "9 条链跨链桥", "CCXT 实时行情"].map((t) => (
              <span key={t} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/60">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black gold-text text-center mb-12">常见问题</h2>
          <div className="space-y-3">
            {[
              { q: "我的资产安全吗？", a: "安全。你的私钥由 OKX Agent Wallet TEE 硬件安全芯片生成和保管，我们碰不到你的密钥。所有交易都在链上可查。" },
              { q: "需要多少钱开始？", a: "没有最低限制。你可以先跟 Agent 聊聊天、看看行情，觉得顺手了再小额尝试。我们建议新手从 10U 开始体验。" },
              { q: "和直接用交易所 App 有什么区别？", a: "你不用学会看K线、不用研究 Gas 费、不用对比滑点。Agent 帮你做分析、给建议，你只需要告诉它「我想买什么」。适合不想深入研究技术细节的普通人。" },
              { q: "AI 会不会乱下单？", a: "不会。任何链上操作都需要你确认。Agent 只给建议，最终点「确认」的人是你。每个策略建议都附带止损止盈条件。" },
              { q: "支持哪些币种？", a: "以太坊、Solana、BSC、Arbitrum、Base、X Layer 等 9 条链上的主流代币。链上猎手支持搜索任意代币。" },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-5 py-4 flex items-center justify-between text-left">
                  <span className="font-bold text-white text-sm">{faq.q}</span>
                  <ChevronDown size={16} className={`text-white/40 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <p className="px-5 pb-4 text-sm text-white/60 leading-relaxed">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto hwallet-panel rounded-3xl p-10">
          <h2 className="text-2xl md:text-3xl font-black gold-text mb-4">准备好开始了吗？</h2>
          <p className="text-white/60 mb-8">不记助记词，不看K线，3 分钟完成第一笔链上交易。</p>
          <a href="/" className="gold-button inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-lg font-black hover:scale-105 transition-transform">
            免费开始 <ArrowRight size={20} />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-lg font-black gold-text">海豚社区 · Dolphin Community</p>
          <p className="text-xs text-white/30 max-w-lg mx-auto leading-relaxed">
            基于 OKX Agent Wallet TEE · Onchain OS · OKX Agent Trade Kit 构建<br/>
            OKX Degen Odyssey 2026 · Track 2: AI Agent × Agent Wallet
          </p>
          <div className="flex justify-center gap-6 text-xs text-white/20 pt-2">
            <a href="https://api.hvip.ink" className="hover:text-[#F7D56D] transition-colors">api.hvip.ink</a>
            <a href="https://github.com/hwalletvip888-h/dolphin-community-01" className="hover:text-[#F7D56D] transition-colors">GitHub</a>
            <a href="https://youtube.com/shorts/-Vyv4-caDcE" className="hover:text-[#F7D56D] transition-colors">演示视频</a>
          </div>
          <p className="text-[10px] text-white/10 pt-4">© 2026 海豚量化 (Haitun). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
