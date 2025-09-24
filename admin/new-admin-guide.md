# 上茚工厂管理系统 - 新版管理页面使用指南

## 访问地址
http://localhost:3000/shangyin/admin/new-admin.html

## 功能模块

### 1. 工序管理
- **功能**: 管理生产工序和绩效工资设置
- **特点**: 
  - 工序名称和描述
  - 绩效工资支持两种单位：元/件 和 元/小时
  - 自动生成工序编码
  - 状态管理（启用/禁用）
- **操作**: 
  - 新增工序：点击"新增工序"按钮
  - 编辑工序：点击操作列的编辑图标
  - 删除工序：点击操作列的删除图标

### 2. 产品类型管理
- **功能**: 管理产品类型及其对应的工序流程
- **特点**:
  - 产品类型名称管理
  - 自动生成产品类型编码
  - 工序流程配置（支持拖拽排序）
  - 显示关联工序数量
- **操作**:
  - 新增产品类型：点击"新增产品类型"按钮
  - 编辑产品类型：点击操作列的编辑图标
  - 工序管理：点击操作列的齿轮图标，可以为产品类型配置工序流程
  - 拖拽排序：在工序管理弹窗中，可以拖拽右侧已选工序来调整顺序

### 3. 合同管理
- **功能**: 管理合同信息和产品明细
- **特点**:
  - 合同基本信息（编号、甲乙方、签订日期等）
  - 支持多产品合同
  - 产品与产品类型关联
  - 合同详情查看
- **操作**:
  - 新增合同：点击"新增合同"按钮
  - 查看详情：点击操作列的眼睛图标
  - 编辑合同：点击操作列的编辑图标
  - 删除合同：点击操作列的删除图标

## API端点测试结果

✅ 所有API端点均已测试通过：

1. **工序API** (`/shangyin/processes`)
   - GET: 获取工序列表 ✅
   - POST: 创建新工序 ✅
   - PUT: 更新工序 ✅
   - DELETE: 删除工序 ✅

2. **产品类型API** (`/shangyin/product-types`)
   - GET: 获取产品类型列表 ✅
   - POST: 创建产品类型 ✅
   - PUT: 更新产品类型 ✅
   - DELETE: 删除产品类型 ✅

3. **合同API** (`/shangyin/contracts`)
   - GET: 获取合同列表 ✅
   - POST: 创建合同 ✅
   - GET: 获取合同详情 ✅
   - PUT: 更新合同 ✅
   - DELETE: 删除合同 ✅

## 技术特点

- **前端框架**: Vue.js 3
- **HTTP客户端**: Axios
- **拖拽排序**: SortableJS
- **样式系统**: Sony Design System
- **响应式设计**: 支持不同屏幕尺寸
- **实时更新**: 操作后自动刷新数据

## 数据模型

### 工序 (Process)
```javascript
{
  id: Number,
  name: String,        // 工序名称
  code: String,        // 工序编码(自动生成)
  description: String, // 工序描述
  payRate: Decimal,    // 绩效工资
  payRateUnit: Enum,   // 'perItem' | 'perHour'
  status: Enum         // 'active' | 'inactive'
}
```

### 产品类型 (ProductType)
```javascript
{
  id: Number,
  name: String,        // 产品类型名称
  code: String,        // 产品类型编码(自动生成)
  status: Enum         // 'active' | 'inactive'
}
```

### 合同 (Contract)
```javascript
{
  id: Number,
  contractNumber: String,    // 合同编号
  partyAName: String,        // 甲方名称
  partyBName: String,        // 乙方名称
  signedDate: String,        // 签订日期
  signedLocation: String,    // 签订地点
  status: String,            // 合同状态
  products: Array            // 产品列表
}
```

## 注意事项

1. 确保后端服务器在 http://localhost:3000 上运行
2. 工序删除前请确认没有被产品类型引用
3. 产品类型删除前请确认没有被合同引用
4. 拖拽排序后记得点击"保存排序"按钮
5. 页面会实时显示当前时间
6. 所有操作都有成功/失败的提示信息

## 故障排除

如果遇到问题：
1. 检查后端服务器是否正常运行
2. 检查浏览器控制台是否有错误信息
3. 确认API端点是否可访问
4. 检查数据库连接状态

## 开发信息

- 开发日期: 2025年9月24日
- 版本: 1.0.0
- 基于后端代码模型设计，完全兼容现有API接口