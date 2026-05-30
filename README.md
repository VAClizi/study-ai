# StudyAI — 你的 AI 自律成长教练

[![License](https://img.shields.io/github/license/VAClizi/study-ai)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

> AI 驱动的智能学习规划与自律成长平台——基于认知科学的个性化 AI 教练，帮你制定计划、追踪进度、养成习惯。

[在线体验](https://study-ai-five-mu.vercel.app) · [报告问题](https://github.com/VAClizi/study-ai/issues)

---

## 核心功能

- **AI 学习规划** — 对话式交互生成结构化学习计划，支持快速规划和深度规划两种模式
- **交互式路线图** — 以节点式可视化展示阶段→周→天的学习路径层级结构
- **每日打卡** — AI 教练多轮复盘追问，根据完成状态生成建议性补充计划
- **数据面板** — 完成率趋势 / 专注度评估 / 每周分析仪表盘
- **教练人格** — 严格型 / 温和型 / 数据驱动型，三种 AI 教练风格可切换
- **国际化** — 中英文自动切换，IP 地理位置智能检测
- **深色模式** — 跟随系统主题，深色/浅色/自动三种方案

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 15 (App Router) | 全栈框架 |
| React 19 | UI 渲染 |
| TypeScript 5 | 类型安全 |
| TailwindCSS 4 | 原子化样式 |
| shadcn/ui + Base UI | 组件库 |
| NextAuth v5 (Auth.js) | 用户认证 |
| Drizzle ORM + Neon Postgres | 数据库 |
| Zustand | 状态管理 |
| Recharts | 数据可视化 |
| DeepSeek API | AI 对话与规划 |
| react-markdown | Markdown 渲染 |
| next-themes | 深色/浅色模式 |
| Vercel Analytics + Speed Insights | 性能监控 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 DATABASE_URL（Neon Postgres）、AUTH_SECRET、MIMO_API_KEY 等

# 3. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可体验。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `MIMO_API_KEY` | 是 | DeepSeek API Key（服务端） |
| `DATABASE_URL` | 是 | Neon Postgres 连接字符串 |
| `AUTH_SECRET` | 是 | NextAuth 密钥（`openssl rand -base64 32`） |
| `AUTH_GOOGLE_ID` | 否 | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | 否 | Google OAuth Client Secret |
| `AUTH_URL` | 否 | Auth 回调地址（生产环境设为实际域名） |
| `NEXT_PUBLIC_SITE_URL` | 否 | 站点 URL（SEO / OG 图片） |

## 项目结构

```
src/
├── app/                      # App Router 页面
│   ├── layout.tsx            # 根布局 (Theme + Auth Provider)
│   ├── page.tsx              # 首页
│   ├── login/page.tsx        # 登录注册
│   ├── chat/page.tsx         # AI 规划聊天
│   ├── plan/[id]/page.tsx    # 学习计划详情 + 路线图
│   ├── plans/page.tsx        # 计划列表
│   ├── today/page.tsx        # 今日任务打卡
│   ├── dashboard/page.tsx    # 数据面板
│   ├── settings/page.tsx     # 用户设置
│   └── api/                  # API 路由 (auth, chat)
├── components/
│   ├── ui/                   # shadcn 基础组件
│   ├── layout/               # Navbar, Footer
│   ├── chat/                 # 聊天 + 计划组件
│   ├── plan/                 # 路线图可视化组件
│   ├── checkin/              # 打卡 + 庆祝组件
│   ├── dashboard/            # 数据面板图表
│   ├── home/                 # 首页组件
│   └── shared/               # 共享组件 (粒子背景等)
├── auth/                     # NextAuth 认证配置
├── services/                 # AI 解析 + 聊天服务
├── stores/                   # Zustand 状态管理
├── prompts/                  # AI Prompt 模板 (6 人格 × 5 阶段)
├── hooks/                    # 自定义 Hooks (useChartColors 等)
├── lib/                      # 工具函数 (i18n, cn, plan-parser)
├── db/                       # Drizzle schema + 迁移
└── types/                    # TypeScript 类型定义
```

## 页面路由

| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | `/` | AI 对话入口 + 模式选择 |
| 登录 | `/login` | 邮箱 + Google OAuth 登录注册 |
| AI 规划 | `/chat` | 快速 / 深度规划 + 实时计划生成 |
| 计划列表 | `/plans` | 所有学习计划管理 |
| 计划详情 | `/plan/:id` | 时间线视图 + 交互式路线图 |
| 今日任务 | `/today` | 打卡 + AI 多轮复盘 |
| 数据面板 | `/dashboard` | 趋势图表 + 成长指标 |
| 设置 | `/settings` | 主题 / 语言 / 教练人格 / 账户管理 |

## 部署

```bash
npm install -g vercel
vercel --prod
```

## License

MIT
