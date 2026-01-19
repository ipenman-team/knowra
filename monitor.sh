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
echo "📊 Contexta 系统监控和健康检查"
echo "=========================================="
echo ""

echo "📦 容器状态:"
$COMPOSE -f docker-compose.prod.yml ps

echo ""
echo "💾 资源使用情况:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | tail -n +2 | awk '{
  print "  " $1 " | CPU: " $2 " | 内存: " $3 " " $4
}'

echo ""
echo "🌐 服务健康检查:"

echo -n "  Nginx (http://localhost/health): "
if curl -s -f http://localhost/health > /dev/null 2>&1; then
  echo "✅ 正常"
else
  echo "❌ 异常"
fi

echo -n "  API (http://localhost/api/ping): "
if curl -s -f http://localhost/api/ping > /dev/null 2>&1; then
  echo "✅ 正常"
else
  echo "❌ 异常"
fi

echo -n "  Web (http://localhost): "
if curl -s -f http://localhost > /dev/null 2>&1; then
  echo "✅ 正常"
else
  echo "❌ 异常"
fi

echo -n "  PostgreSQL: "
if $COMPOSE -f docker-compose.prod.yml exec -T postgres pg_isready -U contexta > /dev/null 2>&1; then
  echo "✅ 正常"
else
  echo "❌ 异常"
fi

echo ""
echo "📊 数据库统计:"
$COMPOSE -f docker-compose.prod.yml exec -T postgres psql -U contexta -d contexta -t -c "
SELECT
  'pages' as table_name, count(*) as count FROM pages WHERE is_deleted = false
UNION ALL
SELECT
  'rag_chunks', count(*) FROM rag_chunks WHERE is_deleted = false
" 2>/dev/null || echo "  ❌ 无法连接数据库"

echo ""
echo "🗄️  数据库备份:"
if [ -d "./backups" ]; then
  echo "  最近的备份:"
  ls -lh ./backups/contexta_*.sql.gz 2>/dev/null | tail -3 | awk '{
    print "    " $9 " (" $5 ")"
  }' || echo "    无备份文件"
else
  echo "  ⚠️  备份目录不存在"
fi

echo ""
echo "=========================================="
echo "✅ 监控完成"
echo "=========================================="

