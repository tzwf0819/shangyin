# 工业ERP设计系统

## 概述

本项目采用 **工业ERP（Enterprise Resource Planning）** 设计风格，专为制造业生产管理系统打造。设计强调专业性、高效性和数据密集型操作，提供清晰、可信赖的企业级用户体验。

## 设计哲学

### 核心原则
- **专业性**：稳重、可信赖的深色导航配合清晰的内容区域
- **高效性**：紧凑布局，信息密度高，减少滚动
- **可读性**：高对比度配色，确保数据清晰可辨
- **一致性**：统一的组件规范，降低学习成本

### 设计特点
- 深色侧边导航（Dark Sidebar）
- 浅灰背景 + 白色卡片的内容区域
- 蓝色主色调，传递专业和科技感
- 鲜明的状态颜色（红、黄、绿、蓝）
- 紧凑的表格和表单设计
- 清晰的数据层级和视觉引导

## 色彩系统

### 主色调
| 颜色 | 色值 | 用途 |
|------|------|------|
| 主色 | `#2563eb` | 主要按钮、链接、强调 |
| 主色深 | `#1d4ed8` | 悬停状态 |
| 主色浅 | `#dbeafe` | 选中背景、高亮 |

### 侧边栏颜色（深色）
| 颜色 | 色值 | 用途 |
|------|------|------|
| 背景 | `#111827` | 侧边栏背景 |
| 悬停 | `#1f2937` | 菜单项悬停 |
| 激活 | `#374151` | 当前选中菜单 |
| 文字 | `#9ca3af` | 默认菜单文字 |
| 激活文字 | `#ffffff` | 选中菜单文字 |

### 状态颜色
| 状态 | 颜色 | 浅色背景 |
|------|------|----------|
| 成功 | `#059669` | `#d1fae5` |
| 警告 | `#d97706` | `#fef3c7` |
| 错误 | `#dc2626` | `#fee2e2` |
| 信息 | `#0891b2` | `#cffafe` |

### 灰度色阶
```
--gray-50:  #f9fafb   (最浅背景)
--gray-100: #f3f4f6   (页面背景)
--gray-200: #e5e7eb   (边框)
--gray-300: #d1d5db   (深色边框)
--gray-400: #9ca3af   (弱化文字)
--gray-500: #6b7280   (次要文字)
--gray-600: #4b5563   (次级文字)
--gray-700: #374151   (深灰文字)
--gray-800: #1f2937   (侧边栏悬停)
--gray-900: #111827   (深色文字/侧边栏)
```

## 布局规范

### 侧边栏
- 宽度：240px（固定）
- 背景：深色（#111827）
- Logo区域：高度56px，带底部边框
- 菜单项：左3px激活指示器
- 文字：大写转换，字母间距0.3px

### 顶部导航
- 高度：56px
- 背景：白色
- 底部边框：1px solid #e5e7eb
- 标题：18px，font-weight: 600

### 内容区域
- 背景：#f3f4f6（浅灰）
- 内边距：20px 24px
- 左侧留白：240px（为侧边栏留出空间）

## 组件规范

### 按钮
```css
/* 主要按钮 */
.erp-btn-primary {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

/* 次要按钮 */
.erp-btn-secondary {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

/* 危险按钮 */
.erp-btn-danger {
  background: #dc2626;
  border: 1px solid #dc2626;
  color: white;
}
```

### 卡片
```css
.erp-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
```

### 表格
```css
.erp-table th {
  background: #f9fafb;
  color: #4b5563;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.erp-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.erp-table tbody tr:hover {
  background: #f9fafb;
}
```

### 状态徽章
```css
.erp-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 3px;
  text-transform: uppercase;
}

.erp-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
```

### 表单
```css
.erp-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.erp-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
}

.erp-form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
```

### 统计卡片
```css
.erp-stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.erp-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.erp-stat-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
```

## 文件清单

### Admin 后台样式
| 文件 | 说明 |
|------|------|
| `admin/assets/css/erp-design.css` | ERP设计系统完整CSS |
| `admin/assets/css/admin.css` | Admin主样式 |
| `admin/assets/css/sony-design.css` | 兼容样式（已更新） |
| `admin/index.html` | 入口文件配色 |

### 小程序样式
| 文件 | 说明 |
|------|------|
| `miniprogram/app.wxss` | 全局样式 |
| `miniprogram/styles/theme.wxss` | 主题变量 |
| `miniprogram/pages/*/index.wxss` | 各页面样式 |
| `miniprogram/components/*/*.wxss` | 组件样式 |

## 响应式断点

```css
/* 移动端适配 */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .main { margin-left: 0; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
```

## 使用示例

### HTML结构
```html
<div class="erp-layout">
  <!-- 侧边栏 -->
  <aside class="erp-sidebar">
    <div class="erp-sidebar-header">
      <div class="erp-sidebar-logo">E</div>
      <span class="erp-sidebar-title">ERP系统</span>
    </div>
    <nav class="erp-sidebar-nav">
      <div class="erp-nav-section">
        <div class="erp-nav-section-title">主菜单</div>
        <a class="erp-nav-item active">
          <i class="fas fa-home"></i>
          <span>Dashboard</span>
        </a>
      </div>
    </nav>
  </aside>
  
  <!-- 主内容 -->
  <main class="erp-main">
    <header class="erp-header">
      <h1 class="erp-header-title">生产管理</h1>
      <div class="erp-header-actions">
        <button class="erp-btn erp-btn-primary">新建工单</button>
      </div>
    </header>
    
    <div class="erp-content">
      <div class="erp-stats-grid">
        <div class="erp-stat-card">
          <div class="erp-stat-icon primary">
            <i class="fas fa-cube"></i>
          </div>
          <div class="erp-stat-content">
            <div class="erp-stat-label">今日产量</div>
            <div class="erp-stat-value">1,234</div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
```

## 注意事项

1. **深色侧边栏**：使用 #111827 作为背景，避免纯黑造成压抑感
2. **高对比度**：确保文字与背景对比度符合 WCAG 2.1 AA 标准
3. **紧凑布局**：ERP系统信息密度高，适当减少内边距
4. **状态标识**：使用颜色+文字+圆点，多重标识确保可访问性
5. **表格优化**：固定表头，斑马纹可选，hover效果必备

## 参考资源

- [Ant Design Pro](https://pro.ant.design/) - 企业级中后台前端设计
- [Material Design for Enterprise](https://material.io/design/)
- [SAP Fiori Design Guidelines](https://experience.sap.com/fiori-design/)
