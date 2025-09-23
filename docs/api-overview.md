# 上印后台 API 概览

所有接口统一前缀为 `http://localhost:3100/shangyin`（部署到服务器后将域名换成生产地址）。返回值结构统一包含：

```json
{
  "success": true | false,
  "data": { ... },
  "message": "可选的说明"
}
```

## 1. 认证模块 `/auth`

| Method | Path        | 描述                     | 请求体示例 |
| ------ | ----------- | ------------------------ | ---------- |
| POST   | `/auth/login` | 小程序换取 openId/token | `{ "code": "mock_code" }`

- 当前后端未接入微信 SDK，会生成 `mock_openid_${code}` 作为 openId。
- 响应字段：`token`、`userInfo`（含 `openId`、`nickname`、`isEmployee`）、`expiresIn`。

## 2. 微信业务 `/wechat`

| Method | Path                               | 描述                     |
| ------ | ---------------------------------- | ------------------------ |
| POST   | `/wechat/login`                    | 根据 `openId` 判断是否已注册员工 |
| POST   | `/wechat/register`                 | 注册员工信息             |
| GET    | `/wechat/employee/:openId`         | 获取员工基础信息         |
| GET    | `/wechat/employee/:openId/processes` | 获取员工分配工序列表 |

### 关键字段
- `wechat/login`：返回 `isRegistered` 以及 `employee`（已注册）或 `wechatUser`（待注册）信息。
- `wechat/register`：入参 `{ openId, unionId?, name }`，成功后返回创建的 `employee`。

## 3. 员工管理 `/employees`

| Method | Path                     | 描述                           |
| ------ | ------------------------ | ------------------------------ |
| GET    | `/employees`             | 分页查询员工（支持 `status`、`keyword`） |
| POST   | `/employees`             | 创建员工（可附带 `processes`） |
| GET    | `/employees/:id`         | 查询指定员工                   |
| PUT    | `/employees/:id`         | 更新姓名/编码/状态             |
| DELETE | `/employees/:id`         | 逻辑删除（状态置为 `inactive`） |
| POST   | `/employees/:id/processes` | 重新分配工序（`processIds` 数组） |

## 4. 工序管理 `/processes`

- `GET /processes`：分页查询
- `POST /processes`：新增工序
- `PUT /processes/:id`：更新工序
- `DELETE /processes/:id`：删除工序

工序字段：`name`、`code`、`status`、`description?`。

## 5. 产品类型 `/product-types`

- `GET /product-types`、`GET /product-types/:id`
- `POST /product-types`
- `PUT /product-types/:id`
- `DELETE /product-types/:id`

返回数据包含关联工序 `processes`，顺序信息位于 `ProductTypeProcess.sequenceOrder`。

## 6. 后台统计 `/api/admin`

| Method | Path                                     | 描述                   |
| ------ | ---------------------------------------- | ---------------------- |
| GET    | `/api/admin/dashboard/stats`             | 仪表盘统计             |
| GET    | `/api/admin/employees`                   | 后台视角员工管理（支持组合筛选） |
| PUT    | `/api/admin/employees/:id`               | 更新员工               |
| DELETE | `/api/admin/employees/:id`               | 删除员工               |
| DELETE | `/api/admin/employees/:id/wechat`        | 清除员工微信绑定       |
| POST   | `/api/admin/employees/batch/clear-wechat` | 批量清除微信绑定       |
| POST   | `/api/admin/employees/batch/delete`      | 批量删除员工           |

## 7. 任务示例 `/task`

当前为演示数据：
- `GET /task/` 返回占位说明
- `GET /task/user/:userId` 返回示例任务列表
- `POST /task/:taskId/complete` 返回操作提示

## 8. 静态资源

`/shangyin/admin` 提供管理端静态资源。

---

### 调用示例（PowerShell）

```powershell
$base = 'http://localhost:3100/shangyin'

# 1. 登录换取 openId/token
$auth = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -Body (@{ code = 'apitest001' } | ConvertTo-Json) -ContentType 'application/json'
$openId = $auth.data.userInfo.openId

# 2. 微信登录与注册
Invoke-RestMethod -Method Post -Uri "$base/wechat/login" -Body (@{ openId = $openId } | ConvertTo-Json) -ContentType 'application/json'
Invoke-RestMethod -Method Post -Uri "$base/wechat/register" -Body (@{ openId = $openId; name = 'API测试员工' } | ConvertTo-Json) -ContentType 'application/json'
Invoke-RestMethod -Method Post -Uri "$base/wechat/login" -Body (@{ openId = $openId } | ConvertTo-Json) -ContentType 'application/json'

# 3. 核心业务数据
Invoke-RestMethod -Uri "$base/employees?page=1&limit=10"
Invoke-RestMethod -Uri "$base/processes"
Invoke-RestMethod -Uri "$base/product-types"
Invoke-RestMethod -Uri "$base/api/admin/dashboard/stats"
Invoke-RestMethod -Uri "$base/task/user/1"
```

如需更详细字段，请参考 `controllers/*.js` 对请求参数的解析逻辑。
