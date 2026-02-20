#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Knowra 部署自动化设置"
echo "=========================================="
echo ""

echo "📋 检查前置条件..."

if ! command -v git &> /dev/null; then
  echo "❌ 未安装 Git"
  exit 1
fi
echo "✅ Git 已安装"

if ! command -v docker &> /dev/null; then
  echo "❌ 未安装 Docker"
  echo "   请访问: https://docs.docker.com/get-docker/"
  exit 1
fi
echo "✅ Docker 已安装: $(docker --version)"

if command -v docker compose &> /dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE="docker-compose"
else
  echo "❌ Docker Compose 未安装"
  exit 1
fi
echo "✅ Docker Compose 已安装"

echo ""
echo "⚙️  配置环境变量..."

if [ -f ".env.prod" ]; then
  echo "⚠️  .env.prod 已存在，跳过创建"
  read -p "   是否覆盖? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm .env.prod
  else
    echo "   使用现有配置继续"
    cat .env.prod
  fi
fi

if [ ! -f ".env.prod" ]; then
  DB_PASSWORD=$(openssl rand -base64 16)

  echo "📝 生成 .env.prod..."
  cp .env.prod.example .env.prod

  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/change_me_to_secure_password_123456/$DB_PASSWORD/" .env.prod
  else
    sed -i "s/change_me_to_secure_password_123456/$DB_PASSWORD/" .env.prod
  fi

  echo "✅ 已生成随机数据库密码"
  echo ""
  echo "请编辑 .env.prod 文件并设置:"
  echo "  - DB_PASSWORD: $DB_PASSWORD (已自动生成)"
  echo "  - NEXT_PUBLIC_API_BASE_URL: /api (默认已配置)"
  echo "  - 其他API密钥 (如需要)"
  echo ""

  read -p "按Enter继续..."
fi

echo ""
echo "🔧 设置执行权限..."
chmod +x deploy.sh
chmod +x backup.sh
chmod +x monitor.sh
chmod +x restore.sh
chmod +x setup-deployment.sh
echo "✅ 脚本权限已设置"

echo ""
echo "📦 构建Docker镜像..."
read -p "是否现在构建镜像? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  $COMPOSE -f docker-compose.prod.yml build
  echo "✅ 镜像构建完成"
fi

echo ""
echo "▶️  启动容器..."
read -p "是否现在启动容器? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  $COMPOSE -f docker-compose.prod.yml up -d
  echo "✅ 容器已启动"

  echo ""
  echo "⏳ 等待服务启动... (约30秒)"
  sleep 30

  echo ""
  echo "🗄️  执行数据库迁移..."
  if $COMPOSE -f docker-compose.prod.yml exec -T api bash -lc "cd /app && pnpm --dir packages/infrastructure prisma:migrate:deploy"; then
    echo "✅ 数据库迁移完成"
  else
    echo "⚠️  数据库迁移可能失败，请检查日志"
  fi
fi

echo ""
echo "📅 设置自动备份 (cron)..."
read -p "是否设置每日自动备份? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  BACKUP_CMD="0 2 * * * cd $(pwd) && ./backup.sh"

  if (crontab -l 2>/dev/null | grep -q "backup.sh"); then
    echo "⚠️  自动备份任务已存在"
  else
    (crontab -l 2>/dev/null; echo "$BACKUP_CMD") | crontab -
    echo "✅ 已设置每日 02:00 自动备份"
  fi
fi

echo ""
echo "=========================================="
echo "✅ 设置完成!"
echo "=========================================="
echo ""
echo "📚 后续步骤:"
echo ""
echo "1️⃣  验证服务状态:"
echo "   ./monitor.sh"
echo ""
echo "2️⃣  查看日志:"
echo "   $COMPOSE -f docker-compose.prod.yml logs -f"
echo ""
echo "3️⃣  访问应用:"
echo "   Web: http://localhost"
echo "   API: http://localhost/api"
echo ""
