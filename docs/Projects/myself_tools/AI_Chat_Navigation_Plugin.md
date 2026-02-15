# 从 0 到 1：一个提升 AI 对话效率的浏览器插件（架构+实现+发布）

[插件源码下载链接](https://github.com/moyan726/data-analytics-notes/tree/main/Data_and_original_files)  **Progect_gemini_nav_extension**在这个文件夹中

> **一句话痛点**：在 Gemini、ChatGPT 动辄上百轮的长对话中，想回头找某个“中间的提问”，只能疯狂滚动鼠标滚轮？这个插件能帮你一键直达。



**3 个核心卖点**：

*   🚀 **一键导航**：自动提取当前页面的所有提问，生成悬浮目录，点击即达。
*   🤖 **全平台支持**：一套代码同时支持 Gemini、ChatGPT、Claude，架构灵活可扩展。
*   ⚡ **极轻量级**：纯原生 JavaScript 实现，无 React/Vue 依赖，加载速度飞快。

---

## 1. 使用场景与目标

### 真实场景

1.  **长文写作/代码调试**：你和 AI 聊了 50 轮，突然想看第 5 轮它给出的那个代码片段，但滚动条已经只有 1 像素高了。
2.  **多分支对话**：你在同一个 Session 里问了三个不同的话题，想快速在话题间切换。

### 目标清单

*   ✅ **能做什么**：自动识别用户提问气泡、生成侧边栏目录、点击跳转、跟随滚动高亮、支持搜索过滤。
*   ❌ **不能做什么**：不保存聊天记录到服务器（隐私安全）、不修改 AI 的回复内容、不干扰原有页面布局。

---

## 2. 插件整体架构总览

不同于复杂的工具类插件，本项目的核心在于 **“在网页内部增强体验”**，因此架构非常扁平，以 Content Script 为主战场。

### 组件视角

| 组件               | 职责                                                         | 对应文件                       |
| :----------------- | :----------------------------------------------------------- | :----------------------------- |
| **Content Script** | **核心大脑**。注入到 AI 页面中，负责解析 DOM、渲染侧边栏、监听滚动。 | `src/content/main.js`          |
| **Adapters**       | **翻译官**。针对不同网站（Gemini/ChatGPT）提取数据，抹平 DOM 差异。 | `src/content/adapters/*`       |
| **Components**     | **UI 界面**。纯 JS 手写的导航面板、提示框等 UI 组件。        | `src/content/components/*`     |
| **Background**     | **管家**。极简逻辑，仅处理打开设置页等系统级指令。           | `src/background/background.js` |
| **Options**        | **配置中心**。用户设置主题、字体大小、语言偏好。             | `src/options/*`                |


---

## 4. 核心设计点（干货）

### 4.1 适配器模式 (Adapter Pattern) —— 搞定多平台

这是本项目最核心的设计。为了让插件能同时支持 Gemini、ChatGPT 和 Claude，我没有在主逻辑里写一堆 `if (isGemini) { ... } else if (isChatGPT) { ... }`，而是定义了一个基类 `PlatformAdapter`。

**src/content/adapters/base.js**:

```javascript
window.GeminiNav.PlatformAdapter = class PlatformAdapter {
    matches() { return false; } // 是否匹配当前 URL
    getQuestions() { return []; } // 获取所有提问节点
    getQuestionText(element) { return ''; } // 获取提问文本
};
```

**src/content/adapters/gemini.js**:

```javascript
window.GeminiNav.GeminiAdapter = class GeminiAdapter extends window.GeminiNav.PlatformAdapter {
    matches() {
        return window.location.hostname === 'gemini.google.com';
    }
    getQuestions() {
        // 针对 Gemini 的特定选择器
        return document.querySelectorAll('.user-query-bubble-with-background');
    }
};
```

在 `main.js` 中，我只需要一行代码就能找到当前网站对应的适配器：

```javascript
const adapters = [new GeminiAdapter(), new ChatGPTAdapter(), new ClaudeAdapter()];
const adapter = adapters.find(a => a.matches());
```

**好处**：如果明天想支持 DeepSeek 或 Kimi，只需要新建一个 `deepseek.js` 继承基类即可，主逻辑一行都不用改。

### 4.2 动态 DOM 监听 (MutationObserver)

AI 的回答是流式的（Streaming），而且是单页应用（SPA）。普通的 `window.onload` 根本不够用。
我使用了 `MutationObserver` 来监听 `document.body` 的变化。

**关键策略**：

1.  **全量监听**：监听 `childList` 和 `subtree`，确保不漏掉任何新加载的消息。
2.  **Diff 更新**：在回调中比对 `currentCount` 和 `lastQuestionCount`，只有当提问数量发生变化时才触发 `panel.rebuild()`，避免频繁重绘导致的性能问题。

### 4.3 纯原生 UI 组件化

为了让插件体积保持在 200KB 以内（方便快速安装和审核），我放弃了 React/Vue，采用原生 JS Class 来封装 UI 组件。

**src/content/components/panel.js**:

```javascript
window.GeminiNav.Panel = class Panel {
    constructor(adapter) {
        this.navPanel = document.createElement('div');
        // ... 状态管理
    }
    
    create() {
        // ... 手动构建 DOM 结构
        this.navPanel.appendChild(header);
        this.navPanel.appendChild(list);
        document.body.appendChild(this.navPanel);
    }
}
```

虽然写 DOM 操作稍微繁琐一点，但换来的是**零依赖**和**极致的启动速度**。

---

## 5. 关键实现拆解

### 项目目录结构

让人一眼能看懂的结构，才是好结构：

```text
src/
├── assets/          # 图标资源
├── background/      # 后台脚本
│   └── background.js
├── content/         # 核心逻辑
│   ├── adapters/    # 适配器 (Gemini/ChatGPT/Claude)
│   ├── components/  # UI 组件 (Panel/Tooltip)
│   ├── utils/       # 工具类 (Draggable/i18n)
│   └── main.js      # 入口文件
├── options/         # 设置页
└── styles/          # 样式文件
manifest.json        # 配置文件
```

### 滚动高亮实现

如何知道当前用户看到了第几个问题？
利用 `IntersectionObserver` 监听所有提问元素的可视状态。当某个提问进入视口时，自动高亮侧边栏对应的 Item。

```javascript
// 伪代码示例
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            this.highlightItem(entry.target.dataset.index);
        }
    });
});
```

---

## 6. 工程化与发布

### Manifest V3 的注意事项

*   **Permissions**: 遵循最小权限原则，只申请了 `activeTab` 和 `storage`。`scripting` 权限虽然强大但审核较慢，能不用则不用。
*   **Host Permissions**: 明确列出 `*://gemini.google.com/*` 等域名，不要使用 `<all_urls>`，否则审核会被拒或因为安全警告劝退用户。

### 多语言支持 (i18n)

项目使用了 Chrome 原生的 `_locales` 目录结构，支持 `en` 和 `zh_CN`。
在代码中封装了一个简单的 `i18n` 工具类，优先读取 `chrome.i18n.getMessage`，本地调试时降级到简单的对象映射。

### 发布流程

1.  **打包**：将项目文件夹打包成 `.zip`（注意剔除 `.git` 和 `.vscode` 目录）。
2.  **上架**：
    *   **Chrome Web Store**: 注册开发者账号 ($5)，上传 zip，填写隐私说明（核心：我们不收集用户数据）。
    *   **Edge Add-ons**: 流程类似，通常审核比 Chrome 快。

---

## 7. 常见坑与解决方案

### 坑 1：SPA 页面 URL 变了但 Content Script 不重载

**现象**：用户在 ChatGPT 从“对话 A”切换到“对话 B”，页面没刷新，导航栏还是显示的“对话 A”的内容。
**解决**：在 `MutationObserver` 回调里手动检查 `location.href`。

```javascript
let lastUrl = location.href;
const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        panel.reset(); // 重置面板状态
    }
    // ...
});
```

### 坑 2：CSS 类名经常变

**现象**：ChatGPT 今天用 `.user-message`，明天可能就变成了 `.xb2-message`。
**解决**：在 Adapter 中使用数组存储多套选择器，轮询匹配。

```javascript
const selectors = [
    '[data-message-author-role="user"]', // 属性选择器最稳定
    '.user-query-bubble',
    '.text-base'
];
// 遍历 selectors 直到找到元素
```

---

## 8. 总结与下一步

通过这个项目，不仅解决了我自己“翻聊天记录难”的痛点，也完整实践了一遍 Manifest V3 的插件开发流程。
**架构虽小，五脏俱全**。Adapter 模式和无依赖 UI 组件的设计，让这个插件具有了极强的生命力。

**下一步计划**：

*   [ ] **支持更多模型**：DeepSeek, Perplexity 等。
*   [ ] **导出功能**：将长对话导出为 Markdown 或 PDF。
*   [ ] **语义搜索**：不仅仅是关键词过滤，支持对历史提问进行语义检索。

---

**如果你觉得这个项目有意思，欢迎去 GitHub 点个 Star ⭐️，或者在 Chrome 商店搜索 "AI Navigator" 体验一下！**