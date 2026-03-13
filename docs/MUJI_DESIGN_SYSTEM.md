# MUJI 极简主义设计系统

## 概述

本项目已全面升级为 **MUJI 极简主义（Minimalism）** 设计风格，参考无印良品(MUJI)中国官网的配色和设计理念，打造自然、简洁、干净的用户界面。

## 设计哲学

### 1. 极简主义原则
- **大量留白**：给内容呼吸空间，减少视觉噪音
- **扁平化设计**：去除不必要的阴影、渐变和圆角
- **自然色彩**：采用大地色系，营造温暖舒适的氛围
- **清晰排版**：使用简洁的字体，强调可读性

### 2. 色彩系统

#### 主色调
| 颜色 | 色值 | 用途 |
|------|------|------|
| 米白背景 | `#FAFAF8` | 页面背景 |
| 暖灰背景 | `#F5F5F0` | 卡片背景、强调区域 |
| 纯白 | `#FFFFFF` | 卡片、弹窗背景 |
| 原木色 | `#C4A77D` | 主要按钮、强调色 |
| 深原木 | `#A68B5B` | 按钮悬停、激活状态 |

#### 文字颜色
| 颜色 | 色值 | 用途 |
|------|------|------|
| 主文字 | `#333333` | 标题、主要内容 |
| 次要文字 | `#666666` | 描述、辅助信息 |
| 弱化文字 | `#999999` | 提示、禁用状态 |

#### 状态颜色（柔和版）
| 状态 | 色值 | 浅色背景 |
|------|------|----------|
| 成功 | `#7A9E7E` | `#E8F0E9` |
| 警告 | `#C9A96E` | `#F5EFE4` |
| 错误 | `#B87A7A` | `#F0E4E4` |
| 信息 | `#7A8B9E` | `#E4E8F0` |

#### 灰度色阶（暖调）
```
--muji-gray-50:  #FAFAF8
--muji-gray-100: #F5F5F0
--muji-gray-200: #E8E8E3
--muji-gray-300: #D4D4CF
--muji-gray-400: #B8B8B3
--muji-gray-500: #9A9A95
--muji-gray-600: #7A7A75
--muji-gray-700: #5A5A55
--muji-gray-800: #4A4A48
--muji-gray-900: #2A2A28
```

### 3. 边框与阴影

#### 边框
- 常规边框：`1px solid #E8E8E3`
- 轻边框：`1px solid #F5F5F0`
- 强调边框：`1px solid #D4D4CF`

#### 阴影（极简）
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.08);
```

### 4. 圆角

MUJI风格使用**极小的圆角**或**无圆角**：
```css
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 6px;
```

小程序中卡片和按钮使用直角（`border-radius: 0`）

### 5. 字体规范

#### 字体族
```css
font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 
             'PingFang SC', 'Microsoft YaHei', sans-serif;
```

#### 字号
| 级别 | 尺寸 | 用途 |
|------|------|------|
| 3XL | 28px | 主要数据展示 |
| 2XL | 22px | 页面标题 |
| XL | 18px | 区块标题 |
| LG | 16px | 小标题 |
| BASE | 14px | 正文 |
| SM | 13px | 辅助文字 |
| XS | 12px | 标签、提示 |

## 文件变更清单

### Admin 后台样式
| 文件 | 变更内容 |
|------|----------|
| `admin/assets/css/admin.css` | 全面重写为MUJI风格 |
| `admin/assets/css/sony-design.css` | 更新为MUJI设计系统 |
| `admin/assets/css/muji-design.css` | 新增MUJI设计系统CSS |
| `admin/index.html` | 更新CSS变量为MUJI配色 |

### 小程序样式
| 文件 | 变更内容 |
|------|----------|
| `miniprogram/app.wxss` | 更新全局样式为MUJI风格 |
| `miniprogram/styles/theme.wxss` | 重写主题为MUJI配色 |
| `miniprogram/pages/home/index.wxss` | 更新首页样式 |
| `miniprogram/pages/login/index.wxss` | 更新登录页样式 |
| `miniprogram/pages/process/index.wxss` | 更新工序页样式 |
| `miniprogram/pages/profile/index.wxss` | 更新个人中心样式 |
| `miniprogram/pages/my-records/index.wxss` | 更新记录页样式 |
| `miniprogram/pages/product-list/index.wxss` | 更新产品列表样式 |
| `miniprogram/pages/record/index.wxss` | 更新记录详情样式 |
| `miniprogram/pages/salesman/index.wxss` | 更新销售员首页样式 |
| `miniprogram/pages/salesman/contract-detail.wxss` | 更新合同详情样式 |
| `miniprogram/components/header-card/index.wxss` | 更新头部卡片组件 |
| `miniprogram/components/process-card/index.wxss` | 更新工序卡片组件 |

## 组件样式规范

### 按钮
```css
/* 主要按钮 */
.muji-button-primary {
  background: #C4A77D;
  border: 1px solid #C4A77D;
  color: #FFFFFF;
}

/* 次要按钮 */
.muji-button {
  background: #FFFFFF;
  border: 1px solid #D4D4CF;
  color: #333333;
}

/* 危险按钮 */
.muji-button-danger {
  color: #B87A7A;
  border-color: #B87A7A;
}
```

### 卡片
```css
.muji-card {
  background: #FFFFFF;
  border: 1rpx solid #E8E8E3;
  padding: 28rpx;
  /* 无圆角，无阴影 */
}
```

### 输入框
```css
.muji-input {
  background: #FFFFFF;
  border: 1px solid #D4D4CF;
  padding: 12px 14px;
  /* 无圆角 */
}

.muji-input:focus {
  border-color: #C4A77D;
}
```

### 表格
```css
.muji-table th {
  background: #F5F5F0;
  color: #666666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 12px;
}

.muji-table td {
  border-bottom: 1px solid #E8E8E3;
}
```

### 标签/徽章
```css
.muji-badge {
  background: #F5F5F0;
  color: #666666;
  padding: 4px 10px;
  font-size: 12px;
  letter-spacing: 0.5px;
}
```

## 使用示例

### Admin 页面引入
```html
<!-- index.html -->
<link rel="stylesheet" href="/assets/css/admin.css">
<!-- 或使用 MUJI 设计系统 -->
<link rel="stylesheet" href="/assets/css/muji-design.css">
```

### 小程序页面
小程序已全局引入主题文件，无需额外配置：
```css
/* app.wxss 已自动引入 */
@import 'styles/theme.wxss';
```

## 注意事项

1. **不要使用圆角**：MUJI风格强调直角设计
2. **不要使用渐变**：使用纯色或极浅的单色背景
3. **不要使用大阴影**：如需阴影，使用最轻量级的阴影
4. **保持留白**：元素之间保持足够的间距
5. **使用自然色**：避免鲜艳的颜色，使用大地色系

## 参考资源

- [MUJI 中国官网](https://www.muji.com.cn/cn/store/)
- 设计理念："这样就好" - 不过分追求华丽，追求恰到好处的舒适
