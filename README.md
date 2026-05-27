# StudyAI — 你的 AI 自律成长教练

> AI 驱动的智能学习规划与自律成长平台

基于认知科学与 AI 技术，为你打造高度个性化、科学化的学习计划。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 15 | 全栈框架 (App Router) |
| TypeScript | 类型安全 |
| TailwindCSS v4 | 原子化样式 |
| shadcn/ui | 高质量 UI 组件 |
| Zustand | 轻量状态管理 |
| Recharts | 数据可视化图表 |
| next-themes | 深色/浅色模式 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量（Mock模式无需配置）
cp .env.example .env.local

# 3. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可看到效果。

**当前使用 Mock 模式**，无需配置任何外部服务即可完整体验所有功能：
- 用户登录/注册（输入任意邮箱密码即可）
- AI 对话规划
- 学习计划生成
- 每日任务打卡
- 数据面板

## 项目结构

```
src/
├── app/                    # App Router 页面
│   ├── layout.tsx          # 根布局 (Theme + Auth)
│   ├── page.tsx            # 首页
│   ├── login/page.tsx      # 登录注册
│   ├── chat/page.tsx       # AI 规划聊天
│   ├── plan/[id]/page.tsx  # 学习计划详情
│   ├── today/page.tsx      # 今日任务打卡
│   ├── dashboard/page.tsx  # 数据面板
│   └── settings/page.tsx   # 用户设置
├── components/
│   ├── ui/                 # shadcn 基础组件
│   ├── layout/             # Navbar, Footer
│   ├── chat/               # 聊天组件
│   ├── plan/               # 计划组件
│   ├── checkin/            # 打卡组件
│   ├── dashboard/          # 数据面板组件
│   ├── home/               # 首页组件
│   └── shared/             # 共享组件
├── services/               # 服务抽象层 (mock → 真实)
├── stores/                 # Zustand 状态管理
├── prompts/                # AI Prompt 模板
├── hooks/                  # 自定义 Hooks
├── lib/                    # 工具函数
└── types/                  # TypeScript 类型定义
```

## 页面功能

| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | `/` | AI 对话入口 + 模式选择 |
| 登录 | `/login` | 邮箱/Google 登录注册 |
| AI 规划 | `/chat` | 快速/深度两种规划模式 |
| 计划详情 | `/plan/:id` | 阶段时间线 + 任务卡片 |
| 今日任务 | `/today` | 打卡 + AI 复盘追问 |
| 数据面板 | `/dashboard` | 趋势图表 + AI 评估 |
| 设置 | `/settings` | 主题/偏好/账户管理 |

## 切换到真实服务

当准备好接入真实服务时：

```bash
# 1. 在 Supabase 创建项目，获取 URL 和 anon key
# 2. 获取 OpenAI API key
# 3. 修改 .env.local

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...
NEXT_PUBLIC_AUTH_MODE=real
NEXT_PUBLIC_CHAT_MODE=real
NEXT_PUBLIC_DB_MODE=real
```

## 部署到 Vercel

```bash
npm install -g vercel
vercel
```

## License

MIT
