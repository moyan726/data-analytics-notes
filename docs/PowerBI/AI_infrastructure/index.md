# Power BI 商业智能

Power BI 是微软的商业智能和数据可视化平台，用于分析数据并分享见解。

## 什么是 Power BI？

Power BI 是一套商业分析工具，可以连接数百个数据源，简化数据准备，并推动即兴分析。

### 核心组件

- **Power BI Desktop**：用于创建报告的桌面应用程序
- **Power BI Service**：基于云的服务，用于发布和共享报告
- **Power BI Mobile**：移动应用，随时随地查看报告

## 为什么使用 Power BI？

- ✅ **易于使用**：直观的拖放界面
- ✅ **强大的数据建模**：支持复杂的数据关系
- ✅ **丰富的可视化**：多种内置和自定义视觉效果
- ✅ **实时仪表板**：实时数据监控
- ✅ **与 Microsoft 集成**：与 Excel、Teams、SharePoint 等无缝集成

## 学习路径

1. **[入门指南](getting-started.md)** - Power BI 基础和界面介绍
2. **[DAX 公式](dax.md)** - 数据分析表达式学习
3. **[可视化技巧](visualization.md)** - 创建有效的数据可视化

## 快速开始

### 连接数据源

Power BI 支持多种数据源：

- Excel 文件
- SQL Server 和其他数据库
- Web 数据
- SharePoint 列表
- Azure 服务
- 其他云服务（Google Analytics、Salesforce 等）

### 基本工作流程

```
1. 获取数据 (Get Data)
   ↓
2. 转换数据 (Power Query)
   ↓
3. 建立数据模型 (Data Model)
   ↓
4. 创建可视化 (Visualizations)
   ↓
5. 发布报告 (Publish)
   ↓
6. 共享和协作 (Share)
```

## 关键功能

### Power Query
数据转换和清洗工具

```
- 合并和追加查询
- 删除重复项
- 替换值
- 分组和透视
- 自定义列
```

### 数据建模
创建表之间的关系

- 一对多关系
- 多对多关系
- 星型架构
- 雪花架构

### DAX (Data Analysis Expressions)
用于创建计算列和度量值

```dax
Total Sales = SUM('Sales'[Amount])

Sales YTD = TOTALYTD([Total Sales], 'Calendar'[Date])

Sales Growth = 
DIVIDE(
    [Total Sales] - [Total Sales Previous Year],
    [Total Sales Previous Year]
)
```

## Power BI 版本

| 版本 | 特点 | 价格 |
|------|------|------|
| Power BI Desktop | 免费桌面应用 | 免费 |
| Power BI Pro | 共享和协作 | $9.99/用户/月 |
| Power BI Premium | 企业级功能 | $4,995/容量/月 |

!!! note "开始学习"
    点击左侧导航开始学习 Power BI！

## 学习资源

- [Power BI 官方文档](https://docs.microsoft.com/en-us/power-bi/)
- [Power BI 社区](https://community.powerbi.com/)
- [SQLBI](https://www.sqlbi.com/) - DAX 学习资源
- [Guy in a Cube](https://www.youtube.com/channel/UCFp1vaKzpfvoGai0vE5VJ0w) - YouTube 频道
