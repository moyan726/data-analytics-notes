# 🚀 AI Navigator v1.3.0 - 项目完整文档

## 📋 项目概述

AI Navigator 是一款**通用的 AI 对话导航助手**，支持 Gemini、ChatGPT 和 Claude 三大主流 AI 平台。它提供类似 IDE 的高效导航体验，让用户能够快速定位和跳转到历史对话中的任意位置。

---


## ✅ 已实现功能清单

### 🌐 多平台支持
| 平台 | 域名 | 状态 |
|-----|------|------|
| Google Gemini | `gemini.google.com` | ✅ |
| ChatGPT | `chatgpt.com`, `chat.openai.com` | ✅ |
| Claude | `claude.ai` | ✅ |

**实现方式**：采用**适配器模式** (Adapter Pattern)，每个平台有独立的适配器类：
- `src/content/adapters/base.js` - 抽象基类 `PlatformAdapter`
- `src/content/adapters/gemini.js` - Gemini 适配器
- `src/content/adapters/chatgpt.js` - ChatGPT 适配器
- `src/content/adapters/claude.js` - Claude 适配器

每个适配器实现三个核心方法：
```javascript
matches()        // 判断当前页面是否匹配该平台
getQuestions()   // 获取所有用户提问元素
getQuestionText() // 提取提问文本内容
```

**健壮性优化**：每个适配器配置了**多个后备选择器**，当平台 DOM 结构变化时仍能正常工作。

---

### 🎨 界面交互功能

#### 1. 悬浮导航面板
- **位置**：默认固定在页面右侧中央
- **结构**：
  - 标题栏（显示平台名称，可拖拽）
  - 搜索框（独立一行）
  - 对话列表（可滚动）
  - 底部栏（恢复隐藏项按钮）

#### 2. 自由拖拽 (Draggable)
- **实现文件**：`src/content/utils/draggable.js`
- **操作方式**：按住标题栏拖动
- **位置记忆**：使用 `chrome.storage.local` 保存，刷新后自动恢复

#### 3. 尺寸调整 (Resizable)
- **实现文件**：`src/content/utils/resizable.js`
- **拖拽手柄**：右侧、底部、右下角
- **尺寸限制**：最小宽度 150px，最小高度 200px
- **尺寸记忆**：保存到 `chrome.storage.local`

#### 4. 问题编号样式
- **支持样式**：`1.` / `(1)` / `#1`
- **设置位置**：Options 页面
- **实时生效**：更改后无需刷新页面

#### 5. 悬浮提示 (Tooltip)
- **实现文件**：`src/content/components/tooltip.js`
- **触发方式**：鼠标悬停在被截断的问题上
- **显示内容**：完整的问题文本

#### 6. 字体大小调节
- **可选尺寸**：12px / 14px / 16px / 18px
- **操作方式**：点击标题栏的 `A` 按钮循环切换
- **持久化**：保存到 `chrome.storage.local`

#### 7. 隐藏与恢复
- **隐藏**：点击问题右侧的 `−` 按钮
- **恢复**：面板底部出现"↩ 恢复隐藏项"按钮

---

### 🎭 主题系统

#### 支持的主题
| 主题 | 说明 |
|-----|------|
| Auto | 跟随系统设置 |
| Light | 强制浅色模式 |
| Dark | 强制深色模式 |

#### 实现方式
1. **CSS 变量**：所有颜色使用 CSS 变量定义
2. **主题类名**：通过 `theme-light` / `theme-dark` 类覆盖变量
3. **实时切换**：监听 `chrome.storage.onChanged`，无需刷新

```css
#gemini-nav-panel.theme-dark {
  --gn-bg: #2d2d2d;
  --gn-text: #e8eaed;
  /* ... */
}
```

---

### 🔍 搜索/过滤功能

- **位置**：面板标题栏下方独立一行
- **实现**：监听 `input` 事件，实时过滤符合条件的对话
- **逻辑**：问题文本包含搜索关键词（不区分大小写）

---

### ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|-------|------|
| `Ctrl + Shift + G` | 显示/隐藏面板 |
| `Alt + ↑` | 跳转到上一个问题 |
| `Alt + ↓` | 跳转到下一个问题 |
| `Esc` | 最小化面板 |

**实现位置**：`src/content/main.js` 中的 `keydown` 事件监听器

---

### ⚙️ 设置页面 (Options Page)

#### 访问方式
1. 右键扩展图标 → 选项
2. 点击面板上的 ⚙ 齿轮按钮

#### 可配置项
- **语言**：中文 / English（手动切换）
- **主题**：自动 / 浅色 / 深色
- **编号样式**：`1.` / `(1)` / `#1`

#### 特色功能
- **实时预览**：右侧显示预览面板，更改设置即刻可见效果
- **重置按钮**：一键恢复默认设置

---

### 🌍 国际化 (i18n)

#### 支持语言
- 中文 (zh_CN)
- English (en)

#### 实现方式
- **自定义 i18n 工具**：`src/content/utils/i18n.js`
- **文本映射**：内置中英文对照表
- **手动切换**：Options 页面选择语言
- **实时更新**：切换后面板文本立即变化

---

### 🔄 SPA 导航支持

**问题**：Gemini/ChatGPT/Claude 都是单页应用，切换对话时 URL 变化但页面不刷新。

**解决方案**：
```javascript
let lastUrl = location.href;

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // 重置面板状态
    panel.hiddenIndices.clear();
    panel.currentActiveIndex = -1;
    panel.lastQuestionCount = 0;
  }
});
```

---

### 🎬 首次使用引导

- **触发条件**：`firstUse` 标志为 `true` 或未设置
- **效果**：面板蓝色发光脉冲动画，持续 3 秒
- **CSS 动画**：
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px 4px var(--gn-accent); }
  50% { box-shadow: 0 0 30px 8px var(--gn-accent); }
}
```

---

## 📁 项目结构

```
gemini-nav-extension/
├── manifest.json              # 扩展清单 v1.3.0
├── _locales/
│   ├── zh_CN/messages.json    # 中文翻译
│   └── en/messages.json       # 英文翻译
└── src/
    ├── assets/
    │   ├── icon48.svg         # 小图标
    │   └── icon128.svg        # 大图标
    ├── background/
    │   └── background.js      # 服务工作者 (处理 openOptions)
    ├── content/
    │   ├── adapters/
    │   │   ├── base.js        # 适配器基类
    │   │   ├── gemini.js      # Gemini 适配器
    │   │   ├── chatgpt.js     # ChatGPT 适配器
    │   │   └── claude.js      # Claude 适配器
    │   ├── components/
    │   │   ├── panel.js       # 主面板组件
    │   │   └── tooltip.js     # 悬浮提示组件
    │   ├── utils/
    │   │   ├── draggable.js   # 拖拽功能
    │   │   ├── resizable.js   # 缩放功能
    │   │   └── i18n.js        # 国际化工具
    │   └── main.js            # 入口文件
    ├── options/
    │   ├── options.html       # 设置页面
    │   ├── options.css        # 设置页面样式
    │   └── options.js         # 设置页面逻辑
    └── styles/
        └── main.css           # 主样式文件
```

---

## 🔧 技术要点

### 1. MutationObserver 替代轮询
```javascript
const observer = new MutationObserver(() => {
  const currentCount = adapter.getQuestions().length;
  if (currentCount !== panel.lastQuestionCount) {
    panel.rebuild();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
```

### 2. chrome.storage 持久化
```javascript
// 保存
chrome.storage.local.set({ panelPosition: pos });

// 读取
chrome.storage.local.get(['panelPosition'], (result) => { ... });

// 监听变化
chrome.storage.onChanged.addListener((changes, area) => { ... });
```

### 3. 平台适配器模式
```javascript
class PlatformAdapter {
  matches() { throw new Error('Not implemented'); }
  getQuestions() { throw new Error('Not implemented'); }
  getQuestionText(element) { throw new Error('Not implemented'); }
}
```

---

## 🚀 未来规划

- [ ] 更多平台支持 (Perplexity, Poe, Kimi 等)
- [ ] 边缘吸附功能
- [ ] 导出对话历史
- [ ] 自定义快捷键
- [ ] Chrome Web Store 发布
