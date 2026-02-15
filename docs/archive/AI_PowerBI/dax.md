# DAX 公式

DAX (Data Analysis Expressions) 是 Power BI 中用于创建自定义计算的公式语言。

## 什么是 DAX？

DAX 是一种函数语言，用于：

- 创建**计算列**（Calculated Columns）
- 创建**度量值**（Measures）
- 创建**计算表**（Calculated Tables）

## 计算列 vs 度量值

### 计算列

- 在数据刷新时计算
- 存储在数据模型中
- 占用内存
- 可以在行级别使用

```dax
// 计算列示例
Total Price = Sales[Quantity] * Sales[Unit Price]

Full Name = Customers[First Name] & " " & Customers[Last Name]
```

### 度量值

- 在查询时动态计算
- 不占用存储空间
- 性能更好
- 用于聚合计算

```dax
// 度量值示例
Total Sales = SUM(Sales[Amount])

Average Price = AVERAGE(Products[Price])
```

!!! tip "最佳实践"
    尽可能使用度量值而不是计算列，以获得更好的性能。

## 基础 DAX 函数

### 聚合函数

```dax
// SUM - 求和
Total Revenue = SUM(Sales[Revenue])

// AVERAGE - 平均值
Average Sale = AVERAGE(Sales[Amount])

// COUNT - 计数
Number of Products = COUNT(Products[Product ID])

// COUNTROWS - 计算行数
Total Transactions = COUNTROWS(Sales)

// MIN / MAX - 最小值/最大值
Lowest Price = MIN(Products[Price])
Highest Price = MAX(Products[Price])

// DISTINCTCOUNT - 去重计数
Unique Customers = DISTINCTCOUNT(Sales[Customer ID])
```

### 逻辑函数

```dax
// IF - 条件判断
Price Category = 
IF(
    Products[Price] > 100,
    "High",
    "Low"
)

// SWITCH - 多条件判断
Customer Tier = 
SWITCH(
    TRUE(),
    Customers[Total Purchases] > 10000, "VIP",
    Customers[Total Purchases] > 5000, "Gold",
    Customers[Total Purchases] > 1000, "Silver",
    "Regular"
)

// AND / OR - 逻辑运算
High Value Sale = 
IF(
    AND(Sales[Quantity] > 10, Sales[Amount] > 1000),
    "Yes",
    "No"
)
```

### 文本函数

```dax
// CONCATENATE / & - 连接文本
Full Address = 
Customers[Street] & ", " & 
Customers[City] & ", " & 
Customers[State]

// LEFT / RIGHT / MID - 提取文本
Year Code = LEFT(Products[Product ID], 4)

// UPPER / LOWER - 大小写转换
Upper Name = UPPER(Customers[Name])

// TRIM - 删除空格
Clean Name = TRIM(Customers[Name])
```

### 日期函数

```dax
// YEAR / MONTH / DAY - 提取日期部分
Sales Year = YEAR(Sales[Date])
Sales Month = MONTH(Sales[Date])

// TODAY / NOW - 当前日期时间
Current Date = TODAY()

// DATEDIFF - 日期差异
Days Since Purchase = 
DATEDIFF(
    Sales[Date],
    TODAY(),
    DAY
)
```

## 高级 DAX 函数

### 筛选函数

```dax
// CALCULATE - 最重要的 DAX 函数
Sales 2024 = 
CALCULATE(
    SUM(Sales[Amount]),
    YEAR(Sales[Date]) = 2024
)

// FILTER - 筛选表
High Value Products = 
CALCULATE(
    COUNTROWS(Products),
    FILTER(Products, Products[Price] > 100)
)

// ALL - 忽略筛选
Total Sales All Products = 
CALCULATE(
    SUM(Sales[Amount]),
    ALL(Products)
)

// ALLEXCEPT - 除了指定列外忽略所有筛选
Sales Share = 
DIVIDE(
    SUM(Sales[Amount]),
    CALCULATE(
        SUM(Sales[Amount]),
        ALLEXCEPT(Sales, Sales[Region])
    )
)
```

### 时间智能函数

```dax
// TOTALYTD - 年初至今
Sales YTD = 
TOTALYTD(
    SUM(Sales[Amount]),
    'Calendar'[Date]
)

// SAMEPERIODLASTYEAR - 去年同期
Sales Last Year = 
CALCULATE(
    SUM(Sales[Amount]),
    SAMEPERIODLASTYEAR('Calendar'[Date])
)

// DATEADD - 日期偏移
Sales Previous Month = 
CALCULATE(
    SUM(Sales[Amount]),
    DATEADD('Calendar'[Date], -1, MONTH)
)

// 同比增长
YoY Growth = 
VAR CurrentYear = SUM(Sales[Amount])
VAR LastYear = [Sales Last Year]
RETURN
    DIVIDE(CurrentYear - LastYear, LastYear)
```

### 关系函数

```dax
// RELATED - 获取相关表的列
Product Category = RELATED(Products[Category])

// RELATEDTABLE - 获取相关表
Number of Sales = 
COUNTROWS(
    RELATEDTABLE(Sales)
)

// USERELATIONSHIP - 使用非活动关系
Sales by Ship Date = 
CALCULATE(
    SUM(Sales[Amount]),
    USERELATIONSHIP(Sales[Ship Date], 'Calendar'[Date])
)
```

### 迭代函数

```dax
// SUMX - 逐行求和
Total Revenue = 
SUMX(
    Sales,
    Sales[Quantity] * Sales[Unit Price]
)

// AVERAGEX - 逐行平均
Average Order Value = 
AVERAGEX(
    Orders,
    CALCULATE(SUM(Sales[Amount]))
)

// RANKX - 排名
Product Rank = 
RANKX(
    ALL(Products[Product Name]),
    [Total Sales],
    ,
    DESC
)
```

## 常用模式

### 百分比计算

```dax
// 占比计算
Sales % of Total = 
DIVIDE(
    SUM(Sales[Amount]),
    CALCULATE(
        SUM(Sales[Amount]),
        ALL(Products)
    )
)
```

### 移动平均

```dax
// 3 个月移动平均
3 Month Moving Average = 
CALCULATE(
    AVERAGE(Sales[Amount]),
    DATESINPERIOD(
        'Calendar'[Date],
        LASTDATE('Calendar'[Date]),
        -3,
        MONTH
    )
)
```

### 累计和

```dax
// 累计销售额
Cumulative Sales = 
CALCULATE(
    SUM(Sales[Amount]),
    FILTER(
        ALL('Calendar'[Date]),
        'Calendar'[Date] <= MAX('Calendar'[Date])
    )
)
```

### 排名和 Top N

```dax
// Top 10 产品
Top 10 Products = 
IF(
    [Product Rank] <= 10,
    [Total Sales],
    BLANK()
)
```

## 变量使用

使用 VAR 可以提高代码可读性和性能：

```dax
// 使用变量
Profit Margin = 
VAR Revenue = SUM(Sales[Amount])
VAR Cost = SUM(Sales[Cost])
VAR Profit = Revenue - Cost
RETURN
    DIVIDE(Profit, Revenue)
```

## 性能优化

### 优化技巧

1. **使用度量值而非计算列**
2. **避免在迭代函数中使用 CALCULATE**
3. **使用变量缓存结果**
4. **简化筛选条件**
5. **使用 KEEPFILTERS 而非 FILTER**

```dax
// 不推荐
Slow Measure = 
SUMX(
    Sales,
    Sales[Amount] * CALCULATE(MAX(Products[Price]))
)

// 推荐
Fast Measure = 
VAR MaxPrice = MAX(Products[Price])
RETURN
    SUMX(Sales, Sales[Amount] * MaxPrice)
```

## 错误处理

```dax
// 使用 DIVIDE 避免除零错误
Safe Division = 
DIVIDE(
    SUM(Sales[Profit]),
    SUM(Sales[Revenue]),
    0  // 默认值
)

// 使用 IFERROR
Safe Calculation = 
IFERROR(
    [Complex Calculation],
    BLANK()
)
```

!!! warning "常见错误"
    - 循环依赖
    - 上下文转换问题
    - 关系方向错误
    - 筛选上下文丢失

## 学习资源

- [SQLBI](https://www.sqlbi.com/) - DAX 专家网站
- [DAX Guide](https://dax.guide/) - DAX 函数参考
- [DAX Patterns](https://www.daxpatterns.com/) - 常用模式

## 下一步

继续学习 [可视化技巧](visualization.md) 来更好地呈现你的数据分析结果。
