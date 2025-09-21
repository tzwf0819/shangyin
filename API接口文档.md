# API接口文档

## 接口概述

本文档定义了版辊加工工厂管理系统前后端交互的RESTful API接口规范，包括用户认证、数据管理、业务操作等所有接口的详细说明。

## 接口规范

### 基础信息
- **Base URL**: `https://api.yourfactory.com/api`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: JWT Token

### 通用响应格式

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1694966400000
}
```

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

## 1. 认证相关接口

### 1.1 微信登录

**接口地址**: `POST /auth/wechat-login`

**请求参数**:
```json
{
  "code": "微信授权码",
  "encryptedData": "加密用户信息(可选)",
  "iv": "加密向量(可选)"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "userInfo": {
      "id": 1,
      "openId": "wx_openid",
      "nickname": "用户昵称",
      "avatarUrl": "头像URL",
      "isEmployee": true,
      "employee": {
        "id": 1,
        "employeeNo": "EMP001", 
        "name": "张三",
        "role": "worker",
        "department": "生产部"
      }
    },
    "expiresIn": 604800
  }
}
```

### 1.2 刷新Token

**接口地址**: `POST /auth/refresh`

**请求头**:
```
Authorization: Bearer {token}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_string",
    "expiresIn": 604800
  }
}
```

### 1.3 退出登录

**接口地址**: `POST /auth/logout`

**请求头**:
```
Authorization: Bearer {token}
```

**响应数据**:
```json
{
  "success": true,
  "message": "退出成功"
}
```

## 2. 用户相关接口

### 2.1 获取用户信息

**接口地址**: `GET /user/profile`

**请求头**:
```
Authorization: Bearer {token}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nickname": "用户昵称",
    "avatarUrl": "头像URL",
    "phone": "手机号",
    "lastLoginAt": "2023-09-17T08:00:00Z",
    "employee": {
      "id": 1,
      "employeeNo": "EMP001",
      "name": "张三",
      "role": "worker",
      "department": "生产部",
      "position": "操作员"
    }
  }
}
```

### 2.2 更新用户信息

**接口地址**: `PUT /user/profile`

**请求参数**:
```json
{
  "nickname": "新昵称",
  "phone": "新手机号"
}
```

## 3. 员工管理接口

### 3.1 获取员工列表

**接口地址**: `GET /employees`

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20)
- `role`: 角色筛选
- `status`: 状态筛选
- `keyword`: 搜索关键词

**响应数据**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "employeeNo": "EMP001",
        "name": "张三",
        "department": "生产部",
        "position": "操作员",
        "role": "worker",
        "status": "active",
        "hireDate": "2023-01-01",
        "user": {
          "id": 1,
          "nickname": "张三",
          "avatarUrl": "头像URL"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### 3.2 创建员工

**接口地址**: `POST /employees`

**请求参数**:
```json
{
  "employeeNo": "EMP002",
  "name": "李四", 
  "department": "生产部",
  "position": "操作员",
  "role": "worker",
  "hireDate": "2023-09-17",
  "phone": "13800138000"
}
```

### 3.3 绑定员工微信

**接口地址**: `POST /employees/{id}/bind-wechat`

**请求参数**:
```json
{
  "userId": 2
}
```

### 3.4 获取员工工序权限

**接口地址**: `GET /employees/{id}/processes`

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "processId": 1,
      "process": {
        "id": 1,
        "name": "原料准备",
        "code": "P001",
        "category": "前期准备"
      },
      "skillLevel": 3,
      "certifiedAt": "2023-08-01T00:00:00Z"
    }
  ]
}
```

### 3.5 设置员工工序权限

**接口地址**: `POST /employees/{id}/processes`

**请求参数**:
```json
{
  "processIds": [1, 2, 3],
  "skillLevel": 2
}
```

## 4. 工序管理接口

### 4.1 获取工序列表

**接口地址**: `GET /processes`

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "原料准备",
      "code": "P001",
      "category": "前期准备",
      "description": "准备生产所需原料",
      "standardTime": 30,
      "difficultyLevel": 1,
      "status": "active"
    }
  ]
}
```

### 4.2 创建工序

**接口地址**: `POST /processes`

**请求参数**:
```json
{
  "name": "新工序",
  "code": "P006",
  "category": "特殊工序",
  "description": "工序描述",
  "standardTime": 45,
  "difficultyLevel": 3,
  "qualityStandards": "质量标准",
  "safetyNotes": "安全注意事项",
  "toolsRequired": ["工具1", "工具2"]
}
```

## 5. 产品管理接口

### 5.1 获取产品类型列表

**接口地址**: `GET /product-types`

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "标准版辊",
      "code": "PT001", 
      "description": "标准规格版辊产品",
      "estimatedTime": 345,
      "standardProcesses": [1, 2, 3, 4, 5],
      "status": "active"
    }
  ]
}
```

### 5.2 创建产品类型

**接口地址**: `POST /product-types`

**请求参数**:
```json
{
  "name": "新产品类型",
  "code": "PT003",
  "description": "产品描述",
  "specification": {
    "width": "100mm",
    "height": "200mm",
    "material": "钢材"
  },
  "standardProcesses": [1, 2, 3],
  "estimatedTime": 240
}
```

## 6. 合同管理接口

### 6.1 获取合同列表

**接口地址**: `GET /contracts`

**查询参数**:
- `page`: 页码
- `limit`: 每页数量
- `status`: 状态筛选
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应数据**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "contractNo": "CT20230917001",
        "customerName": "客户A",
        "contractDate": "2023-09-17",
        "deliveryDate": "2023-10-17",
        "totalAmount": 50000.00,
        "status": "in_progress",
        "productCount": 3,
        "completedProducts": 1,
        "progressPercentage": 33.33
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

### 6.2 创建合同

**接口地址**: `POST /contracts`

**请求参数**:
```json
{
  "contractNo": "CT20230917002",
  "customerName": "客户B",
  "customerContact": "联系人",
  "customerPhone": "13800138000",
  "contractDate": "2023-09-17",
  "deliveryDate": "2023-10-17",
  "totalAmount": 80000.00,
  "notes": "特殊要求说明"
}
```

### 6.3 获取合同详情

**接口地址**: `GET /contracts/{id}`

**响应数据**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "contractNo": "CT20230917001",
    "customerName": "客户A",
    "customerContact": "张经理",
    "customerPhone": "13800138000",
    "contractDate": "2023-09-17",
    "deliveryDate": "2023-10-17",
    "totalAmount": 50000.00,
    "status": "in_progress",
    "qrCode": "qr_code_url",
    "products": [
      {
        "id": 1,
        "productNo": "P20230917001",
        "name": "标准版辊A",
        "productType": {
          "id": 1,
          "name": "标准版辊"
        },
        "quantity": 10,
        "unitPrice": 1000.00,
        "totalPrice": 10000.00,
        "status": "in_progress",
        "progressPercentage": 60.00
      }
    ]
  }
}
```

### 6.4 添加合同产品

**接口地址**: `POST /contracts/{id}/products`

**请求参数**:
```json
{
  "productTypeId": 1,
  "productNo": "P20230917003",
  "name": "定制版辊C",
  "quantity": 5,
  "unitPrice": 1500.00,
  "specifications": {
    "width": "150mm",
    "customFeature": "特殊镀层"
  },
  "requirements": "客户特殊要求"
}
```

## 7. 工人工作台接口

### 7.1 获取工人任务列表

**接口地址**: `GET /worker/tasks`

**查询参数**:
- `status`: 任务状态 (pending/assigned/in_progress)
- `date`: 指定日期

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productProcess": {
        "id": 1,
        "sequenceNo": 1,
        "status": "assigned",
        "estimatedTime": 30,
        "qrCode": "qr_code_data",
        "product": {
          "id": 1,
          "productNo": "P20230917001",
          "name": "标准版辊A",
          "contract": {
            "contractNo": "CT20230917001",
            "customerName": "客户A"
          }
        },
        "process": {
          "id": 1,
          "name": "原料准备",
          "description": "准备生产所需原料"
        }
      }
    }
  ]
}
```

### 7.2 扫码完成工序

**接口地址**: `POST /worker/complete-process`

**请求参数**:
```json
{
  "qrCodeData": "扫描的二维码数据",
  "location": "车间A-工位01",
  "notes": "完成备注",
  "qualityScore": 9.5,
  "images": ["image1.jpg", "image2.jpg"]
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "processRecord": {
      "id": 1,
      "actionType": "complete",
      "actionTime": "2023-09-17T10:30:00Z",
      "actualTime": 28
    },
    "performance": {
      "completedCount": 5,
      "todayCount": 2,
      "efficiency": 107.14
    }
  }
}
```

### 7.3 获取工人绩效统计

**接口地址**: `GET /worker/performance`

**查询参数**:
- `period`: 统计周期 (day/week/month)
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应数据**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCompleted": 150,
      "totalTime": 4500,
      "averageTime": 30,
      "efficiency": 105.25,
      "qualityScore": 9.2
    },
    "dailyStats": [
      {
        "date": "2023-09-17",
        "completedCount": 8,
        "totalTime": 240,
        "averageTime": 30,
        "efficiency": 100
      }
    ],
    "processStats": [
      {
        "process": {
          "id": 1,
          "name": "原料准备"
        },
        "completedCount": 50,
        "averageTime": 28,
        "efficiency": 107.14
      }
    ]
  }
}
```

## 8. 扫码相关接口

### 8.1 生成二维码

**接口地址**: `POST /qrcode/generate`

**请求参数**:
```json
{
  "type": "product_process",
  "data": {
    "productProcessId": 1,
    "productId": 1,
    "processId": 1,
    "contractId": 1
  },
  "size": 200,
  "format": "png"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "qrCode": "base64_encoded_qr_image",
    "qrCodeUrl": "https://cdn.yourfactory.com/qr/xxx.png",
    "qrCodeData": "encrypted_qr_data_string"
  }
}
```

### 8.2 解析二维码

**接口地址**: `POST /qrcode/parse`

**请求参数**:
```json
{
  "qrCodeData": "扫描的二维码数据"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "type": "product_process",
    "valid": true,
    "data": {
      "productProcessId": 1,
      "productId": 1,
      "processId": 1,
      "contractId": 1,
      "product": {
        "productNo": "P20230917001",
        "name": "标准版辊A"
      },
      "process": {
        "name": "原料准备",
        "description": "准备生产所需原料"
      },
      "contract": {
        "contractNo": "CT20230917001",
        "customerName": "客户A"
      }
    }
  }
}
```

## 9. 统计报表接口

### 9.1 生产进度统计

**接口地址**: `GET /statistics/production-progress`

**查询参数**:
- `period`: 统计周期 (day/week/month)
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应数据**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalContracts": 20,
      "completedContracts": 12,
      "inProgressContracts": 6,
      "pendingContracts": 2,
      "totalProducts": 150,
      "completedProducts": 90,
      "overallProgress": 60.0
    },
    "dailyProgress": [
      {
        "date": "2023-09-17",
        "completed": 5,
        "total": 8,
        "progress": 62.5
      }
    ]
  }
}
```

### 9.2 员工绩效排名

**接口地址**: `GET /statistics/employee-ranking`

**查询参数**:
- `period`: 统计周期
- `metric`: 排名指标 (completed_count/efficiency/quality)

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "employee": {
        "id": 1,
        "name": "张三",
        "employeeNo": "EMP001"
      },
      "completedCount": 150,
      "efficiency": 105.25,
      "qualityScore": 9.2,
      "rank": 1
    }
  ]
}
```

## 10. 本地系统HTTP访问接口

**重要说明**: 本地系统可直接通过HTTP API访问小程序后端，无需复杂集成。后端数据库使用云主机本地安装的MySQL。

### 10.1 系统认证

**接口地址**: `POST /api/auth/system`

**请求参数**:
```json
{
  "system_key": "your_system_access_key",
  "system_secret": "your_system_secret"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "token": "system_access_token",
    "expires_in": 86400
  }
}
```

### 10.2 批量上传合同数据

**接口地址**: `POST /api/system/contracts/batch`

**请求头**:
```
Authorization: Bearer {system_access_token}
Content-Type: application/json
```

**请求参数**:
```json
{
  "contracts": [
    {
      "产品ID": "P20230917001",
      "合同编号": "HT2023001",
      "甲方": "客户A",
      "乙方": "版辊厂",
      "签订日期": "2023-09-17T00:00:00Z",
      "签订地点": "杭州",
      "产品编号": "P001",
      "产品名称": "凹版印刷辊",
      "规格": "1000x500",
      "雕宽": "1000",
      "网型": "六边形",
      "线数": "120",
      "容积率": "12.5",
      "数量": "2",
      "单价": "5000",
      "总金额": "10000",
      "甲方单位名称": "印刷公司A",
      "甲方联系人": "张经理",
      "甲方电话传真": "0571-12345678",
      "合同状态": "生产中",
      "开始生产": "已开始",
      "基辊加工": "已完成",
      "热喷涂": "进行中",
      "陶瓷磨削": "待开始",
      "前续抛光": "待开始",
      "激光雕刻": "待开始",
      "后续抛光": "待开始",
      "检验尺寸": "待开始",
      "包装出库": "待开始",
      "备注": "加急订单"
    }
  ],
  "overwrite": false
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "imported": 1,
    "updated": 0,
    "errors": 0,
    "details": [
      {
        "合同编号": "HT2023001",
        "status": "imported",
        "id": 1,
        "message": "导入成功"
      }
    ]
  }
}
```

### 10.2 上传单个合同

**接口地址**: `POST /sync/contracts/single`

**请求参数**: 单个合同对象（格式同上）

### 10.3 获取同步状态

**接口地址**: `GET /sync/contracts/status`

**查询参数**:
- `合同编号`: 指定合同编号
- `sync_status`: 同步状态筛选

**响应数据**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "合同编号": "HT2023001",
      "sync_status": "synced",
      "sync_time": "2023-09-17T10:30:00Z",
      "contract_id": 1,
      "imported_at": "2023-09-17T10:00:00Z"
    }
  ]
}
```

### 10.4 批量上传员工数据

**接口地址**: `POST /sync/employees/batch`

**请求参数**:
```json
{
  "employees": [
    {
      "employeeNo": "EMP001",
      "name": "张三",
      "department": "生产部",
      "position": "基辊加工工",
      "phone": "13800138001",
      "hireDate": "2023-01-01",
      "role": "worker",
      "processes": ["基辊加工", "热喷涂"],
      "skillLevels": {
        "基辊加工": 4,
        "热喷涂": 3
      }
    }
  ]
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "imported": 1,
    "updated": 0,
    "errors": 0,
    "details": [
      {
        "employeeNo": "EMP001",
        "status": "imported",
        "id": 1,
        "message": "员工导入成功"
      }
    ]
  }
}
```

### 10.5 批量上传工序数据

**接口地址**: `POST /sync/processes/batch`

**请求参数**:
```json
{
  "processes": [
    {
      "name": "基辊加工",
      "code": "P001", 
      "category": "基础加工",
      "description": "基辊的初步机械加工",
      "standardTime": 240,
      "difficultyLevel": 3,
      "qualityStandards": "尺寸精度±0.01mm",
      "safetyNotes": "注意机械安全",
      "toolsRequired": ["车床", "铣床", "测量工具"]
    }
  ]
}
```

### 10.6 同步生产进度

**接口地址**: `PUT /sync/contracts/{contractNo}/progress`

**请求参数**:
```json
{
  "基辊加工": "已完成",
  "热喷涂": "进行中", 
  "陶瓷磨削": "待开始",
  "progress_percentage": 35.5,
  "current_process": "热喷涂",
  "updated_by": "system_sync"
}
```

### 10.7 获取需要同步的数据

**接口地址**: `GET /sync/pending-updates`

**响应数据**:
```json
{
  "success": true,
  "data": {
    "contracts": [
      {
        "id": 1,
        "合同编号": "HT2023001",
        "last_updated": "2023-09-17T10:30:00Z",
        "changes": ["progress_percentage", "current_process"]
      }
    ],
    "processes": [],
    "employees": []
  }
}
```

## 11. 文件上传接口

### 10.1 上传文件

**接口地址**: `POST /upload`

**请求类型**: `multipart/form-data`

**请求参数**:
- `file`: 文件对象
- `type`: 文件类型 (avatar/attachment/image)
- `relatedType`: 关联类型 (可选)
- `relatedId`: 关联ID (可选)

**响应数据**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fileName": "generated_filename.jpg",
    "originalName": "original_name.jpg",
    "fileSize": 102400,
    "fileType": "image/jpeg",
    "fileUrl": "https://cdn.yourfactory.com/uploads/2023/09/17/xxx.jpg"
  }
}
```

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "code": 400,
  "message": "请求参数错误",
  "errors": [
    {
      "field": "name",
      "message": "名称不能为空"
    }
  ],
  "timestamp": 1694966400000
}
```

### 常见错误代码

| 错误代码 | 说明 |
|----------|------|
| AUTH_001 | Token无效或已过期 |
| AUTH_002 | 权限不足 |
| USER_001 | 用户不存在 |
| EMP_001 | 员工不存在 |
| EMP_002 | 员工已绑定其他微信账号 |
| PROC_001 | 工序不存在 |
| PROC_002 | 员工无此工序权限 |
| QR_001 | 二维码无效 |
| QR_002 | 二维码已过期 |
| FILE_001 | 文件格式不支持 |
| FILE_002 | 文件大小超限 |

## 本地系统HTTP访问示例

### 使用curl命令上传合同数据

```bash
# 1. 获取访问令牌
curl -X POST https://your-domain.com/api/auth/system \
  -H "Content-Type: application/json" \
  -d '{
    "system_key": "your_system_access_key",
    "system_secret": "your_system_secret"
  }'

# 响应获得token: {"success":true,"data":{"token":"xxxxx"}}

# 2. 上传合同数据
curl -X POST https://your-domain.com/api/system/contracts/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "contracts": [
      {
        "产品ID": "P20230917001",
        "合同编号": "HT2023001",
        "甲方": "客户A",
        "产品名称": "凹版印刷辊",
        "数量": "2",
        "单价": "5000",
        "总金额": "10000",
        "合同状态": "生产中",
        "基辊加工": "已完成",
        "热喷涂": "进行中"
      }
    ]
  }'
```

### 使用PowerShell上传数据

```powershell
# 设置API基础URL
$apiBase = "https://your-domain.com/api"

# 获取访问令牌
$authData = @{
    system_key = "your_system_access_key"
    system_secret = "your_system_secret"
} | ConvertTo-Json

$tokenResponse = Invoke-RestMethod -Uri "$apiBase/auth/system" -Method POST -Body $authData -ContentType "application/json"
$token = $tokenResponse.data.token

# 上传合同数据
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$contractData = @{
    contracts = @(
        @{
            "产品ID" = "P20230917001"
            "合同编号" = "HT2023001"
            "甲方" = "客户A"
            "产品名称" = "凹版印刷辊"
            "数量" = "2"
            "单价" = "5000"
            "总金额" = "10000"
            "合同状态" = "生产中"
            "基辊加工" = "已完成"
            "热喷涂" = "进行中"
        }
    )
} | ConvertTo-Json -Depth 3

$uploadResponse = Invoke-RestMethod -Uri "$apiBase/system/contracts/batch" -Method POST -Body $contractData -Headers $headers
Write-Output $uploadResponse
```

## 接口调用示例

### JavaScript (小程序)

```javascript
// 封装请求函数
function apiRequest(url, method, data = {}) {
  const token = wx.getStorageSync('token');
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${url}`,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.data.success) {
          resolve(res.data.data);
        } else {
          reject(res.data);
        }
      },
      fail: reject
    });
  });
}

// 使用示例
apiRequest('/worker/tasks', 'GET')
  .then(tasks => {
    console.log('获取任务成功:', tasks);
  })
  .catch(error => {
    console.error('获取任务失败:', error);
  });
```

### Node.js (服务端)

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// JWT验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: 'Token缺失'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: 'Token无效'
      });
    }
    req.user = user;
    next();
  });
}

// 接口实现示例
router.get('/worker/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await getWorkerTasks(req.user.employeeId, req.query);
    
    res.json({
      success: true,
      code: 200,
      data: tasks,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误',
      timestamp: Date.now()
    });
  }
});
```

---

*本API文档提供了系统所有接口的详细规范，确保前后端开发的一致性和规范性。*