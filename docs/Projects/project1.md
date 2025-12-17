# 项目 1：销售数据分析仪表板

使用 Python 和 Power BI 创建一个综合的销售分析仪表板。

**难度：** 🌟🌟 中级  
**预计时间：** 2-3 周  
**技能要求：** Python 基础、Pandas、Power BI 基础

## 项目概述

本项目将分析一个虚拟零售公司的销售数据，创建交互式仪表板来展示关键业务指标、趋势和洞察。

### 学习目标

- 使用 Python 进行数据清洗和探索性分析
- 创建计算列和度量值
- 设计专业的 Power BI 仪表板
- 讲述数据故事

## 数据集

### 数据源

使用 [Superstore Sales Dataset](https://www.kaggle.com/datasets/vivek468/superstore-dataset-final) 或类似的零售数据集。

### 数据结构

| 字段 | 描述 | 类型 |
|------|------|------|
| Order ID | 订单 ID | 文本 |
| Order Date | 订单日期 | 日期 |
| Ship Date | 发货日期 | 日期 |
| Customer ID | 客户 ID | 文本 |
| Customer Name | 客户姓名 | 文本 |
| Segment | 客户细分 | 分类 |
| Country | 国家 | 文本 |
| City | 城市 | 文本 |
| State | 州/省 | 文本 |
| Region | 地区 | 分类 |
| Product ID | 产品 ID | 文本 |
| Category | 产品类别 | 分类 |
| Sub-Category | 子类别 | 分类 |
| Product Name | 产品名称 | 文本 |
| Sales | 销售额 | 数值 |
| Quantity | 数量 | 整数 |
| Discount | 折扣 | 百分比 |
| Profit | 利润 | 数值 |

## 第一阶段：数据清洗和探索（Python）

### 1. 导入和检查数据

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# 读取数据
df = pd.read_csv('sales_data.csv', encoding='utf-8')

# 查看数据基本信息
print(df.head())
print(df.info())
print(df.describe())

# 检查缺失值
print(df.isnull().sum())
```

### 2. 数据清洗

```python
# 删除重复行
df = df.drop_duplicates()

# 处理日期列
df['Order Date'] = pd.to_datetime(df['Order Date'])
df['Ship Date'] = pd.to_datetime(df['Ship Date'])

# 提取日期特征
df['Year'] = df['Order Date'].dt.year
df['Month'] = df['Order Date'].dt.month
df['Quarter'] = df['Order Date'].dt.quarter
df['Month Name'] = df['Order Date'].dt.strftime('%B')
df['Day of Week'] = df['Order Date'].dt.day_name()

# 计算交付时间
df['Delivery Days'] = (df['Ship Date'] - df['Order Date']).dt.days

# 处理异常值
# 移除折扣异常值
df = df[df['Discount'] <= 1]

# 移除销售额和利润异常值（如果有）
df = df[df['Sales'] > 0]
```

### 3. 探索性数据分析

```python
# 销售趋势分析
monthly_sales = df.groupby(['Year', 'Month'])['Sales'].sum().reset_index()

plt.figure(figsize=(12, 6))
plt.plot(range(len(monthly_sales)), monthly_sales['Sales'])
plt.title('Monthly Sales Trend')
plt.xlabel('Month')
plt.ylabel('Sales')
plt.show()

# 按类别分析
category_sales = df.groupby('Category').agg({
    'Sales': 'sum',
    'Profit': 'sum',
    'Quantity': 'sum'
}).sort_values('Sales', ascending=False)

print(category_sales)

# 按地区分析
region_performance = df.groupby('Region').agg({
    'Sales': 'sum',
    'Profit': 'sum',
    'Order ID': 'nunique'
}).rename(columns={'Order ID': 'Orders'})

print(region_performance)

# 折扣与利润率的关系
df['Profit Margin'] = df['Profit'] / df['Sales']

plt.figure(figsize=(10, 6))
plt.scatter(df['Discount'], df['Profit Margin'], alpha=0.3)
plt.xlabel('Discount')
plt.ylabel('Profit Margin')
plt.title('Discount vs Profit Margin')
plt.show()
```

### 4. 保存清洗后的数据

```python
# 保存为 CSV
df.to_csv('sales_data_cleaned.csv', index=False)

# 或保存为 Excel
df.to_excel('sales_data_cleaned.xlsx', index=False)
```

## 第二阶段：Power BI 仪表板

### 1. 数据导入

1. 打开 Power BI Desktop
2. 获取数据 → CSV → 选择清洗后的文件
3. 加载数据

### 2. 数据建模

#### 创建日期表

```dax
Calendar = 
ADDCOLUMNS(
    CALENDAR(MIN(Sales[Order Date]), MAX(Sales[Order Date])),
    "Year", YEAR([Date]),
    "Month", MONTH([Date]),
    "Month Name", FORMAT([Date], "MMMM"),
    "Quarter", "Q" & QUARTER([Date]),
    "Year-Month", FORMAT([Date], "YYYY-MM")
)
```

#### 创建关系

- Sales[Order Date] → Calendar[Date]

### 3. 创建度量值

```dax
// 基础度量值
Total Sales = SUM(Sales[Sales])

Total Profit = SUM(Sales[Profit])

Total Quantity = SUM(Sales[Quantity])

Number of Orders = DISTINCTCOUNT(Sales[Order ID])

Number of Customers = DISTINCTCOUNT(Sales[Customer ID])

// 利润率
Profit Margin = DIVIDE([Total Profit], [Total Sales])

// 平均订单价值
Average Order Value = DIVIDE([Total Sales], [Number of Orders])

// 同比增长
Sales PY = 
CALCULATE(
    [Total Sales],
    SAMEPERIODLASTYEAR(Calendar[Date])
)

Sales YoY Growth = 
DIVIDE(
    [Total Sales] - [Sales PY],
    [Sales PY]
)

// Top 产品
Top 10 Products = 
IF(
    RANKX(
        ALL(Sales[Product Name]),
        [Total Sales],
        ,
        DESC
    ) <= 10,
    [Total Sales],
    BLANK()
)
```

### 4. 创建仪表板页面

#### 页面 1：概览仪表板

**布局：**

```
┌─────────────────────────────────────────────────────────┐
│  [Title: Sales Performance Dashboard]                    │
├─────────────┬─────────────┬─────────────┬──────────────┤
│ Total Sales │ Total Profit│ Profit %    │ Orders       │
│ (Card)      │ (Card)      │ (Card)      │ (Card)       │
├─────────────────────────────┬───────────────────────────┤
│ Sales Trend                 │ Sales by Category         │
│ (Line Chart)                │ (Donut Chart)             │
├─────────────────────────────┼───────────────────────────┤
│ Sales by Region (Map)       │ Top 10 Products           │
│                              │ (Bar Chart)               │
├─────────────────────────────┴───────────────────────────┤
│ Filters: Date, Category, Region                         │
└─────────────────────────────────────────────────────────┘
```

**可视化元素：**

1. **KPI 卡片** (4 个)
   - 总销售额
   - 总利润
   - 利润率
   - 订单数

2. **折线图**：销售趋势
   - X 轴：日期（月份）
   - Y 轴：销售额
   - 添加趋势线

3. **环形图**：按类别销售
   - 值：销售额
   - 图例：类别

4. **地图**：按地区销售
   - 位置：州/省
   - 大小：销售额

5. **条形图**：Top 10 产品
   - X 轴：销售额
   - Y 轴：产品名称

#### 页面 2：客户分析

```
- 客户细分分析
- 客户购买行为
- 客户生命周期价值
- 重复购买率
```

#### 页面 3：产品分析

```
- 产品性能对比
- 子类别分析
- 折扣影响分析
- 库存周转分析
```

### 5. 格式化和美化

```
主题：
- 背景：浅灰色或白色
- 主色：蓝色系
- 强调色：橙色或绿色

字体：
- 标题：Segoe UI Bold, 18-24pt
- 正文：Segoe UI, 10-12pt

间距：
- 视觉对象之间保持一致间距
- 使用对齐和分布工具
```

## 关键洞察示例

### 发现 1：销售季节性

```
- Q4 销售额最高（节假日影响）
- 每年 11-12 月是销售高峰
```

### 发现 2：产品表现

```
- Technology 类别利润率最高
- Office Supplies 销量最大但利润率较低
```

### 发现 3：地区差异

```
- West 地区销售额最高
- South 地区需要改进
```

### 发现 4：折扣策略

```
- 高折扣不一定带来高利润
- 建议优化折扣策略
```

## 可交付成果

1. **Jupyter Notebook**：数据清洗和探索分析
2. **Power BI 文件**：交互式仪表板 (.pbix)
3. **报告文档**：分析报告和建议
4. **演示文稿**：关键发现和洞察

## 扩展挑战

### 进阶任务

1. **预测分析**
   - 使用 Python 进行销售预测
   - 在 Power BI 中显示预测结果

2. **客户细分**
   - RFM 分析
   - K-means 聚类

3. **自动化**
   - 设置自动数据刷新
   - 创建警报和通知

4. **高级可视化**
   - 使用自定义视觉对象
   - 创建动画和讲故事功能

## 总结

通过完成这个项目，你将掌握：

✅ 使用 Python 进行数据清洗和分析  
✅ 创建专业的 Power BI 仪表板  
✅ 使用 DAX 创建高级计算  
✅ 讲述数据故事和提供业务洞察  

## 下一步

完成后可以：

1. 发布到 GitHub 作为作品集
2. 分享到 LinkedIn
3. 尝试 [项目 2](project2.md)
