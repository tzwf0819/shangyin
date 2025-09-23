param(
  [string]$BaseUrl = 'http://localhost:3100/shangyin'
)

Write-Host "Running API smoke tests against $BaseUrl" -ForegroundColor Cyan

function Invoke-JsonPost {
  param(
    [string]$Uri,
    [hashtable]$Body
  )
  $json = $Body | ConvertTo-Json -Depth 5
  return Invoke-RestMethod -Method Post -Uri $Uri -Body $json -ContentType 'application/json'
}

function Invoke-JsonPut {
  param(
    [string]$Uri,
    [hashtable]$Body
  )
  $json = $Body | ConvertTo-Json -Depth 5
  return Invoke-RestMethod -Method Put -Uri $Uri -Body $json -ContentType 'application/json'
}

# 1. Auth login
$auth = Invoke-JsonPost -Uri "$BaseUrl/auth/login" -Body @{ code = 'apitest001' }
$openId = $auth.data.userInfo.openId
Write-Host "Auth login OK -> openId: $openId" -ForegroundColor Green

# 2. WeChat login & registration flow
$login1 = Invoke-JsonPost -Uri "$BaseUrl/wechat/login" -Body @{ openId = $openId }
if (-not $login1.success) { throw "wechat/login failed" }

if (-not $login1.data.isRegistered) {
  $register = Invoke-JsonPost -Uri "$BaseUrl/wechat/register" -Body @{ openId = $openId; name = 'API自动化员工' }
  if (-not $register.success) { throw "wechat/register failed" }
  Write-Host "Registered employee id $($register.data.employee.id)" -ForegroundColor Green
}

$login2 = Invoke-JsonPost -Uri "$BaseUrl/wechat/login" -Body @{ openId = $openId }
if (-not $login2.data.isRegistered) { throw "Employee still not registered" }
Write-Host "Wechat login reuse check OK" -ForegroundColor Green

# 3. Core queries
$employees = Invoke-RestMethod -Uri "$BaseUrl/employees?page=1&limit=5"
$processes = Invoke-RestMethod -Uri "$BaseUrl/processes"
$productTypes = Invoke-RestMethod -Uri "$BaseUrl/product-types"
$stats = Invoke-RestMethod -Uri "$BaseUrl/api/admin/dashboard/stats"
$tasks = Invoke-RestMethod -Uri "$BaseUrl/task/user/1"

Write-Host "Employees total: $($employees.data.total)" -ForegroundColor Green
Write-Host "Processes total: $($processes.data.total)" -ForegroundColor Green
Write-Host "Product types total: $($productTypes.data.total)" -ForegroundColor Green
Write-Host "Dashboard employees: $($stats.data.employees)" -ForegroundColor Green
Write-Host "Sample tasks: $($tasks.data.tasks.Count)" -ForegroundColor Green

# 4. Contract happy path
$contractNo = "AUTO-" + (Get-Date -Format 'yyyyMMddHHmmss')
$productType = $productTypes.data.items | Select-Object -First 1
if (-not $productType) {
  $productType = @{ id = $null; name = '默认类型'; code = 'PT000' }
}

$contractPayload = @{
  contractNumber = $contractNo
  partyAName = '自动化甲方'
  partyBName = '上茚工厂'
  salesId = ($employees.data.items | Select-Object -First 1).code
  terms = @('质量保证', '交付时间 30 天')
  processStatus = @{
    startProduction = (Get-Date -Format 'yyyy-MM-dd')
  }
  products = @(
    @{
      productName = '自动化成品A'
      productCode = 'AUTO-A'
      quantity = '2'
      unitPrice = '1800'
      totalAmount = '3600'
      productTypeId = $productType.id
      productTypeName = $productType.name
      productTypeCode = $productType.code
      newWoodBox = $true
    }
  )
}

$createRes = Invoke-JsonPost -Uri "$BaseUrl/contracts" -Body $contractPayload
if (-not $createRes.success) { throw "创建合同失败: $($createRes.message)" }
$contractId = $createRes.data.contract.id
Write-Host "Contract created -> id $contractId" -ForegroundColor Green

# 查询列表和详情
$listRes = Invoke-RestMethod -Uri "$BaseUrl/contracts?page=1&pageSize=5&keyword=$contractNo"
if ($listRes.data.items.Count -lt 1) { throw '合同列表查询失败' }
$detailRes = Invoke-RestMethod -Uri "$BaseUrl/contracts/$contractId"
if ($detailRes.data.contract.contractNumber -ne $contractNo) { throw '合同详情校验失败' }
Write-Host "Contract query checks OK" -ForegroundColor Green

# 重复编号校验
$duplicateRes = Invoke-JsonPost -Uri "$BaseUrl/contracts" -Body $contractPayload
if ($duplicateRes.success) { throw '重复合同编号校验未生效' }
Write-Host "Duplicate contract number rejected as expected" -ForegroundColor Green

# 成品数量上限校验
$overProducts = 0..10 | ForEach-Object {
  @{
    productName = "超限成品$_"
    productCode = "LIMIT-$_"
    quantity = '1'
  }
}
$overPayload = [hashtable]$contractPayload.Clone()
$overPayload.contractNumber = "$contractNo-LIMIT"
$overPayload.products = $overProducts
$overflowRes = Invoke-JsonPost -Uri "$BaseUrl/contracts" -Body $overPayload
if ($overflowRes.success) { throw '成品数量上限校验未生效' }
Write-Host "Product limit check rejected as expected" -ForegroundColor Green

# 删除测试合同
Invoke-RestMethod -Method Delete -Uri "$BaseUrl/contracts/$contractId" | Out-Null
Write-Host "Cleanup contract $contractId" -ForegroundColor Green

Write-Host "API smoke tests finished" -ForegroundColor Cyan
