I have analyzed the new directory structure in your `docs` folder and mapped it to the `mkdocs.yml` configuration.

Here is the plan to update the `nav` section in `mkdocs.yml` to match your new file organization:

1.  **Python Section**:
    *   Update paths for `Basic`, `Data Analysis`, and `Libraries` to point to the new `infrastructure_by_AI` folder.
    *   Group these under a new subsection `infrastructure_by_AI` (or keep them flat if you prefer, but grouping reflects the folder structure). I will group them for better organization.

2.  **SQL Section**:
    *   Update paths for `Basic`, `Advanced`, and `Best Practices` to point to the new `AI_infrastructure` folder.
    *   Group these under `AI_infrastructure`.

3.  **Power BI Section**:
    *   Update paths for `Getting Started` and `DAX` to `AI_infrastructure`.
    *   Note that `PowerBI/index.md` seems to have moved to `PowerBI/AI_infrastructure/index.md`. I will link the "Overview" or "Index" to this new location inside the `AI_infrastructure` group.
    *   Keep `Visualization` at the root of Power BI as it remains in `PowerBI/visualization.md`.

4.  **Projects Section**:
    *   Create subsections for:
        *   `AI_infrastructure` (Project 1, Project 2)
        *   `myself_tools` (Git Script, ppt_to_pdf)
        *   `AI_use` (TestClaude, Thoughts On AI, share_online/five.md)
    *   Keep `MCM` and `index.md` as they are.

**Proposed Change:**

```yaml
nav:
  - Home: index.md
  - Python:
    - Python/index.md
    - 一、动手学数据分析:
         - 概览: Python/hands-on-data-analysis/index.md
         - 1.第一章合集整理: Python/hands-on-data-analysis/snippets/第一章合集整理.md
    - infrastructure_by_AI:
         - Basic: Python/infrastructure_by_AI/basic.md
         - Data Analysis: Python/infrastructure_by_AI/data-analysis.md
         - Libraries: Python/infrastructure_by_AI/libraries.md
    - 机器学习: Python/Machine-Learning/index.md
    - 数据可视化基础: Python/Data_Visualization/index.md
  - SQL:
      - SQL/index.md
      - AI_infrastructure:
          - Basic: SQL/AI_infrastructure/basic.md
          - Advanced: SQL/AI_infrastructure/advanced.md
          - Best Practices: SQL/AI_infrastructure/best-practices.md
  - Power BI:
      - Visualization: PowerBI/visualization.md
      - AI_infrastructure:
          - Overview: PowerBI/AI_infrastructure/index.md
          - Getting Started: PowerBI/AI_infrastructure/getting-started.md
          - DAX: PowerBI/AI_infrastructure/dax.md
  - Projects:
      - Projects/index.md
      - AI_infrastructure:
          - Project 1: Projects/AI_infrastructure/project1.md
          - Project 2: Projects/AI_infrastructure/project2.md
      - myself_tools:
          - Project 3--Git批量提交脚本: Projects/myself_tools/Git批量提交脚本.md
          - Project 4--ppt_to_pdf: Projects/myself_tools/ppt_to_pdf.md
      - AI_use:
          - 功能测试页: Projects/AI_use/TestClaude.md
          - Thoughts On AI: Projects/AI_use/Thoughts_On_AI.md
          - share_online: Projects/AI_use/five.md
      - MCM美赛资料: 
           - 概述: Projects/MCM/index.md
           - 1.MCM Prep Guide: Projects/MCM/1.MCM_Prep_Guide.md
```

I will apply this change to `mkdocs.yml` upon your confirmation.