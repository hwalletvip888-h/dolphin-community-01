# 🐬 海豚社区 · Dolphin Community

> 打字就能交易。Web3 入门，没那么难。

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://python.org)
[![DeepSeek V4](https://img.shields.io/badge/DeepSeek-V4-7B3FE4)](https://deepseek.com)
[![OKX](https://img.shields.io/badge/OKX-Agent_Wallet_TEE-121212)](https://okx.com)
[![Claude Code](https://img.shields.io/badge/Claude_Code-2.1-8A3FFC)](https://claude.ai)

**在线地址**: [api.hvip.ink](https://api.hvip.ink) · [产品介绍](https://api.hvip.ink/ppt) · [桌面演示](https://youtu.be/k8zXkNImYns) · [手机演示](https://youtube.com/shorts/-Vyv4-caDcE)

---

## 项目简介

海豚社区是一款 **AI 对话式交互的 Web3 社区 App**。

> 去年 10 月，我们引导 **300+ 社区用户**首次使用 OKX Web3 Wallet，统一反馈：**用不明白**——不会看链、不会跟单、不懂止损止盈。

为此，我们基于 **OKX Agent Wallet + Onchain OS + OKX Agent Trade Kit** 构建了 **6 个 AI Agent**，提供两大核心功能：

<table>
<tr>
<td width="50%">

### 🔗 链上赚币（跟单）

Onchain OS Skill 组合模拟交易指标  
→ 生成 7×24h 模拟数据库  
→ 用户按胜率/盈利跟单  
→ **Agent 统一决策止损止盈**（用户可设最大限额）

</td>
<td width="50%">

### 📊 合约策略（量化）

OKX Agent Trade Kit 构建 AI 量化 Agent  
→ VBT Pro 回测验证  
→ 7×24h 模拟盘信号下单  
→ 构建可复用的策略数据库

</td>
</tr>
</table>

**App 将于 6 月初上线。Build 🔥**

---

## 🚀 创新亮点

| 传统跟单工具 | 海豚社区 Agent |
|------------|----------------|
| 需要手动设置止损止盈 | Agent 自动决策（用户可设上限） |
| 只能跟实盘大V | 基于 7×24h 模拟盘的**数据驱动**跟单 |
| 信号来源单一 | 多 Agent 协同：预测 + 链上 + 量化 + 风控 |
| 钱包操作复杂 | 邮箱即钱包，TEE 自动托管 |
| 没有记忆 | 每个 Agent 独立记忆，越聊越懂你 |

**OKX Degen Odyssey · Track 2: AI Agent × Agent Wallet 参赛项目。**

---

## 项目结构

```
dolphin-community/
├── frontend/                  # Next.js 15 Web 前端
│   ├── app/
│   │   ├── page.tsx          # 首页 — 邮箱登录/注册
│   │   ├── layout.tsx        # 根布局 & viewport 配置
│   │   ├── globals.css       # 全局样式 (Tailwind + 自定义)
│   │   ├── app/page.tsx      # 核心 — 6 Agent 对话界面
│   │   ├── ppt/page.tsx      # 产品介绍页 (用户向)
│   │   ├── xcup/page.tsx     # 参赛着陆页
│   │   └── api/
│   │       ├── chat/route.ts # AI 对话路由 → DeepSeek V4
│   │       ├── wallet/route.ts # 钱包代理 → MCP API
│   │       └── signals/route.ts # 信号聚合 → MCP API
│   ├── components/
│   │   ├── ResponseCard.tsx  # 智能响应卡片 (余额/行情/信号等)
│   │   └── hwallet/ui/      # 共享 UI 组件
│   ├── lib/
│   │   ├── db.ts             # SQLite 对话数据库
│   │   ├── fetch.ts          # safeFetch (空响应保护)
│   │   ├── memory.ts         # Mem0 语义记忆客户端
│   │   ├── signal-db.ts      # 信号钱包信誉数据库
│   │   └── ratelimit.ts      # 请求频率限制
│   ├── next.config.ts        # Next.js 配置 (含安全响应头)
│   └── tailwind.config.ts
├── mcp-api/
│   ├── server.py             # FastAPI MCP 后端 (1582 行)
│   │                         # · CCXT 行情数据
│   │                         # · OnchainOS 钱包/信号/Swap
│   │                         # · Polymarket 预测市场
│   │                         # · JWT 认证 & 多用户会话隔离
│   │                         # · Agent 7×24 工作循环
│   └── mem0_server.py        # Mem0 记忆服务 (Agent + 个人记忆)
├── .github/workflows/        # CI/CD — push main 自动部署
├── deploy.sh                 # 本地一键部署脚本
└── ARCHITECTURE.md           # 详细架构文档
```

## 6 个 AI Agent

| Agent | 专长 | 一句话 |
|-------|------|--------|
| 🔮 **AI预言帝** | Polymarket 预测市场 | 赔率分析、下单、持仓管理 |
| 🎯 **链上猎手** | 全链数据引擎 | 钱包查询、Swap、Meme扫描、安全检测 |
| 🧠 **诸葛策略** | 量化合约分析 | HURST+布林带+Pivot 策略共振 |
| 🐬 **小海豚** | 新手引导 | 充币、提币、转账、兑换指引 |
| 💰 **稳盈管家** | 稳健理财 | 稳定币收益、蓝筹定投、DeFi |
| 🎁 **派奖福星** | 福利运营 | 活动、排行、空投 |

每个 Agent 有独立记忆空间 — 换一个 Agent 不会串记忆。

## 技术架构

```
用户 (浏览器)
    │
    ▼
┌──────────────────────┐
│  Next.js 15 前端      │  api.hvip.ink
│  · React 19 + Tailwind │  PM2 (fork)
│  · motion 动画         │
│  · SQLite (对话存储)   │
└──────┬───────────────┘
       │ JWT (HMAC-SHA256)
       ▼
┌──────────────────────┐
│  MCP API (FastAPI)    │  MCP Server :3000
│  · CCXT → OKX 行情     │  PM2 (fork)
│  · OnchainOS CLI       │
│  · Polymarket          │
│  · 用户会话隔离(HOME)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  外部服务              │
│  · DeepSeek V4 (LLM)  │  Anthropic 兼容 API
│  · OKX Agent Wallet   │  TEE 硬件安全
│  · OnchainOS          │  多链网关
│  · Mem0 + Chroma      │  向量记忆库
└──────────────────────┘
```

## 核心特性

- **邮箱即钱包** — OKX Agent Wallet TEE 自动创建，不记助记词
- **打字即交易** — "用 100U 买 BTC"，Agent 分析 + 执行
- **6 Agent 有记忆** — 每人独立人格 + 专属记忆，越聊越懂你
- **多用户就绪** — JWT 认证、会话隔离、对话按用户 scope
- **生产级安全** — CSP、XSS 防护、API Key 认证、Rate Limit

## 环境变量

部署需要设置以下环境变量：

```bash
DEEPSEEK_API_KEY   # DeepSeek API 密钥
MCP_API_URL        # MCP API 地址 (如 http://x.x.x.x:3000/api/h/v1)
JWT_SECRET         # JWT 签名密钥 (前后端必须一致)
MCP_API_KEY        # MCP API 内部认证密钥 (可选)
MEM0_API_URL       # Mem0 记忆服务地址 (如 http://x.x.x.x:8888)
FE_HOST            # 前端服务器 IP (部署用)
SSH_PRIVATE_KEY    # 服务器 SSH 密钥 (CI/CD 用)
```

## 本地开发

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

MCP API 需要在服务器上运行（依赖 onchainos CLI 和 CCXT）：

```bash
cd mcp-api
pip install fastapi uvicorn ccxt mem0 chromadb
python3 server.py    # http://localhost:3000
python3 mem0_server.py  # http://localhost:8888
```

## 部署

```bash
./deploy.sh          # 需要 FE_HOST、DEEPSEEK_API_KEY 等环境变量
```

或直接 push main，GitHub Actions 自动部署。

## 团队

海豚量化 (Haitun) · 7 人 · 全栈开发、AI Agent、量化交易、OKX 生态

---

*Built on OKX for OKX. Agent Wallet · Onchain OS · Polymarket.*
