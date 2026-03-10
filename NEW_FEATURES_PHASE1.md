# 新功能开发 - 第一阶段完成报告

## 📅 完成日期
2026 年 3 月 10 日

## ✅ 已完成的工作

### 1. 数据库迁移脚本
**文件**: `backend/scripts/migration-new-features.js`

已创建完整的数据库迁移脚本，包含以下更新：

#### 员工表 (employees) 新增字段：
- `employeeType` - 员工类型（worker/salesman）
- `workStartTime` - 上班开始时间
- `workEndTime` - 下班结束时间
- `canViewAllContracts` - 是否可以查看所有合同

#### 产品类型表 (product_types) 新增字段：
- `parentId` - 父级分类 ID（二级分类）
- `notifyProcessId` - 通知工序 ID
- `needNotification` - 是否需要工序完成通知

#### 工序表 (processes) 新增字段：
- `isLaserEngraving` - 是否为激光雕刻工序
- `laserMode1PayRate` - 激光雕刻模式 1 绩效单价
- `laserMode2PayRate` - 激光雕刻模式 2 绩效单价
- `laserMode1Name` - 模式 1 名称
- `laserMode2Name` - 模式 2 名称

#### 合同产品表 (contract_products) 新增字段：
- `productSuffix` - 产品编号尾号（如 -1, -2）

#### 生产记录表 (process_records) 新增字段：
- `laserMode` - 激光雕刻生产方式
- `notificationSent` - 是否已发送业务员通知
- `notificationTime` - 通知发送时间

#### 新增表：
- `permissions` - 权限表
- `employee_permissions` - 员工权限关联表
- `wecom_configs` - 企业微信配置表
- `notification_logs` - 通知发送记录表

---

### 2. 模型更新

#### 更新的模型：
- ✅ `models/Employee.js` - 支持员工类型、工作时间、权限
- ✅ `models/ProductType.js` - 支持二级分类、通知工序
- ✅ `models/Process.js` - 支持激光雕刻两种模式
- ✅ `models/ProcessRecord.js` - 支持激光模式、通知标记
- ✅ `models/ContractProduct.js` - 支持产品尾号
- ✅ `models/index.js` - 更新所有模型关联

#### 新增模型：
- ✅ `models/Permission.js` - 权限模型
- ✅ `models/EmployeePermission.js` - 员工权限关联模型
- ✅ `models/WecomConfig.js` - 企业微信配置模型
- ✅ `models/NotificationLog.js` - 通知日志模型

---

### 3. 后端服务

#### 企业微信通知服务
**文件**: `backend/services/wecomService.js`

已实现功能：
- ✅ 获取企业微信访问令牌
- ✅ 发送文本消息
- ✅ 发送模板卡片消息
- ✅ 通知业务员工序完成
- ✅ 自动检查并发送通知
- ✅ 通知日志记录

---

### 4. 中间件

#### 权限验证中间件
**文件**: `backend/middleware/permissionCheck.js`

已实现功能：
- ✅ `requirePermission()` - 验证权限编码
- ✅ `requireEmployeeType()` - 验证员工类型

#### 工作时间验证中间件
**文件**: `backend/middleware/workTimeCheck.js`

已实现功能：
- ✅ `checkWorkTime()` - 检查是否在工作时间内
- ✅ `requireWorker()` - 验证是否为工人
- ✅ `requireSalesman()` - 验证是否为业务员

---

### 5. 控制器

#### 绩效汇总控制器
**文件**: `backend/controllers/performanceSummaryController.js`

已实现接口：
- ✅ `GET /shangyin/performance/summary` - 员工绩效汇总
- ✅ `GET /shangyin/performance/process-stats` - 工序生产次数统计
- ✅ `GET /shangyin/performance/employee/:id` - 单个员工详细绩效

---

## 📋 部署步骤

### 第一步：执行数据库迁移

```bash
# 进入后端目录
cd backend

# 执行迁移脚本
node scripts/migration-new-features.js
```

**预期输出**：
```
开始数据库迁移...
更新员工表...
更新产品类型表...
更新工序表...
更新合同产品表...
更新生产记录表...
创建权限表...
创建员工权限关联表...
创建企业微信配置表...
创建通知发送记录表...
✅ 数据库迁移完成！
插入默认权限数据...
✅ 默认权限数据已插入！
```

### 第二步：配置企业微信（可选）

在管理后台执行以下 SQL 配置企业微信：

```sql
INSERT INTO wecom_configs (corpId, agentId, secret, enabled) 
VALUES ('your-corp-id', 'your-agent-id', 'your-secret', false);
```

**注意**: 暂时设置为 `false`，等企业微信申请完成后再启用。

### 第三步：重启后端服务

```bash
# Docker 部署
docker compose restart backend

# 或 Systemd 部署
sudo systemctl restart shangyin
```

---

## 🔧 后续开发计划

### 第二阶段：小程序开发（预计 2-3 天）

#### 1. 登录页面更新
**文件**: `miniprogram/pages/login/index.js`

需要修改：
- [ ] 检查员工类型
- [ ] 验证工作时间
- [ ] 根据类型跳转不同页面

#### 2. 工序提交页面更新
**文件**: `miniprogram/pages/process/index.js`

需要修改：
- [ ] 隐藏客户名和敏感信息
- [ ] 显示订单号、产品编号、规格
- [ ] 缩小备注文本框
- [ ] 激光雕刻模式选择器
- [ ] 切换产品按钮
- [ ] 扫码切换产品

#### 3. 业务员页面（新建）
**文件**: `miniprogram/pages/salesman/index.js`

需要实现：
- [ ] 合同列表（只读）
- [ ] 合同详情
- [ ] 生产进度查询

---

### 第三阶段：管理后台开发（预计 3-5 天）

#### 1. 权限管理页面（新建）
**文件**: `admin/src/pages/Permissions.vue`

需要实现：
- [ ] 权限列表
- [ ] 权限分配
- [ ] 角色管理

#### 2. 员工管理页面更新
**文件**: `admin/src/pages/Employees.vue`

需要修改：
- [ ] 员工类型选择器
- [ ] 上下班时间设置
- [ ] 权限分配 UI

#### 3. 产品类型页面更新
**文件**: `admin/src/pages/ProductTypes.vue`

需要修改：
- [ ] 二级分类树形结构
- [ ] 通知工序设置

#### 4. 工序管理页面更新
**文件**: `admin/src/pages/Processes.vue`

需要修改：
- [ ] 激光雕刻标记
- [ ] 两种模式绩效设置

#### 5. 绩效汇总页面（新建）
**文件**: `admin/src/pages/PerformanceSummary.vue`

需要实现：
- [ ] 时间段选择器
- [ ] 绩效汇总表格
- [ ] 工序统计
- [ ] 导出 Excel

---

### 第四阶段：后端 API 完善（预计 1-2 天）

#### 需要更新的控制器：
- [ ] `employeeController.js` - 支持新字段
- [ ] `productTypeController.js` - 支持二级分类
- [ ] `processController.js` - 支持激光雕刻
- [ ] `productionController.js` - 支持模式选择和通知
- [ ] `contractController.js` - 支持产品尾号

#### 需要新建的控制器：
- [ ] `permissionController.js` - 权限管理 API

---

## 📊 数据库 ER 图（新增部分）

```
┌─────────────────┐       ┌──────────────────────┐
│   employees     │       │   permissions        │
├─────────────────┤       ├──────────────────────┤
│ id              │       │ id                   │
│ name            │       │ name                 │
│ employeeType    │◄──────│ code                 │
│ workStartTime   │       │ description          │
│ workEndTime     │       │ module               │
│ canViewAllCon.. │       └──────────────────────┘
└─────────────────┘              ▲
        │                        │
        │  ┌─────────────────────┘
        │  │
        ▼  ▼
┌──────────────────────┐
│ employee_permissions │
├──────────────────────┤
│ id                   │
│ employeeId           │
│ permissionId         │
└──────────────────────┘

┌─────────────────┐       ┌─────────────────┐
│ product_types   │       │    processes    │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ name            │       │ name            │
│ parentId        │◄──────│ isLaserEngraving│
│ notifyProcessId │──────►│ laserMode1Pay.. │
│ needNotification│       │ laserMode2Pay.. │
└─────────────────┘       └─────────────────┘

┌─────────────────────┐
│ wecom_configs       │
├─────────────────────┤
│ id                  │
│ corpId              │
│ agentId             │
│ secret              │
│ enabled             │
└─────────────────────┘
```

---

## ⚠️ 注意事项

### 1. 数据库备份
在执行迁移之前，请务必备份数据库：

```bash
# 使用备份脚本
./scripts/database_backup.sh
```

### 2. 测试环境验证
建议先在测试环境验证所有功能：

```env
# 测试环境配置
DB_HOST=82.156.83.99
DB_NAME=shangyin_test
```

### 3. 企业微信申请
需要提前申请企业微信：
1. 注册企业微信账号
2. 创建自建应用
3. 获取 CorpID、AgentId、Secret
4. 配置可信域名

### 4. 小程序审核
小程序功能更新需要提交审核：
- 激光雕刻模式选择
- 业务员专用页面
- 扫码切换产品

---

## 📞 技术支持

- 📧 邮箱：tech-support@yidasoftware.xyz
- 🌐 网站：https://tzwf.xyz

---

*第一阶段完成时间：2026 年 3 月 10 日*
