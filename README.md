# Knowra

> 面向企业内部知识库与问答系统（RAG）。

## 这是什么？

Knowra 旨在把企业内部零散的非结构化知识（文档、规范、SOP、FAQ 等）集中起来，让大家可以：

- 更容易检索到相关内容
- 基于“真实文档上下文”进行问答
- 在答案里保留来源，降低“凭空编造”的风险

## 仓库结构

pnpm monorepo：

- `apps/api`：后端服务（提供 API）
- `apps/web`：前端应用（Web UI）
- `packages/*`：分层的共享包（domain / application / infrastructure / shared 等）

## 快速开始（本地开发）

### 依赖

- Node.js >= 20
- pnpm（仓库已锁定 pnpm 版本）
- Docker（用于本地数据库）

### 启动步骤

1) 安装依赖

```bash
pnpm -w install
```

2) 配置环境变量（数据库连接）

```bash
cp .env.example .env
```

3) 启动本地数据库（PostgreSQL + pgvector）

```bash
pnpm db:up
```

4) 生成 Prisma Client 并执行数据库迁移

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

5) 启动后端与前端（建议开两个终端）

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

### 访问地址

- Web（Next.js）：http://localhost:3000
- API（NestJS）：http://localhost:3001
  - 健康检查：`GET /ping`

## 常用命令

```bash
pnpm lint
pnpm format
pnpm typecheck

pnpm db:up
pnpm db:down
```