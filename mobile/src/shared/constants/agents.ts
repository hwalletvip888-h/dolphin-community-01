// Agent configurations — shared between web and mobile
// Source: frontend/app/app/page.tsx:34-134
import type { AgentId } from "../types/chat";

export interface AgentConfig {
  id: AgentId;
  name: string;
  title: string;
  quote: string;
  desc: string;
  skills: string[];
  colors: {
    hex: string;
    gradient: string;
    glow: string;
  };
  img: string;
  welcome: string;
  quickQuestions: string[];
}

export const AGENTS: AgentConfig[] = [
  {
    id: "worldcup",
    name: "AI预言帝",
    title: "预测市场",
    quote: "赔率我都看透了",
    desc: "专注 Polymarket 预测市场，赔率分析+下单+持仓管理全覆盖，世界杯知识库信手拈来",
    skills: ["赔率分析", "预测下单", "账户管理", "世界杯百科"],
    colors: {
      hex: "#FBBF24",
      gradient: "from-[#FBBF24] to-[#D97706]",
      glow: "shadow-[0_0_40px_rgba(251,191,36,0.4)]",
    },
    img: "agent-worldcup",
    welcome: "世界杯我早看穿了！Polymarket 链上赔率实时追踪，预测下单、账户管理一站式。想看赔率还是直接下场？⚽",
    quickQuestions: ["🏆 夺冠赔率排行", "📋 查看我的持仓", "💰 如何充值下单", "🔍 搜索预测市场"],
  },
  {
    id: "dolphin",
    name: "小海豚",
    title: "新手引导",
    quote: "别怕，我带你玩",
    desc: "阳光温暖，像邻家姐姐一样耐心，把复杂的东西拆成一步步",
    skills: ["新手教程", "平台指南", "竞猜教学", "操作指引"],
    colors: {
      hex: "#38BDF8",
      gradient: "from-[#38BDF8] to-[#2563EB]",
      glow: "shadow-[0_0_40px_rgba(56,189,248,0.4)]",
    },
    img: "agent-dolphin",
    welcome: "嗨！我是小海豚 🐬 别怕，我带你玩。简单易懂，只需一句话，其他交给我。平台规则，链上赚币，合约策略，盈亏分析，都可以来告诉我~",
    quickQuestions: ["社区介绍", "新手指南", "设置中心", "生活助手"],
  },
  {
    id: "onchain",
    name: "链上猎手",
    title: "全链侦察",
    quote: "链上没有我不知道的",
    desc: "Onchain OS 全能侦察兵。钱包查询、聪明钱追踪、Meme扫链、安全检测，只负责链上数据",
    skills: ["钱包查询", "聪明钱追踪", "DEX Swap", "安全检测"],
    colors: {
      hex: "#A78BFA",
      gradient: "from-[#A78BFA] to-[#7C3AED]",
      glow: "shadow-[0_0_40px_rgba(167,139,250,0.4)]",
    },
    img: "agent-onchain",
    welcome: "全链侦察就位。钱包查询、聪明钱追踪、Meme扫链、跨链桥、安全检测 — 链上没有我不知道的。说吧，查什么？🔍",
    quickQuestions: ["💰 查询余额", "🔍 搜索代币", "🐋 聪明钱信号", "🛡️ 安全检测"],
  },
  {
    id: "zhuge",
    name: "诸葛策略",
    title: "合约军师",
    quote: "运筹帷幄，弹无虚发",
    desc: "OKX合约策略师。HURST趋势+布林带+Pivot三策略共振，关键指标一目了然，每步都有数据支撑",
    skills: ["BTC/ETH/SOL分析", "HURST趋势", "多币信号", "VBT回测"],
    colors: {
      hex: "#C084FC",
      gradient: "from-[#C084FC] to-[#7E22CE]",
      glow: "shadow-[0_0_40px_rgba(192,132,252,0.4)]",
    },
    img: "agent-zhuge",
    welcome: "运筹帷幄，弹无虚发。BTC/ETH/SOL 三大主力合约深度分析，HURST趋势+布林带+Pivot三策略共振。说出币种，我给你作战计划。📊",
    quickQuestions: ["📊 BTC 深度分析", "🔍 多币信号扫描", "📋 当前持仓", "📈 策略回测"],
  },
  {
    id: "wealth",
    name: "稳盈管家",
    title: "收益护航",
    quote: "睡得着才是好投资",
    desc: "保守稳重的老管家，不求暴富只求安稳，每一分钱都算得明明白白",
    skills: ["稳定币理财", "蓝筹定投", "DeFi 收益", "低风险策略"],
    colors: {
      hex: "#34D399",
      gradient: "from-[#34D399] to-[#0D9488]",
      glow: "shadow-[0_0_40px_rgba(52,211,153,0.4)]",
    },
    img: "agent-wealth",
    welcome: "睡得着才是好投资。稳定币理财、蓝筹定投、DeFi 收益、低风险策略——每一分钱都算得明明白白。",
    quickQuestions: ["🛡️ 稳定币收益排行", "💎 蓝筹定投计划", "📊 低风险组合", "🏦 DeFi收益对比"],
  },
  {
    id: "reward",
    name: "派奖福星",
    title: "好运派奖",
    quote: "你的运气我承包了",
    desc: "喜庆热闹的气氛组，像过年塞红包的长辈，热情又大方",
    skills: ["活动奖励", "竞赛排行", "空投领取", "邀请返佣"],
    colors: {
      hex: "#FB923C",
      gradient: "from-[#FB923C] to-[#EC4899]",
      glow: "shadow-[0_0_40px_rgba(251,146,60,0.4)]",
    },
    img: "agent-reward",
    welcome: "你的运气我承包了！活动奖励、竞赛排行、空投领取、邀请返佣——哪里有奖哪里就有我，好运不断！🎁",
    quickQuestions: ["🎁 最新活动", "🏅 我的排名", "💸 领取空投", "👥 邀请好友"],
  },
];
