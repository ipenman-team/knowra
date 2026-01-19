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

BACKUP_DIR="./backups"
KEEP_DAYS=${1:-7}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/contexta_$TIMESTAMP.sql"
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始备份数据库..." | tee -a "$LOG_FILE"

if $COMPOSE -f docker-compose.prod.yml exec -T postgres pg_dump -U contexta contexta > "$BACKUP_FILE"; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 备份成功: $BACKUP_FILE (大小: $SIZE)" | tee -a "$LOG_FILE"

  gzip "$BACKUP_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 压缩完成: ${BACKUP_FILE}.gz" | tee -a "$LOG_FILE"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 清理 $KEEP_DAYS 天前的备份..." | tee -a "$LOG_FILE"
  find "$BACKUP_DIR" -name "contexta_*.sql.gz" -mtime +$KEEP_DAYS -delete

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 最近的备份:" | tee -a "$LOG_FILE"
  ls -lh "$BACKUP_DIR"/contexta_*.sql.gz 2>/dev/null | tail -5 | tee -a "$LOG_FILE"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 备份流程完成" | tee -a "$LOG_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 备份失败" | tee -a "$LOG_FILE"
  exit 1
fi

