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

# 1. Auth login
$auth = Invoke-JsonPost -Uri "$BaseUrl/auth/login" -Body @{ code = 'apitest001' }
$openId = $auth.data.userInfo.openId
Write-Host "Auth login OK -> openId: $openId" -ForegroundColor Green

# 2. WeChat login & registration flow
$login1 = Invoke-JsonPost -Uri "$BaseUrl/wechat/login" -Body @{ openId = $openId }
if (-not $login1.success) { throw "wechat/login failed" }

if (-not $login1.data.isRegistered) {
  $register = Invoke-JsonPost -Uri "$BaseUrl/wechat/register" -Body @{ openId = $openId; name = 'API测试员工' }
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

Write-Host "API smoke tests finished" -ForegroundColor Cyan
