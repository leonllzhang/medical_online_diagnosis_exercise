# 本地开发指南

## 技术栈

- **框架**: Next.js 14 (App Router) + React 18
- **数据库**: PostgreSQL + Prisma ORM
- **样式**: Tailwind CSS
- **状态管理**: TanStack React Query
- **认证**: JWT（jose，无密码，通过姓名+手机号+科室登录）

## 环境要求

- Node.js 20+
- PostgreSQL 14+（或 Docker）
- npm

## 快速开始（推荐：Docker 数据库 + 本地开发服务）

### 1. 启动 PostgreSQL

方法 A — 使用 Docker（推荐）：

```bash
docker run -d \
  --name medlink-postgres \
  -e POSTGRES_DB=medlink_exam \
  -e POSTGRES_USER=medlink \
  -e POSTGRES_PASSWORD=medlink_pass \
  -p 5432:5432 \
  postgres:16-alpine
```

方法 B — 使用 Docker Compose 仅启动数据库：

```bash
docker compose up -d db
```

方法 C — 本地已安装 PostgreSQL：

确保 PostgreSQL 运行中，并创建数据库和用户：

```sql
CREATE USER medlink WITH PASSWORD 'medlink_pass';
CREATE DATABASE medlink_exam OWNER medlink;
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，将数据库连接地址改为 `localhost`：

```env
DATABASE_URL="postgresql://medlink:medlink_pass@localhost:5432/medlink_exam"
JWT_SECRET="dev-secret-change-in-production"
PASS_THRESHOLD=60
NEXT_PUBLIC_APP_NAME="医护互联考试考核系统"
```

> `.env` 已在 `.gitignore` 中，不会提交到仓库。

### 3. 安装依赖

```bash
npm install
```

### 4. 生成 Prisma 客户端并初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 将 schema 同步到数据库（建表）
npx prisma db push

# 导入种子数据（148 道题、35 个科室、4 个角色、管理员账号）
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可使用。

开发模式下支持：
- 热更新（Hot Module Replacement）
- 详细的错误堆栈
- TypeScript 类型检查

### 6. 登录

| 角色 | 姓名 | 手机号 | 科室 |
|------|------|--------|------|
| 管理员 | 管理员 | `admin` | 医务处 |
| 普通用户 | 任意 | 任意 | 选择一个科室 |

管理员登录后跳转到管理面板，普通用户跳转到考试页面。

## 项目结构

```
src/
├── app/
│   ├── (auth)/login/       # 登录页
│   ├── (auth)/register/    # 注册页
│   ├── admin/              # 管理面板
│   │   ├── dashboard/      # 统计大盘
│   │   ├── records/        # 考核记录管理
│   │   ├── roles/          # 角色 & 出题配置
│   │   ├── questions/      # 题库管理
│   │   ├── users/          # 用户管理
│   │   └── departments/    # 科室管理
│   ├── exam/               # 考试
│   │   ├── page.tsx        # 考试入口
│   │   ├── start/          # 答题界面
│   │   ├── result/[id]/    # 结果回顾
│   │   └── history/        # 个人考试记录
│   └── api/                # API 路由
│       ├── auth/           # 登录注册
│       ├── sessions/       # 考试会话（开始/答题/交卷/补考）
│       ├── records/        # 考试记录
│       └── roles/          # 角色管理
├── components/             # 共享组件
├── hooks/                  # React Hooks
├── lib/                    # 工具库（抽题、计分、认证）
└── types/                  # TypeScript 类型
```

## 常用命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产版本
npm run start

# 打开 Prisma Studio（数据库管理界面）
npm run db:studio

# 创建数据库迁移（schema 变更后）
npx prisma migrate dev --name 你的迁移描述

# 重置数据库（清空所有数据并重新导入种子）
npx prisma db push --force-reset && npm run db:seed

# 仅重新导入种子数据
npm run db:seed

# TypeScript 类型检查
npx tsc --noEmit
```

## 调试技巧

### 使用 Prisma Studio 查看数据

```bash
npm run db:studio
```

打开 http://localhost:5555 可视化浏览和编辑数据库。

### 查看 API 请求

所有 API 路由在 `src/app/api/` 下，可以直接在浏览器或 curl 调试：

```bash
# 获取角色列表
curl http://localhost:3000/api/roles

# 查看指定 session 的结果（需要替换 sessionId）
curl http://localhost:3000/api/sessions/{sessionId}/result
```

### 使用 React Developer Tools

安装 [React DevTools](https://react.dev/learn/react-developer-tools) 浏览器扩展，可调试组件状态和 React Query 缓存。

### 断点调试（VS Code）

在 VS Code 中按 `F5`，选择 "Node.js" 环境，然后选择 "Next.js"。或者直接在 VS Code 的 `.vscode/launch.json` 中配置：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: Debug",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://[^s]+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### 常见问题

**Q: `npx prisma db push` 报连接错误**
A: 确认 PostgreSQL 已启动，且 `.env` 中的 `DATABASE_URL` 正确指向 `localhost`。

**Q: `npm install` 后有 Prisma 相关的类型报错**
A: 执行 `npx prisma generate` 重新生成 Prisma Client。

**Q: 页面报 401/未登录**
A: 登录态通过 JWT 存储在 localStorage，清除 localStorage 中 `token` 字段后重新登录。

**Q: 开发时改了 Prisma schema 文件**
A: 执行 `npx prisma db push` 同步到数据库，然后重启 `npm run dev`。

## 使用 Docker Compose 完整运行（生产模式）

如果需要模拟生产环境，直接使用 Docker Compose：

```bash
docker compose up -d --build
```

但注意 Docker Compose 运行的是生产构建（`next build`），不会热更新，不适合日常开发调试。
