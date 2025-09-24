# 上茚工厂管理系统 API 文档

## 基本信息
- 基础URL: `http://localhost:3000/shangyin`  
- 响应格式: JSON
- 统一响应结构：
```json
{
  "success": true | false,
  "message": "可选的提示信息", 
  "data": { ... }
}
```

## 1. 认证模块 `/auth`
| Method | Path | 说明 |
|--------|------|------|
| POST | `/auth/register` | 用户注册 |
| POST | `/auth/login` | 用户登录 |

## 2. 微信业务 `/wechat`
| Method | Path | 说明 |
|--------|------|------|
| GET | `/wechat/config` | 获取微信配置信息 |
| POST | `/wechat/auth` | 微信授权登录 |

## 3. 员工管理 `/employees`
| Method | Path | 说明 |
|--------|------|------|
| GET | `/employees` | 获取员工列表 |
| POST | `/employees` | 创建员工 |
| PUT | `/employees/:id` | 更新员工信息 |
| DELETE | `/employees/:id` | 删除员工 |

## 4. 工序管理 `/processes`  
| Method | Path | 说明 |
|--------|------|------|
| GET | `/processes` | 获取工序列表 |
| POST | `/processes` | 创建工序 |
| PUT | `/processes/:id` | 更新工序信息 |
| DELETE | `/processes/:id` | 删除工序 |

## 5. 产品类型管理 `/product-types`
| Method | Path | 说明 |
|--------|------|------|
| GET | `/product-types` | 获取产品类型列表 |
| POST | `/product-types` | 创建产品类型 |
| PUT | `/product-types/:id` | 更新产品类型 |
| DELETE | `/product-types/:id` | 删除产品类型 |

## 6. 合同管理 `/contracts`
| Method | Path | 说明 |
|--------|------|------|
| GET | `/contracts` | 获取合同列表 |
| POST | `/contracts` | 创建合同 |
| GET | `/contracts/:id` | 获取合同详情 |
| PUT | `/contracts/:id` | 更新合同 |
| DELETE | `/contracts/:id` | 删除合同 |

## 7. 管理后台 `/api/admin`
| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/admin/dashboard/stats` | 仪表盘统计数据 |
| GET | `/api/admin/employees` | 后台员工管理列表 |
| GET | `/api/admin/contracts` | 后台合同管理列表 |

## 8. 生产管理 `/production` 🆕
| Method | Path | 说明 |
|--------|------|------|
| GET | `/production/contract-list` | 获取合同生产进度列表 |
| POST | `/production/scan/process` | 扫描工序二维码记录生产 |

## 9. 绩效管理 `/performance` 🆕  
| Method | Path | 说明 |
|--------|------|------|
| GET | `/performance/employee/:employeeId/overview` | 获取员工绩效概览 |
| POST | `/performance/timing-process` | 创建计时工序记录 |

## 10. 任务模块 `/task`
| Method | Path | 说明 |
|--------|------|------|
| GET | `/task/` | 任务占位说明 |
