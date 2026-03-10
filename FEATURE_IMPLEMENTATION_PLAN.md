# 新功能实现计划

## 📅 创建日期
2026 年 3 月 10 日

## 📋 需求概述

根据用户反馈，需要实现以下 9 个功能点：

1. **工序管理**: 激光雕刻工序特殊处理（两种生产方式，不同绩效价格）
2. **产品类型**: 增加二级分类、通知工序功能
3. **员工管理**: 增加上下班时间限制、员工类型（工人/业务员）
4. **生产绩效管理**: 修改错误文本、增加小汇总表
5. **合同管理**: 产品编号支持尾号（如 -1, -2）
6. **小程序页面**: 隐藏客户名、显示订单号、增加切换产品按钮
7. **企业微信通知**: 特定工序通知业务员
8. **业务员专用页面**: 只读权限，查询合同进度
9. **权限管理**: 控制订单可见性

---

## ✅ 已完成的工作

### 1. 数据库迁移脚本
- ✅ 创建 `backend/scripts/migration-new-features.js`
- ✅ 包含所有新字段的 SQL 语句

### 2. 模型更新
- ✅ `models/Employee.js` - 增加 employeeType, workStartTime, workEndTime, canViewAllContracts
- ✅ `models/ProductType.js` - 增加 parentId, notifyProcessId, needNotification
- ✅ `models/Process.js` - 增加激光雕刻相关字段
- ✅ `models/ProcessRecord.js` - 增加 laserMode, notificationSent, notificationTime
- ✅ `models/ContractProduct.js` - 增加 productSuffix
- ✅ `models/Permission.js` - 新建权限模型
- ✅ `models/EmployeePermission.js` - 新建员工权限关联模型
- ✅ `models/WecomConfig.js` - 新建企业微信配置模型
- ✅ `models/NotificationLog.js` - 新建通知日志模型
- ✅ `models/index.js` - 更新所有模型关联

---

## 🔧 待完成的工作

### 后端 API（优先级：高）

#### 1. 员工管理 API 更新
**文件**: `backend/controllers/employeeController.js`

需要增加/修改的功能：
- [ ] 支持员工类型字段（worker/salesman）
- [ ] 支持上下班时间字段
- [ ] 支持登录时间验证中间件
- [ ] 增加权限分配接口

#### 2. 权限管理 API
**文件**: `backend/controllers/permissionController.js` (新建)

需要实现的功能：
- [ ] 权限列表接口
- [ ] 分配权限给员工
- [ ] 检查员工权限
- [ ] 权限 CRUD 操作

#### 3. 产品类型 API 更新
**文件**: `backend/controllers/productTypeController.js`

需要增加的功能：
- [ ] 支持二级分类（父子关系）
- [ ] 支持通知工序设置
- [ ] 树形结构查询接口

#### 4. 工序管理 API 更新
**文件**: `backend/controllers/processController.js`

需要增加的功能：
- [ ] 支持激光雕刻标记
- [ ] 支持两种模式的绩效价格
- [ ] 前端返回激光雕刻配置

#### 5. 生产记录 API 更新
**文件**: `backend/controllers/productionController.js`

需要增加的功能：
- [ ] 支持激光雕刻模式选择
- [ ] 根据模式计算绩效
- [ ] 触发业务员通知逻辑

#### 6. 企业微信通知服务
**文件**: `backend/services/wecomService.js` (新建)

需要实现的功能：
- [ ] 获取访问令牌
- [ ] 发送文本消息
- [ ] 发送模板卡片消息
- [ ] 通知队列管理

#### 7. 合同管理 API 更新
**文件**: `backend/controllers/contractController.js`

需要增加的功能：
- [ ] 支持产品编号尾号
- [ ] 自动生成唯一产品编号

#### 8. 绩效汇总 API
**文件**: `backend/controllers/performanceController.js`

需要增加的功能：
- [ ] 员工绩效汇总接口（按时间段）
- [ ] 工序生产次数统计
- [ ] 工资计算

---

### 小程序（优先级：高）

#### 1. 登录逻辑更新
**文件**: `miniprogram/pages/login/index.js`

需要修改：
- [ ] 检查员工类型
- [ ] 验证工作时间
- [ ] 根据类型跳转不同页面

#### 2. 工序提交页面
**文件**: `miniprogram/pages/process/index.js`

需要修改：
- [ ] 隐藏客户名和部分产品信息
- [ ] 显示订单号、产品编号、产品规格
- [ ] 缩小生产备注文本框
- [ ] 激光雕刻工序显示模式选择
- [ ] 增加切换产品按钮
- [ ] 扫码切换产品功能

#### 3. 业务员专用页面
**文件**: `miniprogram/pages/salesman/index.js` (新建)

需要实现：
- [ ] 合同列表（只读）
- [ ] 合同详情（只读）
- [ ] 生产进度查询
- [ ] 接收通知消息

---

### 管理后台（优先级：中）

#### 1. 权限管理页面
**文件**: `admin/src/pages/Permissions.vue` (新建)

需要实现：
- [ ] 权限列表
- [ ] 权限分配
- [ ] 角色管理

#### 2. 员工管理页面更新
**文件**: `admin/src/pages/Employees.vue`

需要修改：
- [ ] 增加员工类型选择
- [ ] 增加上下班时间设置
- [ ] 增加权限分配 UI

#### 3. 产品类型页面更新
**文件**: `admin/src/pages/ProductTypes.vue`

需要修改：
- [ ] 支持二级分类树形结构
- [ ] 增加通知工序设置

#### 4. 工序管理页面更新
**文件**: `admin/src/pages/Processes.vue`

需要修改：
- [ ] 增加激光雕刻标记
- [ ] 增加两种模式的绩效设置

#### 5. 绩效汇总页面
**文件**: `admin/src/pages/PerformanceSummary.vue` (新建)

需要实现：
- [ ] 时间段选择
- [ ] 员工绩效汇总表格
- [ ] 工序生产次数统计
- [ ] 导出功能

---

## 📝 实现步骤

### 第一步：执行数据库迁移
```bash
cd backend
node scripts/migration-new-features.js
```

### 第二步：实现后端核心服务
1. 企业微信通知服务
2. 权限验证中间件
3. 工作时间验证中间件

### 第三步：更新后端 API
1. 员工管理 API
2. 权限管理 API
3. 生产记录 API
4. 绩效汇总 API

### 第四步：小程序开发
1. 登录逻辑更新
2. 工序提交页面更新
3. 业务员页面开发

### 第五步：管理后台开发
1. 权限管理页面
2. 员工管理页面更新
3. 绩效汇总页面

---

## 🔑 关键代码示例

### 1. 工作时间验证中间件
```javascript
// middleware/workTimeCheck.js
function checkWorkTime(req, res, next) {
  const now = new Date();
  const currentTime = now.toTimeString().substring(0, 8);
  
  const employee = req.employee; // 从认证中间件获取
  if (!employee) return res.status(401).json({ success: false, message: '未找到员工信息' });
  
  const { workStartTime, workEndTime, employeeType } = employee;
  
  // 业务员不受时间限制
  if (employeeType === 'salesman') return next();
  
  if (currentTime < workStartTime || currentTime > workEndTime) {
    return res.status(403).json({
      success: false,
      message: `当前不在工作时间 (${workStartTime}-${workEndTime})`
    });
  }
  
  next();
}
```

### 2. 企业微信通知服务
```javascript
// services/wecomService.js
class WecomService {
  async getAccessToken() {
    // 获取企业微信访问令牌
  }
  
  async notifySalesman(contractId, productId, processName) {
    // 发送通知给业务员
    const message = `合同 ${contractId} 产品 ${productId} 已完成 ${processName} 工序`;
    // 发送消息逻辑
  }
}
```

### 3. 权限验证中间件
```javascript
// middleware/permissionCheck.js
function requirePermission(permissionCode) {
  return async (req, res, next) => {
    const employee = req.employee;
    const permissions = await employee.getPermissions();
    
    const hasPermission = permissions.some(p => p.code === permissionCode);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '没有权限执行此操作'
      });
    }
    next();
  };
}
```

---

## 📞 技术支持

- 📧 邮箱：tech-support@yidasoftware.xyz

---

*最后更新：2026 年 3 月 10 日*
