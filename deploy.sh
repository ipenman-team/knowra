#!/bin/bash
set -e

if command -v docker compose &> /dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE="docker-compose"
else
  echo "❌ Docker Compose 未安装"
  exit 1
fi

echo "=========================================="
echo "🚀 Contexta 部署"
echo "=========================================="
echo ""

if [ ! -f ".env.prod" ]; then
  echo "❌ 未找到 .env.prod"
  echo "   运行: cp .env.prod.example .env.prod"
  exit 1
fi

echo "📦 构建镜像..."
$COMPOSE -f docker-compose.prod.yml build

echo ""
echo "▶️  启动容器..."
$COMPOSE -f docker-compose.prod.yml up -d

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
echo "🗄️  执行数据库迁移..."
if ! $COMPOSE -f docker-compose.prod.yml exec -T api bash -lc "cd /app && pnpm -F @contexta/infrastructure prisma:migrate:deploy"; then
  echo "⚠️  数据库迁移失败，请检查日志"
  echo "   运行: $COMPOSE -f docker-compose.prod.yml logs --tail=200 api"
fi

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

if curl -s -f http://localhost > /dev/null 2>&1; then
  echo "✅ Web: / 正常"
else
  echo "⚠️  Web: / 异常"
fi

echo ""
echo "✅ 部署完成"
