# 上茚后端 API 概览

所有接口统一前缀为 `http://localhost:3100/shangyin`（部署到服务器后替换为生产域名）。所有响应结构统一为：

```json
{
  "success": true | false,
  "message": "可选的提示信息",
  "data": { ... }
}
```

## 1. 认证模块 `/auth`

| Method | Path          | 说明                     | 示例请求体                  |
| ------ | ------------- | ------------------------ | --------------------------- |
| POST   | `/auth/login` | 小程序登录，换取 openId | `{ "code": "mock_code" }` |

> 开发环境未接入微信 SDK，返回的 `openId` 形如 `mock_openid_${code}`。

## 2. 微信业务 `/wechat`

| Method | Path                                   | 说明                     |
| ------ | -------------------------------------- | ------------------------ |
| POST   | `/wechat/login`                        | 根据 openId 判断是否已注册 |
| POST   | `/wechat/register`                     | 注册员工信息             |
| GET    | `/wechat/employee/:openId`             | 获取员工资料             |
| GET    | `/wechat/employee/:openId/processes`   | 获取员工的工序权限       |

## 3. 员工管理 `/employees`

| Method | Path                               | 说明                             |
| ------ | ---------------------------------- | -------------------------------- |
| GET    | `/employees`                       | 分页查询（支持 `status`、`keyword`） |
| POST   | `/employees`                       | 创建员工并分配工序               |
| GET    | `/employees/:id`                   | 获取员工详情                     |
| PUT    | `/employees/:id`                   | 更新员工信息/状态                |
| DELETE | `/employees/:id`                   | 逻辑删除（状态置为 `inactive`）   |
| POST   | `/employees/:id/processes`         | 批量分配工序                     |

## 4. 工序管理 `/processes`

- `GET /processes` 列表/分页
- `POST /processes` 新增工序
- `PUT /processes/:id` 更新工序
- `DELETE /processes/:id` 删除工序

## 5. 产品类型 `/product-types`

- `GET /product-types`、`GET /product-types/:id`
- `POST /product-types`
- `PUT /product-types/:id`
- `DELETE /product-types/:id`

## 6. 合同管理 `/contracts`

### 6.1 数据模型

- `Contract`：参考 `hetong.sql` 拆分出的合同字段，新增布尔字段 `isNewArtwork`、`isReviewed`、`isScheduled`，以及软关联 `salesEmployeeId`。
- `ContractProduct`：记录单个成品，包含 `volumeRatio`、`inkVolume`、`plateUnitPrice`、`newWoodBox` 等扩展字段。
- 每个合同最多包含 10 个成品，超出会被拒绝。

### 6.2 REST 接口

| Method | Path               | 说明                             |
| ------ | ------------------ | -------------------------------- |
| GET    | `/contracts`       | 分页查询，支持 `keyword`、`status`、`salesId`、`dateFrom/dateTo` |
| GET    | `/contracts/:id`   | 获取合同详情（含成品列表）       |
| POST   | `/contracts`       | 新建合同，至少包含 1 个成品       |
| PUT    | `/contracts/:id`   | 更新合同与成品（全量覆盖）       |
| DELETE | `/contracts/:id`   | 删除合同及成品                   |
| POST   | `/contracts/import`| 批量导入合同（数组形式），逐条返回成功/失败明细 |

请求体字段支持中文键名（如 `合同编号`、`条款一`、`产品列表`），后端会自动归一化：

```json
{
  "contractNumber": "HT-2024-001",
  "partyAName": "甲方公司",
  "terms": ["质量保证...", "交付节点..."],
  "processStatus": {
    "startProduction": "2024-09-01",
    "packaging": "待安排"
  },
  "products": [
    {
      "productName": "凹版辊A",
      "productCode": "P-001",
      "volumeRatio": "12cc",
      "productTypeName": "凹版辊",
      "newWoodBox": true
    }
  ]
}
```

响应示例：

```json
{
  "success": true,
  "data": {
    "contract": {
      "id": 1,
      "contractNumber": "HT-2024-001",
      "terms": ["质量保证..."],
      "products": [
        {
          "productName": "凹版辊A",
          "newWoodBox": true,
          "extraInfo": {}
        }
      ]
    }
  }
}
```

### 6.3 导入返回格式

```json
{
  "success": false,
  "data": {
    "successCount": 2,
    "failureCount": 1,
    "contracts": [ { ...成功的合同... } ],
    "errors": [
      {
        "index": 2,
        "contractNumber": "HT-2024-003",
        "message": "合同编号已存在"
      }
    ]
  }
}
```

## 7. 管理后台 `/api/admin`

| Method | Path                                     | 说明                         |
| ------ | ---------------------------------------- | ---------------------------- |
| GET    | `/api/admin/dashboard/stats`             | 仪表盘统计                   |
| GET    | `/api/admin/employees`                   | 后台员工管理                 |
| PUT    | `/api/admin/employees/:id`               | 更新员工                     |
| DELETE | `/api/admin/employees/:id`               | 删除员工                     |
| DELETE | `/api/admin/employees/:id/wechat`        | 解绑员工微信                 |
| POST   | `/api/admin/employees/batch/clear-wechat`| 批量解绑微信                 |
| POST   | `/api/admin/employees/batch/delete`      | 批量删除                     |

## 8. 任务模块 `/task`

- `GET /task/` 占位说明
- `GET /task/user/:userId` 用户任务列表（示例数据）
- `POST /task/:taskId/complete` 完成任务（示例）

## 9. 本地脚本

`scripts/api-smoke.ps1` 已扩展合同用例，可在 PowerShell 中执行：

```powershell
cd shangyin-backend/backend
node app.js  # 或 npm start

cd ..
.\scriptsun-smoke.ps1 -BaseUrl 'http://localhost:3000/shangyin'
```

脚本会自动：

1. 完成登录与注册流程。
2. 拉取员工、工序、产品类型数据。
3. 依次创建合同、查询详情、验证重复编号、验证成品数量上限。

> 首次更新模型后请删除旧的 `database/shangyin.db` 或执行一次 `node app.js`（内部使用 `sequelize.sync({ alter: true })` 自动调整表结构）。
## 10. ��ά��ӿ� `/qrcodes`

| Method | Path | ˵�� |
| ------ | ---- | ---- |
| GET | `/qrcodes/contract/:id` | ��û�ͬID���ɶ�Ӧ�ľ�ά�룬���Ӧ������������
| GET | `/qrcodes/contract-product/:id` | ����ͬ��ƷID���ɶ�Ӧ����ť������ڴ洢��Ʒ��Ϣ��
| GET | `/qrcodes/process/:id` | �����񣬶�ά�������á�processId/processCode��Ϣ��

���еĺ�Ӧ���ش��ṩ:

```json
{
  "success": true,
  "data": {
    "payload": {
      "type": "contractProduct",
      "contractId": 12,
      "contractProductId": 35,
      "contractNumber": "HT-2024-001",
      "productCode": "P-001",
      "productName": "�����A"
    },
    "text": "{\"type\":\"contractProduct\",...}",
    "dataUrl": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

ǰ��ɨ�赽�Ժ�, ��ҿ���ֱ��ʹ�� `payload` �е�����ֵ�����������չʾ��Ʒ��Ϣ��
