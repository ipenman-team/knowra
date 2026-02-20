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

if [ $# -eq 0 ]; then
  echo "❌ 错误: 未指定备份文件"
  echo "用法: $0 <backup_file>"
  echo "示例: $0 backups/knowra_20240116_120000.sql.gz"
  echo ""
  echo "可用的备份文件:"
  ls -lh ./backups/knowra_*.sql.gz 2>/dev/null || echo "无备份文件"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 错误: 备份文件不存在: $BACKUP_FILE"
  exit 1
fi

echo "=========================================="
echo "🔄 Knowra 数据库恢复"
echo "=========================================="
echo ""
echo "⚠️  警告: 此操作将覆盖现有数据库!"
echo "备份文件: $BACKUP_FILE"
echo ""
read -p "确认恢复？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 已取消"
  exit 1
fi

echo ""
echo "🔄 准备恢复..."

if ! $COMPOSE -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
  echo "❌ PostgreSQL 容器未运行"
  exit 1
fi

echo "📥 恢复数据库..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | $COMPOSE -f docker-compose.prod.yml exec -T postgres psql -U knowra knowra
else
  $COMPOSE -f docker-compose.prod.yml exec -T postgres psql -U knowra knowra < "$BACKUP_FILE"
fi

echo ""
echo "✅ 数据库恢复成功!"
echo ""
echo "建议的后续操作:"
echo "1. 重启应用容器: $COMPOSE -f docker-compose.prod.yml restart api web nginx"
echo "2. 检查数据完整性"
echo "3. 验证功能正常"

