# Color K-Means 可视化（GitHub Pages 演示版）

演示地址（示例）：

- https://<your-username>.github.io/<your-repo>/

请将上面的 `<your-username>` 和 `<your-repo>` 替换为你的 GitHub 用户名和仓库名。将项目仓库启用 GitHub Pages（通常选择 `gh-pages` 分支或 `main` / `master` 的 `/docs` 目录），并确保仓库根目录包含 `index.html`。

## 本地运行

1. 在项目根目录打开终端。
2. 用简单静态服务器启动（任选其一）：

```bash
# Python 3
python -m http.server 8000

# 或者使用 Node.js 的 http-server（需先安装：npm i -g http-server）
http-server -c-1
```

3. 在浏览器中打开 `http://localhost:8000`（或相应端口）。

## AI 跨域说明与解决方案

- 在 GitHub Pages（域名包含 `github.io`）上，浏览器会对跨域请求受限，项目已在前端检测到 `github.io` 域名时自动使用“模拟分析数据”（mock），避免真实 `fetch` 请求导致页面错误或失败。
- 若需使用真实的阿里云通义千问接口（或其它受保护的大模型接口）：
  1. 在本地启动一个反向代理/后端，转发来自浏览器的请求到阿里云接口并添加所需的 CORS 响应头（或从服务器端直接调用并返回给前端）。
  2. 将 `js/aiApi.js` 中 `AI API` 地址与 `API Key` 配置为代理地址或在 UI 中填写代理地址。

示例 Python Flask 简易代理（仅示意，请根据安全要求改造）：

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/api/ai', methods=['POST'])
def proxy_ai():
    # 转发到真实 AI 接口（示例），并返还响应
    headers = {'Authorization': 'Bearer YOUR_KEY', 'Content-Type': 'application/json'}
    resp = requests.post('https://<real-ai-endpoint>', json=request.json, headers=headers)
    return (resp.content, resp.status_code, resp.headers.items())

if __name__ == '__main__':
    app.run(port=5000)
```

### 推荐：内置简易代理 `server.py`

项目已经包含一个轻量的 Python 代理脚本 `server.py`，用于在本地接收前端请求并转发到真实 AI 接口，同时添加 CORS 头，避免浏览器直接跨域失败。

运行方法（在项目根目录）：

```bash
# 使用系统 Python 直接运行
python server.py

# 默认监听 8000 端口，你可以通过设置环境变量 PORT 修改端口，例如：
PORT=5000 python server.py
```

启动后，前端会优先调用相对路径 `/api/ai-proxy`，由该代理将请求转发到你在页面中配置的 `AI 接口地址`，并在代理端添加 `Authorization: Bearer <API_KEY>`。请在运行代理时确保代理主机可以访问目标 AI 接口，并妥善保管 API Key（不要将 Key 提交到公开仓库）。

## 相对路径要求

本项目内部 CSS/JS 文件使用相对路径引用（例如 `css/style.css`, `js/main.js`），避免使用以 `/` 开头的根路径，这可以保证在 GitHub Pages（子路径）下资源正常加载。

## 其他说明

- 若你希望在 GitHub Pages 上也尝试真实 AI 接口，请部署一个服务器端代理并在页面中填写代理地址，或在本地通过 `python -m http.server` 结合浏览器插件短期绕过 CORS（仅用于开发测试，生产中不可取）。

祝部署顺利！
# Color K-Means 聚类可视化系统 - 项目结构说明

## 项目概述

本项目是一个基于 K-Means 算法的图片颜色聚类可视化系统，支持多颜色空间（RGB、LAB、HSL、CMYK）的聚类分析，配合 ECharts 图表可视化展示，并集成 AI 配色分析功能。

## 项目目录结构

```
color-kmeans-vis/
├── index.html          # 主页面结构
├── css/
│   └── style.css       # 全局样式表
└── js/
    ├── kmeans.js       # K-Means 聚类算法核心模块
    ├── chart.js        # ECharts 图表封装模块
    ├── aiApi.js        # AI 大模型接口请求模块
    └── main.js         # 主应用逻辑与交互控制
```

---

## 文件详细说明

### 1. index.html - 主页面结构

**位置**: `color-kmeans-vis/index.html`

**功能**: 定义整个应用的 HTML 结构，包含导航栏、标题区域、分析面板（三栏布局）等。

**主要结构**:

| 模块 | 说明 |
|------|------|
| `<nav class="navbar">` | 顶部导航栏，包含 FUNC/ABOUT 菜单、用户图标 |
| `<div class="page-title-section">` | 页面标题区域，显示 "Color K-Means" 和副标题 |
| `<div id="panels-container">` | 分析面板容器，支持多面板对比 |
| `<main class="three-column-layout">` | 三栏布局主体 |
| `.column-left` | 左侧图片操作区 |
| `.column-center` | 中间可视化图表区 |
| `.column-right` | 右侧 AI 配色分析区 |

**面板内部结构**:

- **左栏（图片操作区）**:
  - `.left-fixed-top` - 固定上层：上传按钮、图片预览框、图片切换器
  - `.left-scroll-middle` - 弹性滚动层：配色预设容器
  - `.left-fixed-bottom` - 固定底层：配色迁移、恢复原图、撤销按钮

- **中栏（可视化图表区）**:
  - `.chart-controls` - 顶部控件：K值输入、颜色空间选择、图表切换、背景色选择、聚类按钮
  - `.chart-container` - 图表容器（ECharts）
  - `.color-editor-container` - 底部颜色编辑色卡

- **右栏（AI配色分析区）**:
  - `.right-fixed-top` - 固定上层：和谐度分数圆环
  - `.right-scroll-middle` - 弹性滚动层：配色分析报告
  - `.right-fixed-bottom` - 固定底层：AI接口地址输入框

---

### 2. css/style.css - 全局样式表

**位置**: `color-kmeans-vis/css/style.css`

**功能**: 定义页面所有样式，包括布局、组件样式、动画效果等。

**主要样式模块**:

| 模块 | 说明 |
|------|------|
| **基础样式** | `*` 重置、`body` 全局背景渐变、字体设置 |
| **导航栏** | `.navbar` 固定定位、下拉菜单悬停动效、高亮样式 |
| **标题区域** | `.page-title-section` 垂直居中、灰色字体 |
| **三栏布局** | `.three-column-layout` flex等高布局、`align-items: stretch` |
| **左栏分层** | `.left-fixed-top`/`.left-scroll-middle`/`.left-fixed-bottom` |
| **右栏分层** | `.right-fixed-top`/`.right-scroll-middle`/`.right-fixed-bottom` |
| **卡片样式** | `.card` 白色背景、圆角、阴影 |
| **图表控件** | `.chart-controls` 横向排列、按钮组样式 |
| **配色预设** | `.color-presets-container` 弹性高度、内部滚动 |
| **AI分析报告** | `.ai-content` 弹性高度、内部滚动 |
| **滚动条美化** | `.custom-scrollbar` 细浅色滚动条 |
| **按钮样式** | 纯色按钮（蓝色上传、绿色聚类、粉色操作） |
| **响应式** | `@media` 断点适配（1400px、900px） |

---

### 3. js/kmeans.js - K-Means 聚类算法核心模块

**位置**: `color-kmeans-vis/js/kmeans.js`

**功能**: 独立手写实现 K-Means 聚类算法，支持多颜色空间转换和聚类统计。

**核心函数**:

| 函数名 | 说明 |
|--------|------|
| `rgbToLab(r, g, b)` | RGB 转 LAB 颜色空间 |
| `rgbToHsl(r, g, b)` | RGB 转 HSL 颜色空间 |
| `rgbToCmyk(r, g, b)` | RGB 转 CMYK 颜色空间 |
| `labToRgb(l, a, b)` | LAB 转 RGB 颜色空间 |
| `hslToRgb(h, s, l)` | HSL 转 RGB 颜色空间 |
| `cmykToRgb(c, m, y, k)` | CMYK 转 RGB 颜色空间 |
| `distance(color1, color2, space)` | 计算颜色间距离（支持多种空间） |
| `kmeans(pixels, k, space)` | K-Means 聚类主函数 |
| `getClusterStats(result)` | 获取聚类统计信息（颜色、占比） |
| `hexToRgb(hex)` | Hex 转 RGB |
| `rgbToHex(r, g, b)` | RGB 转 Hex |

**使用方式**:
```javascript
const result = ColorKMeans.kmeans(pixels, 5, 'hsl');
const stats = ColorKMeans.getClusterStats(result);
```

---

### 4. js/chart.js - ECharts 图表封装模块

**位置**: `color-kmeans-vis/js/chart.js`

**功能**: 封装 ECharts 图表实例管理，支持多种图表类型切换。

**核心函数**:

| 函数名 | 说明 |
|--------|------|
| `initChart(panelId, containerId)` | 初始化 ECharts 实例 |
| `setBackground(panelId, color)` | 设置图表背景色 |
| `updateChart(panelId, data)` | 更新图表数据 |
| `switchChart(panelId, chartType)` | 切换图表类型 |
| `destroyChart(panelId)` | 销毁图表实例 |

**支持的图表类型**:

| 类型 | 说明 |
|------|------|
| `pie` | 饼图/环形图 |
| `bar` | 柱状图 |
| `rose` | 玫瑰图 |
| `scatter` | 散点图 |

**使用方式**:
```javascript
ColorChart.initChart('0', 'chart-0');
ColorChart.updateChart('0', clusterData);
ColorChart.switchChart('0', 'bar');
```

---

### 5. js/aiApi.js - AI 大模型接口请求模块

**位置**: `color-kmeans-vis/js/aiApi.js`

**功能**: 封装 AI 配色分析接口请求，生成分析报告和和谐度评分。

**核心函数**:

| 函数名 | 说明 |
|--------|------|
| `setApiUrl(panelId, url)` | 设置 AI API 地址 |
| `getApiUrl(panelId)` | 获取 AI API 地址 |
| `generatePrompt(colors)` | 生成 AI 分析提示词 |
| `analyzeColors(panelId, colors, callback)` | 请求 AI 分析配色 |

**分析内容**:
- 配色风格判断
- 和谐度打分（0-100）
- 优缺点分析
- 搭配优化建议

**使用方式**:
```javascript
ColorAI.setApiUrl('0', 'https://api.example.com/v1/chat/completions');
ColorAI.analyzeColors('0', colors, (result) => {
    // 处理 AI 返回结果
});
```

---

### 6. js/main.js - 主应用逻辑与交互控制

**位置**: `color-kmeans-vis/js/color-kmeans-vis/js/main.js`

**功能**: 整合所有模块，处理用户交互、事件绑定、状态管理等。

**主要功能模块**:

| 模块 | 说明 |
|------|------|
| **导航栏交互** | 下拉菜单悬停显示/收起、菜单动作处理 |
| **面板管理** | 新建面板、删除面板、多面板对比 |
| **图片上传** | 文件选择、预览、缓存到 localStorage |
| **聚类执行** | 调用 kmeans.js 执行聚类、更新图表 |
| **配色预设** | 8 套预设配色方案、点击应用 |
| **配色迁移** | 跨面板配色迁移 |
| **颜色编辑** | 底部色卡编辑、修改单个颜色 |
| **恢复原图** | 恢复原始图片，保留聚类数据 |
| **AI分析** | 调用 aiApi.js 获取分析报告 |
| **历史缓存** | 本地存储历史图片、下拉选择 |
| **颜色命名** | 专业颜色名称映射（藏青、青苹果绿等） |

**关键数据结构**:

| 变量 | 说明 |
|------|------|
| `panelCount` | 当前面板数量 |
| `panels` | 面板状态对象，存储各面板数据 |
| `cachedImages` | 本地缓存的历史图片 |
| `colorNames` | 颜色名称映射表 |

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| HTML5 | - | 页面结构 |
| CSS3 | - | 样式布局、动画 |
| JavaScript ES6+ | - | 业务逻辑 |
| ECharts | 5.4.3 | 图表可视化 |
| localStorage | - | 图片缓存 |

## 启动方式

直接在浏览器中打开 `index.html`，或使用本地服务器：

```bash
cd color-kmeans-vis
python -m http.server 8082
# 访问 http://localhost:8082/index.html
```
