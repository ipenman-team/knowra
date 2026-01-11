# API Testing 目录规范

目标：每个模块目录下都有 `test/unit` 与 `test/integration`，测试就近放置、清晰分层。

## 目录结构

- 单元测试：`src/<module>/test/unit/**/*.spec.ts`
- 集成测试：`src/<module>/test/integration/**/*.spec.ts`
- 端到端测试：`test/e2e/**/*.e2e-spec.ts`

示例：

- `src/page/test/unit/page.service.spec.ts`
- `src/page/test/integration/page.db.spec.ts`

## 命令

- 默认（只跑单元，最快）：`pnpm -F @contexta/api test`
- 全量（unit + integration + e2e）：`pnpm -F @contexta/api test:all`
- CI 全量串行：`pnpm -F @contexta/api test:ci`
- 只跑单元：`pnpm -F @contexta/api test:unit`
- 只跑集成：`pnpm -F @contexta/api test:integration`
- 只跑 e2e：`pnpm -F @contexta/api test:e2e`

## 约束

- `unit` 禁止访问真实 DB：统一 mock `PrismaService`。
- `integration` 若访问 DB：必须使用独立数据库或独立 schema，且用例可重复执行。
- `e2e` 若不需要 DB：在测试中 override `PrismaService`，避免隐式连接导致不稳定。
