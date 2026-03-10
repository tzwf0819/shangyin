# 商印后端服务 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 设置默认环境变量（使用 MySQL，不使用 sqlite3）
ENV NODE_ENV=production
ENV DB_DIALECT=mysql
ENV DB_HOST=82.156.83.99
ENV DB_PORT=3306
ENV DB_USER=shangyin
ENV DB_PASS=shaoyansa
ENV DB_NAME=shangyin
ENV PORT=3000

# 复制 package 文件
COPY package*.json ./

# 安装生产依赖（不需要 sqlite3，使用 MySQL）
RUN npm install --only=production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/shangyin/ || exit 1

# 启动应用
CMD ["node", "app.js"]
