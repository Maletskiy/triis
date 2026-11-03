#!/bin/bash
# Защита от порчи .htaccess: типограф однажды заменил «-» на «—» в RewriteRule,
# и Apache начал отдавать 500 на все запросы. Проверяем синтаксис перед деплоем.
set -euo pipefail
cd "$(dirname "$0")/.."

FILE="${1:-dist/.htaccess}"
fail=0

if [ ! -f "$FILE" ]; then
  echo "нет файла $FILE" >&2
  exit 1
fi

if grep -nE 'Rewrite(Rule|Cond)[^#]*—' "$FILE"; then
  echo "в правилах перезаписи оказалось длинное тире" >&2
  fail=1
fi

grep -q 'RewriteRule ^ - \[L\]' "$FILE" || { echo "пропало правило «отдать файл как есть»" >&2; fail=1; }
grep -q 'DOCUMENT_ROOT}/index.html -f' "$FILE" || { echo "пропала защита от цикла в SPA-фолбэке" >&2; fail=1; }

if [ "$fail" = "0" ]; then
  echo "правила .htaccess в порядке"
fi
exit "$fail"
