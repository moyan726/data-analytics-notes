## 目标
- 把“隐藏未引用/误伤其他页面/JS 失效导致样式崩坏”的可能性压到最低，同时不引入视觉变化。

## 已完成的进一步审查结论（只读分析）
- 自定义类名（如 `hero-section / side-announcement / profile-* / stats-grid / timeline` 等）在仓库中仅出现在 [docs/index.md] 与 [docs/javascripts/site.js]，符合“只服务首页组件”的预期。
- `overrides/partials/announce.html` 为空，顶部公告栏功能被禁用；因此 `.md-banner*` 样式大概率在当前配置下不会被用到（但属于主题内部类，未来若启用公告栏可能会用到）。
- 当前 TOC 折叠 CSS 使用 `.md-sidebar--secondary .md-nav--secondary .md-nav { display: none; ... }`，虽然大概率只影响“嵌套 TOC”，但选择器覆盖面偏大；若主题 DOM 结构变化或 JS 未执行，存在“误隐藏更多 nav”的理论风险。

## 计划改动（会改代码）
### 1) 做一份“选择器引用矩阵”并据此做最后一轮删减
- 从 `custom.css` 中提取所有非主题类（例如 `.hero-section/.profile-*`）和关键规则块。
- 对每个选择器在以下范围做全仓匹配：
  - `docs/**/*.md`（含 HTML in Markdown）
  - `overrides/**/*.html`
  - `docs/javascripts/site.js`
- 输出三类结论并据此处理：
  - **明确被引用**：保留
  - **主题/插件内部类（md-* 等）**：保守保留（避免误删）
  - **全仓无引用且非主题内部类**：删除

### 2) 将 TOC 折叠样式改为“更窄选择器 + fail-open”
- 把“隐藏所有 `.md-nav` 子级”改为“只隐藏 `md-nav__item--nested > .md-nav`”，减少误伤面。
- 把展开规则同步收窄为 `md-nav__item--nested.toc-expanded > .md-nav`。
- 目的：即使 JS/DOM 结构变化，也尽量保证 TOC 不会整块消失（失败时更倾向显示全部，而不是全隐藏）。

### 3) 可选项：处理 `.md-banner*`（顶部公告栏）样式
- 默认：保留（因为这是主题内部类，未来可能启用公告栏）。
- 若你明确“以后永远不启用顶部公告栏”，我会把 `.md-banner*` 相关块删除，进一步瘦身。

### 4) 回归验证（会运行本地预览与构建）
- `python -m mkdocs build` 确认构建无误。
- `python -m mkdocs serve` 打开首页：检查 hero/公告侧栏/卡片/统计/时间线/关于我翻转卡片/TOC 折叠。
- 深浅色切换 + 关键断点（600px、1400px）检查。

## 交付物
- 一版进一步降低风险后的 [custom.css]：选择器更精准、死代码更少、TOC 更稳健，且首页展示保持一致。