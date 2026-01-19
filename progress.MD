# 项目变更记录

## 2026-01-18 修复 GitHub Pages 部署失败

- **时间**：2026-01-18 22:05 (UTC+8)
- **变更摘要**：修复 MkDocs 构建时的图片路径大小写问题。
- **问题说明**：GitHub Actions (Linux) 构建失败，提示找不到 `SQL/MySQL_Base_ITcase/image/MySQL.png`。原因是实际文件名为 `mysql.png`，而 Markdown 引用使用了 `MySQL.png`。Windows 环境不区分大小写因此本地未报错。
- **策略方向**：修正 Markdown 中的引用路径以匹配实际文件名。
- **具体改动**：
    - `docs/SQL/MySQL_Base_ITcase/index.md`: 将 `![MySQL](./image/MySQL.png)` 修改为 `![MySQL](./image/mysql.png)`。
- **影响面**：仅影响该文档的图片显示和构建过程。
- **风险与回滚**：无风险。回滚只需改回原文件名。
- **验证**：本地 `mkdocs build --strict` 或重新提交 GitHub 触发构建。

## 2026-01-19 修复 Mermaid 流程图显示问题

- **时间**：2026-01-19 11:10 (UTC+8)
- **变更摘要**：修复 `AI_nav_extension.md` 中 Mermaid 流程图无法渲染的问题。
- **问题说明**：Mermaid 节点标签中包含特殊字符（如圆括号）且未加引号，导致解析失败或显示异常。
- **策略方向**：为 Mermaid 流程图的所有节点标签添加双引号，确保特殊字符被正确识别为字符串。
- **具体改动**：
    - `docs/Projects/myself_tools/AI_nav_extension.md`: 修改 Mermaid `graph TD` 代码块，为所有节点文本添加引号。
- **影响面**：仅影响该文档的流程图显示。
- **风险与回滚**：无风险。
- **验证**：本地预览确认流程图正常渲染。
