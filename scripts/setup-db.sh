#!/usr/bin/env bash
# ==========================================
# ZQCMS 数据库初始化脚本（本地 MySQL）
# 用法:
#   bash scripts/setup-db.sh            # 交互式输入 root 密码
#   bash scripts/setup-db.sh -p ROOT_PW # 命令行传密码
#   MYSQL_ROOT_PASSWORD=xxx bash scripts/setup-db.sh
# ==========================================

set -e

ROOT_PW="${MYSQL_ROOT_PASSWORD:-}"

# 解析参数
while getopts "p:" opt; do
  case $opt in
    p) ROOT_PW="$OPTARG" ;;
    *) ;;
  esac
done

# ---- 测试 MySQL 连接 ----
try_connect() {
  local pw="$1"
  if [ -n "$pw" ]; then
    MYSQL_PWD="$pw" mysql -u root -e "SELECT 1" &>/dev/null
  else
    MYSQL_PWD="" mysql -u root -e "SELECT 1" &>/dev/null
  fi
}

# 先尝试已有密码
if try_connect "$ROOT_PW"; then
  :
else
  # 交互式询问
  echo "🔐 MySQL root 需要密码认证"
  echo ""
  read -s -r -p "请输入 MySQL root 密码: " ROOT_PW
  echo ""

  if [ -z "$ROOT_PW" ]; then
    echo "❌ 密码不能为空"
    exit 1
  fi

  if ! try_connect "$ROOT_PW"; then
    echo ""
    echo "❌ 密码错误，请重试"
    echo ""
    echo "  确认方法：直接在终端执行下面命令测试密码是否正确"
    echo "  MYSQL_PWD='你的密码' mysql -u root -e 'SELECT 1'"
    echo ""
    echo "  如果命令成功，请运行:"
    echo "  export MYSQL_ROOT_PASSWORD='你的密码'"
    echo "  bash scripts/setup-db.sh"
    exit 1
  fi
fi

echo "✅ MySQL 连接成功"

# ---- 执行 init.sql ----
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo ""
echo "📦 执行数据库初始化..."

# 用 MYSQL_PWD 环境变量传递密码，避免 shell 转义问题
if [ -n "$ROOT_PW" ]; then
  MYSQL_PWD="$ROOT_PW" mysql -u root < "$SCRIPT_DIR/init.sql"
else
  mysql -u root < "$SCRIPT_DIR/init.sql"
fi

echo ""
echo "✅ 数据库初始化完成！"
echo ""
echo "下一步："
echo "  bun run db:seed          # 导入种子数据（分类、文章、首页区块）"
echo "  bun run dev              # 启动开发服务器（3 个应用）"
