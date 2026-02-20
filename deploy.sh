#!/bin/bash
set -e

if command -v git &> /dev/null && [ -d ".git" ]; then
  echo "🔄 同步代码..."
  if ! git fetch origin main --prune; then
    echo "⚠️  Git fetch 失败，继续使用本地代码"
  fi

  LOCAL_SHA=$(git rev-parse HEAD)
  REMOTE_SHA=$(git rev-parse origin/main 2>/dev/null || echo "")

  if [ -n "$REMOTE_SHA" ] && [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
    if git merge-base --is-ancestor "$LOCAL_SHA" "$REMOTE_SHA"; then
      git merge --ff-only "$REMOTE_SHA"
    else
      git reset --hard "$REMOTE_SHA"
    fi
  fi

  export GIT_COMMIT
  GIT_COMMIT=$(git rev-parse --short HEAD)
  echo "✅ 当前版本: $GIT_COMMIT"
else
  export GIT_COMMIT=unknown
fi

if command -v docker compose &> /dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE="docker-compose"
else
  echo "❌ Docker Compose 未安装"
  exit 1
fi

echo "=========================================="
echo "🚀 Knowra 部署"
echo "=========================================="
echo ""

if [ ! -f ".env.prod" ]; then
  echo "❌ 未找到 .env.prod"
  echo "   运行: cp .env.prod.example .env.prod"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env.prod
set +a

echo "📦 构建镜像..."
$COMPOSE -f docker-compose.prod.yml build

echo ""
echo "▶️  启动数据库..."
$COMPOSE -f docker-compose.prod.yml up -d postgres

echo ""
echo "⏳ 等待数据库就绪..."
DB_READY=0
for i in {1..30}; do
  if $COMPOSE -f docker-compose.prod.yml exec -T postgres pg_isready -U "${DB_USER:-knowra}" -d "${DB_NAME:-knowra}" > /dev/null 2>&1; then
    DB_READY=1
    break
  fi
  sleep 2
done
if [ "$DB_READY" -eq 1 ]; then
  echo "✅ 数据库就绪"
else
  echo "⚠️  数据库未就绪，尝试继续迁移"
fi

echo ""
echo "🗄️  执行数据库迁移..."
if ! $COMPOSE -f docker-compose.prod.yml run --rm --no-deps api bash -lc "cd /app && pnpm -F @knowra/infrastructure prisma:migrate:deploy"; then
  echo "⚠️  数据库迁移失败，请检查日志"
  echo "   运行: $COMPOSE -f docker-compose.prod.yml logs --tail=200 api"
fi

echo ""
echo "▶️  启动容器..."
$COMPOSE -f docker-compose.prod.yml up -d

echo ""
echo "🏷️  当前运行版本..."
if ! $COMPOSE -f docker-compose.prod.yml exec -T api bash -lc 'echo "api:${KNOWRA_GIT_COMMIT:-unknown}"'; then
  echo "⚠️  无法读取 API 版本"
fi
if ! $COMPOSE -f docker-compose.prod.yml exec -T knowra-ai bash -lc 'echo "knowra-ai:${KNOWRA_GIT_COMMIT:-unknown}"'; then
  echo "⚠️  无法读取 Knowra-AI 版本"
fi
if ! $COMPOSE -f docker-compose.prod.yml exec -T web bash -lc 'echo "web:${KNOWRA_GIT_COMMIT:-unknown}"'; then
  echo "⚠️  无法读取 Web 版本"
fi

echo ""
echo "🔄 重新加载 Nginx 配置..."
if ! $COMPOSE -f docker-compose.prod.yml exec -T nginx nginx -s reload; then
  echo "⚠️  Nginx reload 失败，尝试重启 nginx 容器..."
  $COMPOSE -f docker-compose.prod.yml restart nginx || true
fi

echo ""
echo "⏳ 等待服务启动... (约20秒)"
sleep 20

echo ""
echo "🌐 健康检查..."
if curl -s -f http://localhost/health > /dev/null 2>&1; then
  echo "✅ Nginx: /health 正常"
else
  echo "⚠️  Nginx: /health 异常"
fi

if curl -s -f http://localhost/api/ping > /dev/null 2>&1; then
  echo "✅ API: /api/ping 正常"
else
  echo "⚠️  API: /api/ping 异常"
fi

if curl -s -f http://localhost/knowra-ai/ping > /dev/null 2>&1; then
  echo "✅ Knowra-AI: /knowra-ai/ping 正常"
else
  echo "⚠️  Knowra-AI: /knowra-ai/ping 异常"
fi

if curl -s -f http://localhost > /dev/null 2>&1; then
  echo "✅ Web: / 正常"
else
  echo "⚠️  Web: / 异常"
fi

echo ""
echo "✅ 部署完成"
