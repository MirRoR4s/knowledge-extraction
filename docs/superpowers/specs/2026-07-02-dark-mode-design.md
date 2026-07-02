# 深色模式设计文档

## 目标
为 Docsify 知识萃取站点添加深色模式切换功能，使用 Docsify 内置 `dark.css` 主题。

## 修改范围
仅修改 `index.html` 一个文件。无需额外依赖、无需新建 CSS 文件。

## 实现细节

### 1. `<head>` — 主题 CSS 加载
将 CDN CSS `<link>` 加上 `id="theme-link"`，用于 JS 操作切换。

### 2. `<body>` — 切换按钮
在 `<body>` 开头添加固定定位按钮，显示 🌙/☀️ 图标。

### 3. 内联 CSS
按钮样式：右上角固定、圆形、半透明背景、悬浮效果。

### 4. 内联 JavaScript
- 页面加载时检查 `localStorage` 的 `knowledge-theme` 值
- 若为 `'dark'` 则加载 `dark.css`
- 点击按钮切换并保存偏好

### 用户流程
1. 首次访问 → 浅色模式
2. 点击右上角 🌙 → 切换为深色，图标变为 ☀️
3. 刷新页面 → 保持上次选择
4. 再次点击 → 切回浅色

### 不涉及
- 不修改 `scripts/gen-sidebar.js`
- 不修改任何 Markdown 文件
- 不新增 CSS/JS 文件
- 不对外部依赖做任何更改

## 技术方案
CDN 链接切换方案（方案一）：动态替换 `<link>` 标签的 `href`，在 `vue.css` 和 `dark.css` 之间切换。
