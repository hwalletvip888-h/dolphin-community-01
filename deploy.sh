#!/bin/bash
set -e

# ============================================
#  海豚社区 部署脚本
#  前端 → api.hvip.ink (FE_HOST)
#  所有密钥走环境变量，不硬编码
# ============================================
# 需要设置的环境变量:
#   FE_HOST          前端服务器 IP
#   MCP_API_URL      MCP API 地址 (如 http://x.x.x.x:3000/api/h/v1)
#   DEEPSEEK_API_KEY DeepSeek API Key
#   JWT_SECRET      JWT signing secret (must match MCP server)
# ============================================

FE_HOST="${FE_HOST:?请设置 FE_HOST 环境变量}"
FE_PATH="/root/dolphin-community/frontend"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  海豚社区 部署脚本"
echo "  前端 → ${FE_HOST}"
echo "============================================"

# ── 1. 构建前端 ──
echo ""
echo "[1/3] 构建前端..."
cd "${ROOT}/frontend"
npm run build 2>&1 | tail -5
echo "  ✓ 构建完成"

# ── 2. 部署前端 ──
echo ""
echo "[2/3] 部署前端 → ${FE_HOST}..."

# Create directory if not exists
ssh root@${FE_HOST} "mkdir -p ${FE_PATH}/data"

# Upload all files except node_modules
echo "  上传文件..."
cd "${ROOT}/frontend"
tar czf - .next package.json package-lock.json next.config.ts tsconfig.json postcss.config.js tailwind.config.ts public/ ecosystem.config.js 2>/dev/null | \
  ssh root@${FE_HOST} "cd ${FE_PATH} && tar xzf - && find . -name '._*' -delete && echo '  ✓ 文件上传完成'"

# Install dependencies on server (compile native modules for Linux)
echo "  安装依赖..."
ssh root@${FE_HOST} "cd ${FE_PATH} && npm install --omit=dev 2>&1 | tail -3"

# Set env vars from local environment
echo "  配置环境变量..."
ssh root@${FE_HOST} "cat > ${FE_PATH}/.env.local << 'EOF'
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
MCP_API_URL=${MCP_API_URL}
JWT_SECRET=${JWT_SECRET}
MCP_API_KEY=${MCP_API_KEY}
MEM0_API_URL=${MEM0_API_URL}
EOF
echo '  ✓ 环境变量已配置'"

# Restart frontend (delete + fuser -k + sleep = no port conflicts)
echo "  重启前端服务..."
ssh root@${FE_HOST} "pm2 delete frontend 2>/dev/null; fuser -k 3101/tcp 2>/dev/null; sleep 2; cd ${FE_PATH} && pm2 start 'npx next start -p 3101' --name frontend --cwd ${FE_PATH} && pm2 save 2>&1 | tail -5"
echo "  ✓ 前端已重启"

# ── 3. 验证 ──
echo ""
echo "[3/3] 验证部署..."
sleep 3

echo "  域名:"
curl -sk -o /dev/null -w "    https://api.hvip.ink → HTTP %{http_code}\n" --max-time 10 2>/dev/null
curl -sk -o /dev/null -w "    https://api.hvip.ink/app → HTTP %{http_code}\n" --max-time 10 2>/dev/null

echo ""
echo "============================================"
echo "  部署完成！"
echo "  前端地址: https://api.hvip.ink"
echo "============================================"
