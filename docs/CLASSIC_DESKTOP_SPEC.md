# 鸿浩达 ERP - 经典桌面风格设计规范 v2.0

## 设计理念

基于传统 Windows 桌面 ERP 系统风格，保持熟悉的操作体验，同时用现代 Web 技术实现。

### 参考来源
- Windows 经典桌面应用
- 传统 ERP 系统界面
- WinForms 风格布局

---

## 色彩体系

### 主色调
```css
/* 背景色 */
--bg-primary: #f0f0f0;        /* 主背景 - 浅灰 */
--bg-secondary: #e8e8e8;      /* 次级背景 - 灰色 */
--bg-form: #ffffff;           /* 表单区域 - 纯白 */
--bg-header: #d4d4d4;         /* 标题栏 - 深灰 */
--bg-tab: #f5f5f5;            /* 标签页背景 */
--bg-tab-active: #ffffff;     /* 标签页激活 */
--bg-input: #ffffff;          /* 输入框背景 */
--bg-button: #e1e1e1;         /* 按钮背景 */
--bg-button-hover: #d0d0d0;   /* 按钮悬停 */

/* 边框色 */
--border-primary: #a0a0a0;    /* 主边框 - 深灰 */
--border-secondary: #c0c0c0;  /* 次边框 - 中灰 */
--border-input: #7d7d7d;      /* 输入框边框 */
--border-focus: #0078d4;      /* 聚焦边框 - 蓝色 */

/* 文字色 */
--text-primary: #000000;      /* 主文字 - 黑色 */
--text-secondary: #333333;    /* 次文字 - 深灰 */
--text-label: #000000;        /* 标签文字 - 黑 */
--text-muted: #666666;        /* 弱化文字 - 灰 */
--text-link: #0066cc;         /* 链接 - 蓝 */

/* 功能色 */
--color-required: #ff0000;    /* 必填项 - 红 */
--color-error: #ff0000;       /* 错误 - 红 */
--color-success: #008000;     /* 成功 - 绿 */
--color-warning: #ffa500;     /* 警告 - 橙 */

/* 强调色 */
--accent-blue: #0078d4;       /* 强调蓝 */
--accent-orange: #ff6b35;     /* 强调橙 - 用于重要提示 */
```

---

## 字体规范

### 字体家族
```css
/* 主字体 - Windows 风格 */
--font-primary: 'Microsoft YaHei', 'SimSun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

/* 数字字体 */
--font-mono: 'Consolas', 'Courier New', monospace;
```

### 字号体系
```css
/* 标题 */
--text-window-title: 14px;    /* 窗口标题 */
--text-section: 13px;         /* 区块标题 */
--text-group: 12px;           /* 分组标题 */

/* 正文 */
--text-label: 12px;           /* 标签文字 */
--text-input: 12px;           /* 输入文字 */
--text-button: 12px;          /* 按钮文字 */
--text-small: 11px;           /* 辅助文字 */
```

### 字重
```css
--font-normal: 400;
--font-bold: 700;
```

---

## 布局规范

### 整体结构（参考图片）
```
┌─────────────────────────────────────────────────────────────┐
│  窗口标题栏: "订单录入窗口"                                    │
├─────────────────────────────────────────────────────────────┤
│  标签页: [订单内容] [图片1] [图片2] [图片3] [图片4] [其他]     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  标题: "生产通知单"                                  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  产品信息                                            │   │
│  │  ┌───────┬───────┬───────┬───────┐                  │   │
│  │  │标签:  │输入框 │标签:  │输入框 │                  │   │
│  │  ├───────┼───────┼───────┼───────┤                  │   │
│  │  │标签:  │输入框 │标签:  │输入框 │                  │   │
│  │  └───────┴───────┴───────┴───────┘                  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  印刷车间                                            │   │
│  │  ┌───────┬───────┬───────┬───────┐                  │   │
│  │  │复选框 │标签   │输入框 │...    │                  │   │
│  │  └───────┴───────┴───────┴───────┘                  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  复合车间                                            │   │
│  │  ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  按钮区: [保存] [打印] [关闭]                                │
└─────────────────────────────────────────────────────────────┘
```

### 间距系统
```css
--space-xs: 2px;
--space-sm: 4px;
--space-md: 8px;
--space-lg: 12px;
--space-xl: 16px;

/* 表单内边距 */
--form-padding: 8px;
--section-padding: 12px;
--input-padding: 4px 6px;
```

### 区块分组（参考图片）
```css
/* 分组框样式 */
.group-box {
  border: 1px solid var(--border-primary);
  background: var(--bg-form);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}

/* 分组标题（左侧竖排） */
.group-title-vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
  background: var(--bg-header);
  padding: var(--space-sm);
  font-weight: bold;
  font-size: var(--text-group);
}
```

---

## 组件样式

### 8.1 窗口/面板
```css
.window {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.window-title {
  background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
  padding: 6px 10px;
  font-weight: bold;
  border-bottom: 1px solid var(--border-primary);
}
```

### 8.2 标签页 (Tabs)
```css
.tabs {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.tab-item {
  background: var(--bg-tab);
  border: 1px solid var(--border-secondary);
  border-bottom: none;
  padding: 6px 16px;
  font-size: var(--text-label);
  cursor: pointer;
}

.tab-item.active {
  background: var(--bg-tab-active);
  border-color: var(--border-primary);
  border-bottom: 1px solid var(--bg-tab-active);
  font-weight: bold;
}
```

### 8.3 表单标签和输入框
```css
/* 标签样式 */
.form-label {
  color: var(--text-label);
  font-size: var(--text-label);
  text-align: right;
  padding-right: var(--space-sm);
}

/* 输入框样式 */
.form-input {
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  padding: var(--input-padding);
  font-size: var(--text-input);
  min-height: 24px;
}

.form-input:focus {
  border-color: var(--border-focus);
  outline: 1px solid var(--border-focus);
}

.form-input:disabled {
  background: var(--bg-secondary);
  color: var(--text-muted);
}
```

### 8.4 下拉选择框
```css
.form-select {
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  padding: var(--input-padding);
  font-size: var(--text-input);
  min-height: 24px;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* 下拉箭头 */
  background-repeat: no-repeat;
  background-position: right 4px center;
  padding-right: 20px;
}
```

### 8.5 复选框
```css
.form-checkbox {
  width: 13px;
  height: 13px;
  border: 1px solid var(--border-input);
  background: var(--bg-input);
}

.form-checkbox:checked {
  background: var(--accent-blue);
}
```

### 8.6 按钮
```css
.btn {
  background: var(--bg-button);
  border: 1px solid var(--border-secondary);
  padding: 4px 16px;
  font-size: var(--text-button);
  cursor: pointer;
  min-height: 26px;
}

.btn:hover {
  background: var(--bg-button-hover);
  border-color: var(--border-primary);
}

.btn:active {
  background: #c0c0c0;
  border-color: #808080;
}

.btn-primary {
  background: #0078d4;
  color: white;
  border-color: #005a9e;
}
```

### 8.7 表格
```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-label);
}

.table th {
  background: var(--bg-header);
  border: 1px solid var(--border-secondary);
  padding: var(--space-sm);
  font-weight: bold;
  text-align: left;
}

.table td {
  background: var(--bg-form);
  border: 1px solid var(--border-secondary);
  padding: var(--space-sm);
}

.table tr:hover td {
  background: #e8f4fc;
}
```

---

## 表单布局（参考图片）

### 两列布局
```css
.form-row {
  display: flex;
  margin-bottom: var(--space-sm);
}

.form-field {
  display: flex;
  align-items: center;
  flex: 1;
  margin-right: var(--space-md);
}

.form-field label {
  width: 80px;
  text-align: right;
  margin-right: var(--space-sm);
}

.form-field input,
.form-field select {
  flex: 1;
  min-width: 100px;
}
```

### 三列布局
```css
.form-row-3 {
  display: flex;
  margin-bottom: var(--space-sm);
}

.form-row-3 .form-field {
  flex: 1;
}
```

---

## 特殊元素

### 必填项标记
```css
.required::before {
  content: "*";
  color: var(--color-required);
  margin-right: 2px;
}
```

### 提示文字（参考图片顶部红色提示）
```css
.hint-text {
  color: #ff0000;
  font-size: var(--text-small);
  padding: var(--space-sm);
  background: #fff3cd;
  border: 1px solid #ffc107;
}
```

### 分组标题（左侧竖排）
```css
.section-title-left {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  background: var(--bg-header);
  padding: 4px 12px;
  font-weight: bold;
  border: 1px solid var(--border-primary);
  white-space: nowrap;
}
```

---

## Ant Design 主题配置

```javascript
const classicDesktopTheme = {
  token: {
    // 色彩
    colorBgBase: '#f0f0f0',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#f5f5f5',
    colorBgLayout: '#f0f0f0',
    
    colorBorder: '#a0a0a0',
    colorBorderSecondary: '#c0c0c0',
    
    colorTextBase: '#000000',
    colorText: '#000000',
    colorTextSecondary: '#333333',
    
    colorPrimary: '#0078d4',
    colorError: '#ff0000',
    colorWarning: '#ffa500',
    colorSuccess: '#008000',
    
    // 圆角
    borderRadius: 2,
    borderRadiusLG: 4,
    borderRadiusSM: 2,
    
    // 字体
    fontFamily: "'Microsoft YaHei', 'SimSun', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 12,
    
    // 间距
    paddingXS: 4,
    paddingSM: 6,
    padding: 8,
    paddingMD: 12,
    paddingLG: 16,
    
    // 控件
    controlHeight: 26,
    controlHeightSM: 22,
    controlHeightLG: 32,
  },
  components: {
    Button: {
      borderRadius: 2,
      paddingInline: 16,
    },
    Input: {
      borderRadius: 2,
      paddingInline: 6,
    },
    Select: {
      borderRadius: 2,
    },
    Tabs: {
      cardBg: '#f5f5f5',
      cardHeight: 28,
    },
    Table: {
      headerBg: '#d4d4d4',
      borderColor: '#c0c0c0',
    },
  },
};
```

---

## 页面改造清单

### 核心表单页面（参考图片风格）
- [ ] `pages/Orders/Form.tsx` - 订单录入表单（重点）
- [ ] `pages/Sales/Form.tsx` - 销售开单
- [ ] `pages/Production/Form.tsx` - 生产通知单

### 布局
- [ ] `components/Layout/index.tsx` - 传统桌面布局

### 样式文件
- [ ] `theme.ts` - 经典桌面主题
- [ ] `index.css` - 全局样式覆盖

---

## 实施步骤

### 阶段 1: 基础配置
1. 更新 theme.ts 为经典桌面风格
2. 更新 index.css 全局样式
3. 更新 App.tsx 引入新主题

### 阶段 2: 表单页面改造
按图片布局重新设计：
- 两列/三列表单布局
- 分组框样式
- 左侧竖排标题
- 标签页导航

### 阶段 3: 测试验证
确保所有表单页面风格统一

---

**文档版本**: 2.0  
**更新日期**: 2026-03-13  
**风格**: 经典 Windows 桌面 ERP 风格
