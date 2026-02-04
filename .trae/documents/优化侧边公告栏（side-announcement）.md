## 目标（按你的要求）
- 桌面宽屏：公告栏默认在**右侧隐藏**，用户点击“把手”后**弹出/收起**。
- 改动最小化、向后兼容：不依赖 JS 也能工作（纯 HTML+CSS 切换），不影响现有 `site.js` 逻辑。

## 已读取的现状（关键点）
- 首页公告栏结构在 [index.md]：`<aside class="side-announcement">...`。
- 样式在 [custom.css]：`.side-announcement { position: fixed; left: 15px; ... }` + `@media (max-width: 1400px){ display:none }`。
- [site.js] 当前与公告栏无直接逻辑耦合，可保持不改。

## 实现方案（最小可控、无新依赖）
### 1) HTML：给公告栏加一个“开关”但不引入新页面逻辑
- 在 `docs/index.md` 将公告栏包一层容器：
  - 新增一个 `input[type=checkbox]` 作为可键盘操作的开关（Space 可切换）。
  - 保留原 `<aside class="side-announcement">` 内容不变。
  - 容器用 flex 把“开关把手”固定在右侧边缘。

### 2) CSS：把公告栏从“左侧固定显示”改为“右侧滑入/滑出”
- 新增 `.side-announcement-container`：`position: fixed; right: 15px; top: 50%; transform: translateY(-50%); display:flex; flex-direction: row-reverse;`。
- 将 `.side-announcement` 改为容器内的 panel（不再 `position: fixed/left/top`），保留现有渐变、圆角、阴影、内容排版。
- 默认隐藏：当 checkbox 未选中时，panel `transform: translateX(110%); opacity:0; pointer-events:none;`。
- 点击把手后弹出：checkbox 选中时，panel `transform: translateX(0); opacity:1; pointer-events:auto;`。
- 去掉/替换原来的 `@media (max-width: 1400px) { .side-announcement { display:none } }`：因为现在小屏也应保留把手（至少能打开）。
- 增加 `prefers-reduced-motion`：在减少动画偏好下关闭滑入与 pulse。

### 3) JS（可选，默认不动）
- 为保证“改动最小化、向后兼容”，不强制改 `site.js`。
- 若你希望记住开关状态（刷新保持展开/收起），再追加一小段 `localStorage` 逻辑（可选增强，不影响纯 CSS 模式）。

## 验证
- 本地 `python -m mkdocs build --strict`。
- 本地预览首页：确认右侧把手可点击弹出、再点击收起；深色/浅色切换正常；键盘 Tab 可聚焦到把手并 Space 切换。

## 涉及文件
- [docs/index.md]
- [docs/stylesheets/custom.css]
- （可选）[docs/javascripts/site.js] 仅用于“记住状态”，默认不改
