部署说明 - Shangyin 后端与 Admin

目标环境假设
- 服务器系统：任意现代 Linux（例如 Ubuntu 20.04/22.04 或 CentOS 7/8/Stream）
- Node.js 环境（建议 Node 18+），npm 可用
- Nginx 已配置，将域名 www.yidasoftware.xyz/shangyin 反向代理到本机 3000 端口（你已完成）
- 仓库将被放置在 /root/shangyin

部署步骤（一键脚本）
1. 将仓库克隆到服务器：

   git clone <repo-url> /root/shangyin
   cd /root/shangyin

2. 确保 Node.js 与 npm 已安装：
   - Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -; sudo apt install -y nodejs
   - CentOS: curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -; sudo yum install -y nodejs

3. 运行部署脚本（脚本会拉取最新代码、构建 admin、安装后端依赖并尝试重启 systemd 服务）：

   cd /root/shangyin
   chmod +x scripts/deploy_server.sh
   sudo scripts/deploy_server.sh

4. 创建 systemd 服务（只需第一次）

   sudo chmod +x scripts/create_systemd_service.sh
   sudo SVC_USER=root scripts/create_systemd_service.sh

   该脚本会生成 /etc/systemd/system/shangyin.service，内容如下：

   [Unit]
   Description=Shangyin Backend Service
   After=network.target

   [Service]
   Type=simple
   User=root
   WorkingDirectory=/root/shangyin/shangyin-backend/backend
   Environment=NODE_ENV=production
   EnvironmentFile=/root/shangyin/.env
   ExecStart=/usr/bin/node /root/shangyin/shangyin-backend/backend/app.js
   Restart=on-failure
   RestartSec=5s

   [Install]
   WantedBy=multi-user.target

5. 配置 Nginx（你已完成）：
   - 反向代理 /shangyin 到 http://127.0.0.1:3000
   - 保证 location /shangyin/admin/ 正确代理静态资源，并保留 /shangyin/admin 的 SPA fallback（后端已经处理 admin/dist 的静态服务）

6. 环境变量与数据库
   - 脚本会在仓库根生成一个示例 .env（如果不存在），请编辑 `/root/shangyin/.env` 设置：

   使用 MySQL（默认）：
     PORT=3000
     NODE_ENV=production
     DB_DIALECT=mysql
     DB_HOST=82.156.83.99
     DB_PORT=3306
     DB_USER=shangyin
     DB_PASS=shaoyansa
     DB_NAME=shangyin

   使用 SQLite：
     PORT=3000
     NODE_ENV=production
     DB_DIALECT=sqlite
     DB_STORAGE=./shangyin-backend/backend/database/shangyin.db

   - 确保 `shangyin-backend/backend/database` 目录存在且可写（SQLite需要，MySQL不需要）。

7. 日志与调试
   - 使用 systemd 管理：
     sudo journalctl -u shangyin -f
   - 或查看后端输出（在服务目录下）：
     tail -n 200 shangyin-backend/backend/logs/*.log (如果你后续添加日志文件)

常见问题与建议
- 构建输出不在 Git：我们已添加 .gitignore 忽略 dist/、node_modules/ 等。
- 若希望 CI 构建并自动部署：可在 GitHub Actions 中添加 build 步骤，产物上传到服务器并重启服务。
- 如果生产环境无法直接构建：可在本地构建 admin，然后将 dist 上传到服务器对应目录。

安全建议
- 不要以 root 运行 Node 服务，建议创建单独用户（例如 `shangyin`）并在 systemd 中指定 User=shangyin。
- 使用 pm2 或 systemd 均可管理服务，本指南使用 systemd。

手动命令清单（便于复制）
```bash
# 克隆
sudo git clone <repo> /root/shangyin
cd /root/shangyin
# 构建 admin
cd shangyin-backend/admin
npm ci
npm run build
# 后端依赖
cd ../backend
npm ci
# 启动（或用 systemd）
node app.js
```

需要我为你：
- 把 systemd 的 User 改为非 root（并自动设置目录权限）；
- 或者为你写一个 GitHub Actions 的 CI/CD 流程把构建产物自动 rsync 到服务器并重启服务。

---
文件更新记录：添加 `scripts/deploy_server.sh`、`scripts/create_systemd_service.sh`、`DEPLOY.md`。