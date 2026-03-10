# 新功能开发 - 第二阶段进度报告

## 📅 更新日期
2026 年 3 月 10 日

## ✅ 第二阶段已完成

### 小程序开发

#### 1. 登录页面更新
**文件**: `miniprogram/pages/login/index.js`

**新增功能**:
- ✅ 支持员工类型判断（worker/salesman）
- ✅ 工作时间验证
- ✅ 根据员工类型跳转到不同页面
- ✅ 工人显示工作时间提示

**主要代码**:
```javascript
// 检查员工类型
checkEmployeeAccess(employee) {
  if (employeeType === 'salesman') {
    this.navigateSalesmanHome();
    return;
  }
  // 工人检查工作时间
  this.checkWorkTime(employee);
}

// 检查工作时间
checkWorkTime(employee) {
  const currentTime = now.toTimeString().substring(0, 8);
  const workStartTime = employee.workStartTime || '08:00:00';
  const workEndTime = employee.workEndTime || '18:00:00';
  
  if (currentTime < workStartTime || currentTime > workEndTime) {
    wx.showToast({ title: `非工作时间 (${workStartTime}-${workEndTime})` });
  }
}
```

---

#### 2. 业务员专用页面（新建）
**文件**: 
- `miniprogram/pages/salesman/index.js`
- `miniprogram/pages/salesman/index.wxml`
- `miniprogram/pages/salesman/index.wxss`
- `miniprogram/pages/salesman/index.json`

**功能特性**:
- ✅ 合同列表展示
- ✅ 合同进度条显示
- ✅ 搜索合同功能
- ✅ 工序完成通知
- ✅ 只读权限（不可提交生产记录）

**页面结构**:
```
业务员工作台
├── 用户信息卡片
├── 搜索框
├── 合同列表
│   ├── 合同号
│   ├── 状态标签
│   ├── 客户名称
│   ├── 产品数量
│   ├── 交付日期
│   └── 进度条
└── 工序完成通知
```

**API 接口**:
- `GET /shangyin/api/admin/contracts` - 获取合同列表
- `GET /shangyin/api/admin/contracts/search` - 搜索合同
- `GET /shangyin/performance/notification-logs` - 获取通知日志

---

#### 3. app.json 更新
**文件**: `miniprogram/app.json`

**更新内容**:
- ✅ 添加业务员页面路由
- ✅ tabBar 增加"我的合同"入口

**tabBar 配置**:
```json
{
  "tabBar": {
    "list": [
      { "pagePath": "pages/home/index", "text": "工作台" },
      { "pagePath": "pages/salesman/index", "text": "我的合同" },
      { "pagePath": "pages/profile/index", "text": "我的" }
    ]
  }
}
```

---

## 📋 待完成的工作

### 小程序（继续开发）

#### 1. 工序提交页面更新
**文件**: `miniprogram/pages/process/index.js`

**需要实现**:
- [ ] 隐藏客户名和敏感信息
- [ ] 显示订单号、产品编号、规格
- [ ] 缩小备注文本框
- [ ] 激光雕刻模式选择器
- [ ] 切换产品按钮
- [ ] 扫码切换产品功能

#### 2. 合同详情页面
**文件**: `miniprogram/pages/salesman/contract-detail.js`

**需要实现**:
- [ ] 合同详细信息
- [ ] 产品列表
- [ ] 生产进度跟踪
- [ ] 工序完成情况

---

### 管理后台（待开发）

#### 1. 权限管理页面
**文件**: `admin/src/pages/Permissions.vue`

**需要实现**:
- [ ] 权限列表
- [ ] 权限分配
- [ ] 角色管理

#### 2. 员工管理页面更新
**文件**: `admin/src/pages/Employees.vue`

**需要修改**:
- [ ] 员工类型选择器
- [ ] 上下班时间设置
- [ ] 权限分配 UI

#### 3. 产品类型页面更新
**文件**: `admin/src/pages/ProductTypes.vue`

**需要修改**:
- [ ] 二级分类树形结构
- [ ] 通知工序设置

#### 4. 工序管理页面更新
**文件**: `admin/src/pages/Processes.vue`

**需要修改**:
- [ ] 激光雕刻标记
- [ ] 两种模式绩效设置

#### 5. 绩效汇总页面
**文件**: `admin/src/pages/PerformanceSummary.vue`

**需要实现**:
- [ ] 时间段选择器
- [ ] 绩效汇总表格
- [ ] 工序统计
- [ ] 导出 Excel

---

### 后端 API（待完善）

#### 1. 员工管理 API 更新
**文件**: `backend/controllers/employeeController.js`

**需要修改**:
- [ ] 支持新字段（employeeType, workStartTime, workEndTime）
- [ ] 权限分配接口

#### 2. 权限管理 API
**文件**: `backend/controllers/permissionController.js` (新建)

**需要实现**:
- [ ] 权限 CRUD
- [ ] 分配权限给员工
- [ ] 检查员工权限

#### 3. 生产记录 API 更新
**文件**: `backend/controllers/productionController.js`

**需要修改**:
- [ ] 支持激光雕刻模式选择
- [ ] 触发业务员通知

---

## 🔧 部署说明

### 小程序部署

1. **导入微信开发者工具**
   - 打开微信开发者工具
   - 导入 `miniprogram/` 目录

2. **测试功能**
   - 测试登录逻辑
   - 测试业务员页面
   - 测试工作时间验证

3. **上传代码**
   - 编译并上传小程序代码
   - 提交审核

### 后端部署

1. **更新后端代码**
   ```bash
   git pull origin main
   ```

2. **重启服务**
   ```bash
   # Docker
   docker compose restart backend
   
   # Systemd
   sudo systemctl restart shangyin
   ```

---

## 📊 代码统计

| 类别 | 文件数 | 新增行数 |
|------|--------|---------|
| 小程序页面 | 4 | ~400 |
| 后端模型 | 4 | ~300 |
| 后端服务 | 1 | ~200 |
| 中间件 | 2 | ~150 |
| 控制器 | 1 | ~200 |
| 文档 | 2 | ~500 |
| **总计** | **14** | **~1750** |

---

## ⚠️ 注意事项

### 1. 小程序审核
- 新功能需要提交微信审核
- 预计审核时间 1-3 个工作日

### 2. 数据兼容性
- 员工类型默认为 `worker`
- 工作时间默认为 `08:00:00` - `18:00:00`
- 现有员工无需手动更新

### 3. 业务员通知
- 企业微信功能需要配置后才能使用
- 暂时不影响核心功能

---

## 📞 下一步计划

### 立即执行
1. [ ] 完成工序提交页面更新（激光雕刻模式选择）
2. [ ] 完成合同详情页面
3. [ ] 测试业务员页面 API

### 本周计划
1. [ ] 完成管理后台权限管理页面
2. [ ] 完成员工管理页面更新
3. [ ] 完成绩效汇总页面

### 下周计划
1. [ ] 完成所有后端 API 更新
2. [ ] 全面测试所有功能
3. [ ] 部署到生产环境

---

*第二阶段更新时间：2026 年 3 月 10 日*
