import { Trophy, Play, FileText, ExternalLink, ChevronDown } from "lucide-react";

export const metadata = {
  title: "海豚社区｜X Cup 参赛项目",
  description: "AI Agent × OKX Agent Wallet × Polymarket 链上预测 · Degen Odyssey Track 2",
};

export default function XCupPage() {
  return (
    <main className="hwallet-bg min-h-screen overflow-hidden">
      {/* HERO / POSTER */}
      <section className="relative mx-auto max-w-[960px] px-4 pt-6 text-center">
        {/* Badge */}
        <div className="mx-auto mb-5 flex w-fit items-center gap-3 rounded-full border border-hw-gold/40 bg-black/35 px-5 py-2 text-sm font-bold text-white/90 backdrop-blur">
          <Trophy size={16} className="text-hw-gold" />
          <span>OKX Degen Odyssey · Track 2: AI Agent × Agent Wallet</span>
        </div>

        {/* Poster Image */}
        <div className="relative mx-auto mb-6 overflow-hidden rounded-2xl border border-purple-400/35 shadow-hw-glow">
          <img
            src="/images/poster-worldcup.png"
            alt="Agent 玩转世界杯"
            className="w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050015]/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-sm text-white/50">海豚社区 · X Cup 参赛项目</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="gold-text text-4xl font-black tracking-tight md:text-6xl">
          海豚社区
        </h1>
        <p className="mx-auto mt-3 max-w-[680px] text-base text-white/80 md:text-lg">
          极大降低了普通用户使用 AI 智能体的门槛——通过 Agent 拟人化、
          任务成就系统增加用户粘性。平台采用 OKX Agent Wallet 注册登录，
          不参与资金托管与交易。世界杯期间，聚焦预测新玩法的趣味性探索。
        </p>
        <p className="mt-2 text-sm font-bold text-hw-gold">
          深耕下沉市场，为 X Layer 带来新的用户群体
        </p>

        {/* TWO LINK BUTTONS */}
        <div className="mx-auto mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* Demo Video */}
          <a
            href="#demo"
            target="_blank"
            rel="noopener noreferrer"
            className="gold-button flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-4 text-lg font-black transition-transform hover:scale-[1.03] active:scale-95 sm:w-auto"
          >
            <Play size={22} fill="currentColor" />
            观看 Demo 视频
          </a>

          {/* PPT / Deck */}
          <a
            href="#ppt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-hw-gold/50 bg-black/40 px-8 py-4 text-lg font-black text-hw-gold backdrop-blur transition-transform hover:scale-[1.03] active:scale-95 sm:w-auto"
          >
            <FileText size={22} />
            查看 PPT 演示
          </a>
        </div>

        <p className="mt-3 text-xs text-white/35">
          Demo 和 PPT 准备中，链接即将更新
        </p>

        {/* Scroll hint */}
        <div className="mt-10 animate-bounce text-white/25">
          <ChevronDown size={28} className="mx-auto" />
        </div>
      </section>

      {/* PROJECT HIGHLIGHTS */}
      <section className="mx-auto max-w-[960px] px-4 pb-12 pt-10">
        <h2 className="text-center text-2xl font-black text-white/90 md:text-3xl">
          项目亮点
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="hwallet-panel rounded-2xl p-6 transition-transform hover:scale-[1.02]"
            >
              <div className="mb-2 text-2xl">{h.icon}</div>
              <h3 className="text-lg font-black text-hw-gold">{h.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {h.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <section className="mx-auto max-w-[960px] px-4 pb-16">
        <h2 className="text-center text-2xl font-black text-white/90 md:text-3xl">
          技术架构
        </h2>

        <div className="mt-8 overflow-hidden rounded-2xl border border-purple-400/30 bg-black/40 backdrop-blur">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-purple-400/20">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-hw-gold">
                    层级
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-hw-gold">
                    技术栈
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-hw-gold">
                    规模
                  </th>
                </tr>
              </thead>
              <tbody className="text-white/75">
                {stack.map((s) => (
                  <tr
                    key={s.layer}
                    className="border-b border-purple-400/10 last:border-0"
                  >
                    <td className="px-5 py-3 font-bold text-white/90">
                      {s.layer}
                    </td>
                    <td className="px-5 py-3">{s.tech}</td>
                    <td className="px-5 py-3 text-white/50">{s.scale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* OKX INTEGRATION */}
      <section className="mx-auto max-w-[960px] px-4 pb-16">
        <h2 className="text-center text-2xl font-black text-white/90 md:text-3xl">
          OKX 集成深度
        </h2>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {integrations.map((i) => (
            <div
              key={i.name}
              className="flex items-center gap-3 rounded-xl border border-purple-400/20 bg-black/35 px-4 py-3 text-sm backdrop-blur"
            >
              <span className="text-base">{i.icon}</span>
              <div>
                <p className="font-bold text-white/90">{i.name}</p>
                <p className="text-xs text-white/45">{i.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-purple-400/15 bg-black/40 px-4 py-8 text-center backdrop-blur">
        <p className="text-sm font-bold text-hw-gold">海豚社区 · X Cup 2026</p>
        <p className="mt-1 text-xs text-white/35">
          Built on OKX for OKX · Agent Wallet · Onchain OS · Polymarket
        </p>
        <div className="mt-4 flex justify-center gap-4 text-xs text-white/40">
          <a
            href="https://github.com/hwalletvip888-h/dolphin-community-01"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-hw-gold transition-colors"
          >
            <ExternalLink size={12} />
            GitHub
          </a>
          <a
            href="https://api.hvip.ink"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-hw-gold transition-colors"
          >
            <ExternalLink size={12} />
            前端 Demo
          </a>
          <a
            href="https://okx-wallet-h.github.io/dolphin-quant-v2"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-hw-gold transition-colors"
          >
            <ExternalLink size={12} />
            数据面板
          </a>
        </div>
      </footer>
    </main>
  );
}

const highlights = [
  {
    icon: "🤖",
    title: "6 AI Agent 拟人化",
    desc: "链上猎手、诸葛策略、稳盈管家、AI预言帝、小海豚、派奖福星——每个Agent有独立人格、专属头像、专属配色。用户选Agent像选基金经理，不是面对冷冰冰的功能菜单。",
  },
  {
    icon: "🔮",
    title: "Polymarket 链上预测市场",
    desc: "OKX OnchainOS Plugin Store 直接安装 Polymarket Plugin。用户说「巴西能赢吗，下20U」，AI自动在Polygon链上买入YES份额。不是模拟盘，是真金白银的链上预测市场。",
  },
  {
    icon: "🔗",
    title: "MCP Server · 20 Tools",
    desc: "@h-wallet/mcp-server 已发布 npm。20个标准化Tool覆盖钱包、仓位、策略、交易、风控、市场数据、社区增长。Claude Code通过MCP与量化后端通信，AI不直接碰交易所。",
  },
  {
    icon: "📊",
    title: "量化策略驱动的交易",
    desc: "H1布林带均值回归 + H3 Pivot支撑阻力，双策略覆盖9币种。每15分钟扫描信号，VBT PRO 29项指标回测验证。6道风控门禁：频率→金额→置信度→波动率→流动性→合规。",
  },
  {
    icon: "🤖",
    title: "Telegram Bot 移动交易",
    desc: "@hwallet01_bot 9条命令。内联键盘一键做多/做空，实时持仓OCO止盈止损，多时间框架趋势监控，聪明钱追踪。OKX CLI直接下单，不是玩具。",
  },
  {
    icon: "🏆",
    title: "下沉市场 × X Layer",
    desc: "不跟DeFi老炮抢存量，带新人进场。不会用MetaMask的普通人，通过聊天框完成人生第一笔链上交易。世界杯是最好的拉新场景。",
  },
];

const stack = [
  { layer: "AI 层", tech: "Claude Code + MCP Server (20 Tools) + DeepSeek Agent (13 Tools)", scale: "33 AI Tools" },
  { layer: "Skills 层", tech: "43 个 SKILL.md — 14 策略 + 28 OKX 平台 + 1 Polymarket", scale: "43 Skills" },
  { layer: "后端层", tech: "8 接口 + 10 核心库 + 14 CLI — Python 6,062 行", scale: "6,062 行" },
  { layer: "量化层", tech: "VBT PRO 回测 (29 指标) + 信号扫描 (H1+H3) + 模拟交易引擎", scale: "双策略 9币种" },
  { layer: "前端层", tech: "Next.js 15 + React 19 + Tailwind — TypeScript 26,283 行", scale: "26,283 行" },
  { layer: "OKX 层", tech: "Agent Wallet (TEE) + Onchain OS + DEX Swap + CEX + Polymarket Plugin", scale: "10 维度" },
  { layer: "数据层", tech: "CCXT 直连 + Parquet + Git LFS + Supabase", scale: "6 数据文件" },
  { layer: "风控层", tech: "6 道门禁 + Skill Guard 安全扫描 (12 攻击向量)", scale: "6 道门禁" },
];

const integrations = [
  { icon: "🔐", name: "Agent Wallet", desc: "TEE 注册登录，不碰密钥" },
  { icon: "🌐", name: "Onchain OS", desc: "50+ 链统一网关" },
  { icon: "🧩", name: "Plugin Store", desc: "Polymarket 已安装" },
  { icon: "💱", name: "DEX Swap", desc: "500+ DEX 聚合" },
  { icon: "📈", name: "CEX Trade", desc: "模拟盘 5 持仓运行" },
  { icon: "📡", name: "行情数据", desc: "CCXT + CLI 双路径" },
  { icon: "🛡️", name: "安全检测", desc: "四维风险扫描" },
  { icon: "⛽", name: "Gas Station", desc: "EIP-7702 无 Gas" },
  { icon: "🌉", name: "跨链桥", desc: "多链资产桥接" },
];
