# 商印后端服务 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装构建依赖（包括 python3 和 distutils）
RUN apk add --no-cache python3 make g++ py3-setuptools

# 复制 package 文件
COPY package*.json ./

# 安装依赖（使用 --ignore-scripts 跳过 sqlite3 编译）
RUN npm ci --only=production --ignore-scripts || npm install --only=production --ignore-scripts

# 如果有 sqlite3，尝试使用预编译版本
RUN if [ -f node_modules/sqlite3/package.json ]; then \
      cd node_modules/sqlite3 && npm install --ignore-scripts; \
    fi

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/shangyin/ || exit 1

# 启动应用
CMD ["node", "app.js"]
