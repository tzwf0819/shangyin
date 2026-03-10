# 配置检查报告

## 📅 检查日期
2026 年 3 月 10 日

## 🎯 检查目标
1. 检查 GitHub Actions 是否能部署到 `82.156.83.99`
2. 检查小程序连接的域名是否为 `tzwf.xyz/shangyin`

---

## ✅ 检查结果

### 1. GitHub Actions 部署配置

**文件**: `.github/workflows/deploy.yml`

#### 配置状态：⚠️ 需要配置 Secrets

**当前配置**：
```yaml
ssh-private-key: ${{ secrets.TENCENT_SSH_KEY }}
SSH_HOST: ${{ secrets.TENCENT_SSH_HOST }}
SSH_USER: ${{ secrets.TENCENT_SSH_USER }}
```

**分析**：
- ✅ GitHub Actions 工作流文件存在且配置正确
- ✅ 部署脚本完整，包含完整的 Docker 部署流程
- ⚠️ **需要在 GitHub 仓库配置以下 Secrets**：

| Secret 名称 | 应设置的值 | 说明 |
|------------|-----------|------|
| `TENCENT_SSH_KEY` | SSH 私钥内容 | 用于 SSH 登录服务器的私钥 |
| `TENCENT_SSH_HOST` | `82.156.83.99` | 目标服务器 IP 地址 |
| `TENCENT_SSH_USER` | `root` 或其他用户 | SSH 登录用户名 |

**部署流程**：
1. 推送到 `main` 分支触发
2. SSH 连接到目标服务器
3. 备份现有 `.env` 文件
4. 拉取最新代码
5. 恢复环境变量
6. Docker 构建并重启服务

**结论**：✅ 配置正确，但需要在 GitHub 仓库设置 Secrets

---

### 2. 微信小程序 API 地址配置

**文件**: `miniprogram/config/index.js`

#### 配置状态：✅ 已修正

**当前配置**：
```javascript
const DEFAULT_DEV_BASE_URL = 'https://tzwf.xyz';
const DEFAULT_PROD_BASE_URL = 'https://tzwf.xyz';
```

**分析**：
- ✅ 小程序已配置为连接 `tzwf.xyz`
- ✅ API 路径为 `/shangyin/`（通过 Nginx 代理）
- ✅ 完整 API 地址：`https://tzwf.xyz/shangyin/`

**后续操作**：
1. 在微信开发者工具中测试
2. 重新上传小程序代码
3. 提交审核

---

### 3. Nginx 代理配置

**文件**: `nginx_copy.conf`

#### 配置状态：✅ 正确

**当前配置**：
```nginx
location ^~ /shangyin/ {
    proxy_pass http://127.0.0.1:14444/;
    # ... 其他配置
}
```

**分析**：
- ✅ Nginx 配置正确，`/shangyin/` 代理到 Docker 容器（端口 14444）
- ✅ 域名 `tzwf.xyz` 已配置
- ✅ SSL 证书已配置

**访问路径**：
- 管理后台：`https://tzwf.xyz/shangyin/admin/`
- 后端 API：`https://tzwf.xyz/shangyin/`

---

### 4. 后端数据库配置

**文件**: `docker-compose.yml`, `backend/config/db.js`

#### 配置状态：✅ 正确

**当前配置**：
```
DB_HOST=82.156.83.99
DB_PORT=3306
DB_USER=shangyin
DB_PASS=shaoyansa
DB_NAME=shangyin
```

**分析**：
- ✅ 数据库主机配置为 `82.156.83.99`
- ✅ 数据库连接配置正确
- ✅ Docker Compose 和后端代码配置一致

---

## 📋 需要修改的内容

### 高优先级 🔴

#### 1. 配置 GitHub Secrets

**需要在 GitHub 仓库设置**：

1. 进入仓库 Settings → Secrets and variables → Actions
2. 添加以下 Secrets：

| Secret 名称 | 值 |
|------------|---|
| `TENCENT_SSH_HOST` | `82.156.83.99` |
| `TENCENT_SSH_USER` | `root` |
| `TENCENT_SSH_KEY` | (SSH 私钥内容) |

**获取 SSH 私钥**：
```bash
# 如果已有 SSH 密钥
cat ~/.ssh/id_rsa

# 如果没有，需要生成并添加到服务器
ssh-keygen -t rsa -b 4096
ssh-copy-id root@82.156.83.99
```

#### 2. 小程序 API 地址

**状态**: ✅ 已修正

小程序 API 地址已从 `www.yidasoftware.xyz` 修改为 `tzwf.xyz`。

**后续操作**：
1. 在微信开发者工具中测试
2. 重新上传小程序代码
3. 提交审核

---

## ✅ 验证清单

### GitHub Actions 部署
- [ ] 在 GitHub 配置 `TENCENT_SSH_HOST` Secret
- [ ] 在 GitHub 配置 `TENCENT_SSH_USER` Secret
- [ ] 在 GitHub 配置 `TENCENT_SSH_KEY` Secret
- [ ] 推送代码到 main 分支测试部署

### 小程序配置
- [x] 修改 `miniprogram/config/index.js` 为 `tzwf.xyz`
- [ ] 在微信开发者工具中测试
- [ ] 上传小程序代码
- [ ] 提交审核

### 后端配置
- [x] Docker Compose 配置正确
- [x] Nginx 代理配置正确
- [x] 数据库连接配置正确

---

## 📊 配置对比

| 配置项 | 当前值 | 期望值 | 状态 |
|--------|--------|--------|------|
| GitHub Actions 部署主机 | 未配置 (Secrets) | `82.156.83.99` | ⚠️ 需配置 |
| 小程序 API 地址 | `tzwf.xyz` | `tzwf.xyz` | ✅ 已修正 |
| Nginx 代理路径 | `/shangyin/` | `/shangyin/` | ✅ 正确 |
| 数据库主机 | `82.156.83.99` | `82.156.83.99` | ✅ 正确 |
| Docker 端口 | `14444` | `14444` | ✅ 正确 |

---

## 🔧 修改建议

### 立即执行
1. **修改小程序 API 地址** - 这是当前最主要的问题
2. **配置 GitHub Secrets** - 启用自动部署

### 后续优化
1. 考虑使用环境变量动态配置 API 地址
2. 添加多环境配置（开发/生产）
3. 完善部署日志和监控

---

## 📞 技术支持

- 🌐 网站：https://tzwf.xyz
- 📧 邮箱：tech-support@yidasoftware.xyz

---

*检查完成时间：2026 年 3 月 10 日*
