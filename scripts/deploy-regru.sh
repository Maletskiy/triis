#!/bin/bash
# Деплой собранного сайта (dist/) на хостинг reg.ru по SSH-ключу.
# Запуск: npm run deploy:regru   (или./scripts/deploy-regru.sh)
set -euo pipefail

cd "$(dirname "$0")/.."

KEY="../.secrets/deploy_key"
HOST="server37.hosting.reg.ru"
USER="u3695402"
REMOTE="/var/www/u3695402/data/www/triis.ru/"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes)
RSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes"
LOCAL="dist/"

if [ ! -f "$KEY" ]; then
  echo «Нет ключа $KEY» >&2
  exit 1
fi

echo "→ сборка"
npm run build >/dev/null

if [ ! -f "$LOCAL/index.html" ] || [ ! -f "$LOCAL/.htaccess" ]; then
  echo «Сборка неполная: нет index.html или.htaccess» >&2
  exit 1
fi

echo "→ загрузка на $HOST"
rsync -az --delete --itemize-changes \
  --exclude '.well-known' \
  -e "$RSH" "$LOCAL" "$USER@$HOST:$REMOTE" | sed 's/^/   /'

echo "→ проверка"
"${SSH[@]}" "$USER@$HOST" "ls -1 $REMOTE | head -20; du -sh $REMOTE"

STATUS=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: triis.ru' http://37.140.192.199/ || true)
echo "→ ответ сайта по HTTP: $STATUS"
