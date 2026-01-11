# @contexta/api（部署到 Cloudflare Workers）

这个目录是 `contexta` 的 API 服务，使用 NestJS + Prisma 提供页面（Page）CRUD 接口，并已做了 Cloudflare Workers 运行适配。

本 README 面向新手：从本地运行、改 wrangler 配置、配置环境变量到最终 `deploy` 每一步都写清楚“做了什么”。

## 你会部署出什么

- Worker 上跑一个 HTTP API
- 主要接口：
  - `GET /ping`：健康检查
  - `GET /pages`：列出页面（按更新时间倒序）
  - `GET /pages/:id`：获取页面
  - `POST /pages`：创建页面（title 必填）
  - `PUT /pages/:id`：保存页面
  - `DELETE /pages/:id`：删除页面

## 目录与入口说明

- Node 本地开发入口：`src/main.ts`
- Workers 入口：`src/worker.ts`
- wrangler 配置：`wrangler.toml`

## 前置条件

- Node.js >= 20
- pnpm（项目使用 workspace）
- 一个 Cloudflare 账号，并已在本机登录 `wrangler`
- 一个可从 Workers 访问的数据库连接（见“数据库与 Prisma 注意事项”）

## 一次性安装依赖（你在做什么）

在仓库根目录执行：

```bash
pnpm -r install
```

你在做：安装整个 monorepo 的依赖（包含 `apps/api`、Prisma 相关包、wrangler 等），保证后续能构建与发布。

## 本地运行（Node 模式）

```bash
pnpm dev:api
```

你在做：用 Nest 的 dev server 启动本地 API（默认端口 3001），适合日常开发调试。

## 本地运行（Workers 模式）

Workers 需要先构建（wrangler.toml 里配置了 build command，`wrangler dev` 也会触发构建；第一次建议手动跑一遍确保成功）：

```bash
pnpm -F @contexta/api build
pnpm -F @contexta/api dev:workers
```

你在做：

- `build`：把 `src/worker.ts` 编译到 `dist/worker.js`
- `dev:workers`：wrangler 启动本地 workerd，模拟线上 Workers 的 `fetch()` 执行环境，并把请求转发给 Nest（Fastify adapter）

## 修改 wrangler.toml（你在做什么）

文件：`apps/api/wrangler.toml`

```toml
name = "contexta-api"
main = "dist/worker.js"
compatibility_date = "2026-01-11"
compatibility_flags = ["nodejs_compat"]

[build]
command = "pnpm -F @contexta/api build"
```

字段解释：

- `name`：你的 Worker 名称（建议改成你自己的项目名）
- `main`：Worker 的入口文件（指向构建产物）
- `compatibility_date`：Workers 兼容日期（决定运行时行为）
- `compatibility_flags=["nodejs_compat"]`：开启 Node.js 兼容层，让 Nest/Fastify 的部分 Node 能力可用
- `[build].command`：每次 `wrangler dev/deploy` 前执行的构建命令

## 配置环境变量与密钥（你在做什么）

这个 API 至少需要：

- `TENANT_ID`：租户 id，不配就默认 `t1`
- `DATABASE_URL`：Prisma 连接串

推荐用 secret（更安全，不会出现在命令历史/日志里）：

```bash
pnpm -F @contexta/api exec wrangler secret put TENANT_ID
pnpm -F @contexta/api exec wrangler secret put DATABASE_URL
```

你在做：把敏感信息写入 Cloudflare 的 Worker 配置存储中，运行时注入给 `env`，不会提交进仓库。

验证一下变量是否写入：

```bash
pnpm -F @contexta/api exec wrangler secret list
```

## 部署到 Cloudflare Workers（你在做什么）

```bash
pnpm -F @contexta/api deploy:workers
```

你在做：

- 执行 `wrangler deploy`
- wrangler 先跑 `wrangler.toml` 里的 build command 生成 `dist/worker.js`
- 上传脚本并发布到 Cloudflare 边缘网络

部署成功后，wrangler 会输出一个可访问的 URL。

## 部署后验证（你在做什么）

拿到 URL 后，先用无数据库依赖的接口验证服务是否正常：

- `GET /ping` 应返回 `{"ok":true,"message":"pong","ts":"..."}`（HTTP 200）

然后再验证 DB 接口：

- `GET /pages`（如果数据库不可用，会返回 Prisma 相关错误）

## 数据库与 Prisma 注意事项（非常重要）

这个项目在 Workers 环境默认使用 `@prisma/client/edge`。

你需要确保 `DATABASE_URL` 是 Workers 可用的连接方式：

- 普通 Postgres TCP 连接串通常无法在 Workers 直接使用
- 需要使用“边缘可用/HTTP 代理类”的 Prisma 连接方案（例如 Prisma Accelerate / Data Proxy 类服务），并把它提供的连接串放进 `DATABASE_URL`

迁移（migrate）应该在 CI / 本地 / 服务器环境执行，而不是在 Worker 里执行：

- 参考仓库根目录脚本：`pnpm prisma:migrate` / `pnpm prisma:migrate:deploy`

## 常用命令速查

在仓库根目录：

```bash
pnpm dev:api
pnpm lint:api
pnpm typecheck
```

在 API 包（apps/api）：

```bash
pnpm -F @contexta/api build
pnpm -F @contexta/api test
pnpm -F @contexta/api dev:workers
pnpm -F @contexta/api deploy:workers
```

## 常见问题排查

### 1) `GET /ping` 正常，但 `GET /pages` 报错

大概率是数据库连接不可在 Workers 使用，检查：

- `DATABASE_URL` 是否已设置
- 是否为 Workers 可用的 Prisma/数据库连接方案

### 2) 本地 `wrangler dev` 跑起来但线上不行

检查：

- `wrangler.toml` 是否开启 `nodejs_compat`
- 是否把环境变量/secret 配齐（特别是 `DATABASE_URL`）
