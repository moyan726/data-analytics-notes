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
