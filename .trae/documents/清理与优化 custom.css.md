## 现状结论
- `custom.css` 存在大段重复粘贴：同一批规则（暗色模式、side-announcement、Collapsible TOC、Profile/Flip Card 等）在文件中出现 2 次甚至 3 次，后出现的会覆盖先出现的，导致“改了不生效/逻辑不严谨”。
- 已确认首页 `docs/index.md` 确实引用了 `side-announcement / hero-section / card-grid / stats-grid / timeline / profile-*` 等类名，所以这些样式不能删除，只能去重与合并。

## 要删除/合并的重点（已定位）
- 删除重复块（保留一份生效的最终版本）：
  - `.stat-label` 与一组暗色模式覆盖（文件中出现两次）。
  - `side-announcement` 整套样式（含 `slideInLeft`/`pulse` keyframes）出现两次。
  - Collapsible TOC 样式（`.md-sidebar--secondary ...`) 出现两次。
  - Profile/Flip Card 相关样式出现多份：包含一个明显异常的 `.profile-avatar { width/height: 3000px; }` 版本，以及后续正常版本；保留当前实际生效的一套，并删除其余重复版本。
- 删除确认未被任何 Markdown/HTML 使用的选择器（通过全仓搜索验证）：
  - 例如 `.profile-header`、`.profile-info h3`（当前仅在 CSS 内出现）。

## 重构与规范化
- 将文件按“全局 → 组件（Hero/Card/Timeline/Stats/SideAnnouncement/Profile/TOC）→ 暗色模式覆盖 → 响应式”重排，避免同类规则分散。
- 合并完全相同的声明块；去掉无意义的空行与重复注释；统一缩进与属性排序（同类属性靠近，如布局/尺寸/盒模型/视觉/动画）。
- 在不改变视觉的前提下使用简写（如 `transition`、`border` 等已是简写则保持；不引入需要新浏览器特性的写法，避免兼容风险）。

## 验证方式（修改后必须做）
- 本地启动预览（MkDocs Material）：
  - 首页：确认 hero、卡片、统计卡片、时间线、关于我翻转卡片、头像大小、侧边公告正常。
  - 深浅色切换：确认暗色模式下背景遮罩、卡片、按钮、公告面板等正常。
  - 响应式：缩放到 <600px 与 <1400px，确认 profile 布局堆叠、side-announcement 隐藏、TOC 折叠逻辑正常。
- 快速跨浏览器抽查：Chrome + Edge（同内核）+ Firefox（至少首页）。

## 交付物
- 输出一份去重后的 `docs/stylesheets/custom.css`：逻辑单一来源、无重复块、无未使用选择器、格式统一；页面展示与清理前保持一致（以“当前实际生效的最后覆盖版本”为基准）。