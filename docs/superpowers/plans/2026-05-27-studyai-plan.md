# StudyAI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack AI learning planning & self-discipline platform with Next.js, TailwindCSS, shadcn/ui, TypeScript, mock services.

**Architecture:** Service abstraction layer (mock → real), Zustand state management, App Router pages, modular components. Mock data first, real Supabase/OpenAI later.

**Tech Stack:** Next.js 15, TypeScript strict, TailwindCSS, shadcn/ui, Zustand, Recharts, Vercel deploy

---

## File Structure

```
study-ai/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx              # Root layout: ThemeProvider + AuthProvider + Nav
│   │   ├── page.tsx                # Home: Hero + Slogan + ChatPreview
│   │   ├── login/page.tsx          # Login: Email/Google form
│   │   ├── chat/page.tsx           # Chat: Full AI planning conversation
│   │   ├── plan/[id]/page.tsx      # Plan detail: Timeline + DayCards + TheoryPanel
│   │   ├── today/page.tsx          # Today: TaskList + CheckinDialog
│   │   ├── dashboard/page.tsx      # Dashboard: Charts + Stats
│   │   └── settings/page.tsx       # Settings: Profile + Preferences
│   ├── components/
│   │   ├── ui/                     # shadcn base (button, card, input, dialog, etc.)
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   ├── chat/
│   │   │   ├── chat-bubble.tsx
│   │   │   ├── chat-input.tsx
│   │   │   ├── chat-messages.tsx
│   │   │   ├── mode-selector.tsx
│   │   │   └── plan-preview-card.tsx
│   │   ├── plan/
│   │   │   ├── plan-timeline.tsx
│   │   │   ├── day-task-card.tsx
│   │   │   ├── theory-panel.tsx
│   │   │   └── progress-bar.tsx
│   │   ├── checkin/
│   │   │   ├── task-checklist.tsx
│   │   │   ├── checkin-dialog.tsx
│   │   │   └── daily-summary.tsx
│   │   ├── dashboard/
│   │   │   ├── streak-card.tsx
│   │   │   ├── completion-chart.tsx
│   │   │   ├── focus-chart.tsx
│   │   │   └── stats-grid.tsx
│   │   ├── home/
│   │   │   ├── hero-section.tsx
│   │   │   └── home-chat.tsx
│   │   └── shared/
│   │       ├── theme-toggle.tsx
│   │       ├── logo.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── empty-state.tsx
│   │       └── ai-typing-indicator.tsx
│   ├── services/
│   │   ├── types.ts               # Service interfaces
│   │   ├── auth.mock.ts           # Mock auth
│   │   ├── chat.mock.ts           # Mock AI chat with conversation trees
│   │   ├── plan.mock.ts           # Mock plan CRUD
│   │   ├── checkin.mock.ts        # Mock checkin records
│   │   └── analytics.mock.ts     # Mock analytics data
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── chat-store.ts
│   │   ├── plan-store.ts
│   │   └── checkin-store.ts
│   ├── prompts/
│   │   ├── system-prompts.ts      # All system prompts
│   │   └── prompt-templates.ts    # Prompt templates
│   ├── hooks/
│   │   ├── use-chat.ts
│   │   ├── use-plan.ts
│   │   ├── use-checkin.ts
│   │   ├── use-analytics.ts
│   │   └── use-theme.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── mock-delay.ts
│   │   └── cn.ts
│   └── types/
│       ├── plan.ts
│       ├── chat.ts
│       ├── user.ts
│       └── checkin.ts
├── public/
│   └── logo.svg
├── .env.example
├── components.json              # shadcn config
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

### Task 1: Project Initialization

**Create:** Complete Next.js project with all config files

- [ ] **Step 1: Create Next.js project**

```bash
cd E:\study-ai
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git --use-npm
```

- [ ] **Step 2: Install all dependencies**

```bash
cd E:\study-ai
npm install zustand recharts lucide-react next-themes clsx tailwind-merge class-variance-authority
npm install -D @types/node
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card input dialog textarea avatar dropdown-menu separator sheet tabs progress scroll-area badge popover tooltip
```

- [ ] **Step 4: Create .env.example**

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=StudyAI

# Feature Flags (set to "mock" or "real")
NEXT_PUBLIC_AUTH_MODE=mock
NEXT_PUBLIC_CHAT_MODE=mock
NEXT_PUBLIC_DB_MODE=mock
```

- [ ] **Step 5: Update tailwind.config.ts**

Add dark mode class strategy, custom colors for StudyAI theme.

- [ ] **Step 6: Update globals.css**

Add dark theme base styles, CSS variables for StudyAI color system.

- [ ] **Step 7: Create lib/cn.ts**

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 8: Commit**

```bash
cd E:\study-ai && git init && git add -A && git commit -m "feat: init project with next.js, tailwindcss, shadcn/ui"
```

---

### Task 2: Type Definitions

**Files:**
- Create: `src/types/plan.ts`
- Create: `src/types/chat.ts`
- Create: `src/types/user.ts`
- Create: `src/types/checkin.ts`

Define all TypeScript interfaces for the project.

---

### Task 3: Service Layer - Types & Mock Auth

**Files:**
- Create: `src/services/types.ts`
- Create: `src/services/auth.mock.ts`
- Create: `src/lib/mock-delay.ts`

---

### Task 4: Service Layer - Mock Chat

**Files:**
- Create: `src/services/chat.mock.ts`

Implement AI chat mock with conversation trees for quick/detail modes.

---

### Task 5: Service Layer - Mock Plan & Checkin & Analytics

**Files:**
- Create: `src/services/plan.mock.ts`
- Create: `src/services/checkin.mock.ts`
- Create: `src/services/analytics.mock.ts`

---

### Task 6: AI Prompt Templates

**Files:**
- Create: `src/prompts/system-prompts.ts`
- Create: `src/prompts/prompt-templates.ts`

---

### Task 7: Zustand Stores

**Files:**
- Create: `src/stores/auth-store.ts`
- Create: `src/stores/chat-store.ts`
- Create: `src/stores/plan-store.ts`
- Create: `src/stores/checkin-store.ts`

---

### Task 8: Shared UI Components

**Files:**
- Create: `src/components/shared/theme-toggle.tsx`
- Create: `src/components/shared/logo.tsx`
- Create: `src/components/shared/loading-spinner.tsx`
- Create: `src/components/shared/empty-state.tsx`
- Create: `src/components/shared/ai-typing-indicator.tsx`

---

### Task 9: Layout Components

**Files:**
- Create: `src/components/layout/navbar.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/footer.tsx`

---

### Task 10: Root Layout & Theme System

**Files:**
- Create: `src/hooks/use-theme.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

---

### Task 11: Home Page

**Files:**
- Create: `src/components/home/hero-section.tsx`
- Create: `src/components/home/home-chat.tsx`
- Modify: `src/app/page.tsx`

---

### Task 12: Login Page

**Files:**
- Modify: `src/app/login/page.tsx`

---

### Task 13: Chat Components & Chat Page (Core)

**Files:**
- Create: `src/components/chat/chat-bubble.tsx`
- Create: `src/components/chat/chat-input.tsx`
- Create: `src/components/chat/chat-messages.tsx`
- Create: `src/components/chat/mode-selector.tsx`
- Create: `src/components/chat/plan-preview-card.tsx`
- Create: `src/hooks/use-chat.ts`
- Modify: `src/app/chat/page.tsx`

---

### Task 14: Plan Components & Plan Page

**Files:**
- Create: `src/components/plan/plan-timeline.tsx`
- Create: `src/components/plan/day-task-card.tsx`
- Create: `src/components/plan/theory-panel.tsx`
- Create: `src/components/plan/progress-bar.tsx`
- Create: `src/hooks/use-plan.ts`
- Modify: `src/app/plan/[id]/page.tsx`

---

### Task 15: Checkin Components & Today Page

**Files:**
- Create: `src/components/checkin/task-checklist.tsx`
- Create: `src/components/checkin/checkin-dialog.tsx`
- Create: `src/components/checkin/daily-summary.tsx`
- Create: `src/hooks/use-checkin.ts`
- Modify: `src/app/today/page.tsx`

---

### Task 16: Dashboard Components & Dashboard Page

**Files:**
- Create: `src/components/dashboard/streak-card.tsx`
- Create: `src/components/dashboard/completion-chart.tsx`
- Create: `src/components/dashboard/focus-chart.tsx`
- Create: `src/components/dashboard/stats-grid.tsx`
- Create: `src/hooks/use-analytics.ts`
- Modify: `src/app/dashboard/page.tsx`

---

### Task 17: Settings Page

**Files:**
- Modify: `src/app/settings/page.tsx`

---

### Task 18: README & Final Polish

**Files:**
- Create: `README.md`
- Update: `src/app/layout.tsx` (SEO metadata)

---
