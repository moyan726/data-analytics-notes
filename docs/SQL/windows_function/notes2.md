---
description: SQL 窗口函数进阶教程，深入讲解帧子句（Frame Clause）、FIRST_VALUE/LAST_VALUE/NTH_VALUE/NTILE/CUME_DIST/PERCENT_RANK 高级函数用法与实战案例。
---

!!! abstract "文章概述"

    本文是 **SQL 窗口函数系列**的**进阶篇**，深入讲解帧子句与高级窗口函数。
    
    **主要内容**：
    
    - **帧子句（Frame Clause）**：`ROWS` vs `RANGE` 的区别与常见陷阱
    - **取值函数**：`FIRST_VALUE()`、`LAST_VALUE()`、`NTH_VALUE()` 用法与注意事项
    - **分桶函数**：`NTILE()` 均匀分组与其局限性
    - **分布函数**：`CUME_DIST()` 累积分布、`PERCENT_RANK()` 百分比排名
    - **WINDOW 子句**：命名窗口简化写法
    - MySQL 与 PostgreSQL 语法差异对照
    
    **前置知识**：建议先阅读 [第一篇基础教程](notes1.md)，掌握 `OVER()`、`PARTITION BY`、`ORDER BY` 基础语法
    
    **适合读者**：已掌握窗口函数基础，希望深入理解帧子句和高级函数的学习者

---

# SQL 窗口函数进阶笔记

> 本笔记整合自视频教程《SQL Window Function》的字幕与相关学习材料。  
> 涵盖：`FIRST_VALUE`、`LAST_VALUE`、`NTH_VALUE`、`NTILE`、`CUME_DIST`、`PERCENT_RANK` 以及 **Frame Clause（帧子句）** 的核心用法。

---

## 目录


???- tip "目录-点击下拉查看"
    [TOC]

---

## 0. 前置知识回顾

!!! tip "进入本章前，请确保已掌握"
    - `OVER(PARTITION BY ... ORDER BY ...)` 语法结构
    - `ROW_NUMBER()`、`RANK()`、`DENSE_RANK()` 的区别
    - `LEAD()` / `LAG()` 的基本用法
    
    如有遗忘，请回顾 [基础篇笔记](notes1.md)。

---

## 1. 示例数据表结构

> **场景说明**：
> 在进阶篇中，为了更好地演示价格排名（Ranking）、同分异构（Ties）以及多维度的分布统计（Distribution），我们使用一份数据分布更丰富的**电子产品表 (Product)**。
> 相比基础篇的员工表，这份数据包含了品牌、分类和更多样的价格分布，适合练习复杂的窗口分析。

### 建表与数据

```sql
DROP TABLE IF EXISTS product;
CREATE TABLE product
(
    product_category VARCHAR(255),  -- 产品类别（Phone/Laptop/Earphone/Headphone/Smartwatch）
    brand            VARCHAR(255),  -- 品牌（Apple/Samsung/OnePlus/Google 等）
    product_name     VARCHAR(255),  -- 产品名称
    price            INT            -- 价格
);

INSERT INTO product VALUES
('Phone', 'Apple', 'iPhone 12 Pro Max', 1300),
('Phone', 'Apple', 'iPhone 12 Pro', 1100),
('Phone', 'Apple', 'iPhone 12', 1000),
('Phone', 'Samsung', 'Galaxy Z Fold 3', 1800),
('Phone', 'Samsung', 'Galaxy Z Flip 3', 1000),
('Phone', 'Samsung', 'Galaxy Note 20', 1200),
('Phone', 'Samsung', 'Galaxy S21', 1000),
('Phone', 'OnePlus', 'OnePlus Nord', 300),
('Phone', 'OnePlus', 'OnePlus 9', 800),
('Phone', 'Google', 'Pixel 5', 600),
('Laptop', 'Apple', 'MacBook Pro 13', 2000),
('Laptop', 'Apple', 'MacBook Air', 1200),
('Laptop', 'Microsoft', 'Surface Laptop 4', 2100),
('Laptop', 'Dell', 'XPS 13', 2000),
('Laptop', 'Dell', 'XPS 15', 2300),
('Laptop', 'Dell', 'XPS 17', 2500),
('Earphone', 'Apple', 'AirPods Pro', 280),
('Earphone', 'Samsung', 'Galaxy Buds Pro', 220),
('Earphone', 'Samsung', 'Galaxy Buds Live', 170),
('Earphone', 'Sony', 'WF-1000XM4', 250),
('Headphone', 'Sony', 'WH-1000XM4', 400),
('Headphone', 'Apple', 'AirPods Max', 550),
('Headphone', 'Microsoft', 'Surface Headphones 2', 250),
('Smartwatch', 'Apple', 'Apple Watch Series 6', 1000),
('Smartwatch', 'Apple', 'Apple Watch SE', 400),
('Smartwatch', 'Samsung', 'Galaxy Watch 4', 600),
('Smartwatch', 'OnePlus', 'OnePlus Watch', 220);
```

### 字段说明

| 字段              | 类型          | 描述                                     |
| :---------------- | :------------ | :--------------------------------------- |
| `product_category` | VARCHAR(255) | 产品类别（手机/笔记本/耳机/耳麦/智能手表） |
| `brand`           | VARCHAR(255)  | 品牌名称                                 |
| `product_name`    | VARCHAR(255)  | 产品具体名称                             |
| `price`           | INT           | 产品价格                                 |

---

## 2. FIRST_VALUE 函数

### 功能

从**分区内第一条记录**中提取指定列的值。

### 使用场景

获取每个类别中**最贵**的产品名称。

### 语法示例

```sql
SELECT *,
    FIRST_VALUE(product_name) 
        OVER(PARTITION BY product_category ORDER BY price DESC)
        AS most_exp_product
FROM product;
```

### 执行逻辑

1. `PARTITION BY product_category`：按产品类别分组
2. `ORDER BY price DESC`：每组内按价格降序排列
3. `FIRST_VALUE(product_name)`：取排序后**第一行**的 `product_name`

!!! note "结果"
    每行都会显示该类别中最贵产品的名称。

---

## 3. LAST_VALUE 函数与帧子句

### 功能

从**分区内最后一条记录**中提取指定列的值。

### ⚠️ 关键问题：默认帧子句的陷阱

如果不显式指定帧子句，`LAST_VALUE` 返回的是**当前行自己**而非分组末尾的值！

#### 错误示例

```sql
-- ❌ 结果不符合预期
SELECT *,
    LAST_VALUE(product_name) 
        OVER(PARTITION BY product_category ORDER BY price DESC)
        AS least_exp_product
FROM product;
```

#### 正确写法

```sql
-- ✅ 必须添加帧子句
SELECT *,
    FIRST_VALUE(product_name) 
        OVER(PARTITION BY product_category ORDER BY price DESC)
        AS most_exp_product,
    LAST_VALUE(product_name) 
        OVER(PARTITION BY product_category ORDER BY price DESC
            RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
        AS least_exp_product
FROM product
WHERE product_category = 'Phone';
```

---

## 4. 帧子句详解（Frame Clause）

### 什么是帧（Frame）？

帧是**分区内的子集**。窗口函数在计算时，只能"看到"帧范围内的数据。

### 默认帧子句

当包含 `ORDER BY` 时，SQL 默认使用：

```sql
RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
```

- `UNBOUNDED PRECEDING`：从分区的**第一行**开始
- `CURRENT ROW`：到**当前行**结束

!!! warning "后果"
    `LAST_VALUE` 只能取到"当前行"，而非分区末尾。

### 修正帧子句

```sql
RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
```

- `UNBOUNDED FOLLOWING`：扩展到分区的**最后一行**

### ROWS vs RANGE 的区别

| 关键字  | 含义                             | 处理重复值                   |
| :------ | :------------------------------- | :--------------------------- |
| `ROWS`  | 按**物理行号**计算               | 严格按行，重复值分开处理     |
| `RANGE` | 按 `ORDER BY` 列的**数值逻辑**计算 | 相同值视为"同一位置"统一处理 |

#### 示例对比

假设有 3 行数据的 `price` 都是 1000：

- **ROWS**：第 5 行时，帧只包含第 1~5 行
- **RANGE**：第 5 行时，帧包含第 1~7 行（所有 price=1000 的行都算作"当前位置"）

### 帧子句的灵活用法

```sql
-- 当前行前后各 2 行
ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING

-- 从分区开始到当前行后 3 行
ROWS BETWEEN UNBOUNDED PRECEDING AND 3 FOLLOWING
```

---

## 5. WINDOW 子句简化写法

### 问题

多个窗口函数使用**相同的 OVER 子句**时，代码冗长且难维护。

### 解决方案：命名窗口

```sql
SELECT *,
    FIRST_VALUE(product_name) OVER w AS most_exp_product,
    LAST_VALUE(product_name)  OVER w AS least_exp_product
FROM product
WHERE product_category = 'Phone'
WINDOW w AS (
    PARTITION BY product_category 
    ORDER BY price DESC
    RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
);
```

### 语法结构

```sql
WINDOW 别名 AS (窗口定义)
```

!!! tip "优点"
    - 代码简洁，避免重复
    - 提高可读性和维护性

---

## 6. NTH_VALUE 函数

### 功能

获取分区内**第 N 行**的指定列值。

### 使用场景

获取每个类别中**第二贵**的产品。

### 语法示例

```sql
SELECT *,
    FIRST_VALUE(product_name) OVER w AS most_exp_product,
    LAST_VALUE(product_name)  OVER w AS least_exp_product,
    NTH_VALUE(product_name, 2) OVER w AS second_most_exp_product
FROM product
WINDOW w AS (
    PARTITION BY product_category 
    ORDER BY price DESC
    RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
);
```

### ⚠️ 注意事项

1. **必须指定正确的帧子句**，否则可能取不到预期值
2. 若分区内行数不足 N，返回 `NULL`

---

## 7. NTILE 函数（分桶）

### 功能

将数据**均匀分成 N 个桶**，为每行分配桶编号。

### 使用场景

将手机按价格分为：昂贵 / 中档 / 便宜 三类。

### 语法示例

```sql
SELECT 
    x.product_name,
    CASE 
        WHEN x.buckets = 1 THEN 'Expensive Phones'
        WHEN x.buckets = 2 THEN 'Mid Range Phones'
        WHEN x.buckets = 3 THEN 'Cheaper Phones' 
    END AS Phone_Category
FROM (
    SELECT *,
        NTILE(3) OVER (ORDER BY price DESC) AS buckets
    FROM product
    WHERE product_category = 'Phone'
) x;
```

### 分桶规则

- 10 条数据分 3 桶：10 ÷ 3 = 3 余 1
- 结果：桶1 有 **4 条**，桶2 有 3 条，桶3 有 3 条

### ⚠️ NTILE 的弊端

**相同价格的产品可能被分到不同桶！**

因为 `NTILE` 只关心**行数均匀**，不关心数值是否相同。

#### 替代方案：使用 CUME_DIST

```sql
SELECT product_name, price,
    CASE 
        WHEN dist <= 0.33 THEN 'Expensive Phones'
        WHEN dist <= 0.66 THEN 'Mid Range Phones'
        ELSE 'Cheaper Phones'
    END AS Phone_Category
FROM (
    SELECT *,
        CUME_DIST() OVER (ORDER BY price DESC) AS dist
    FROM product
    WHERE product_category = 'Phone'
) x;
```

| 对比        | NTILE                    | CUME_DIST                |
| :---------- | :----------------------- | :----------------------- |
| 分组依据    | 强制均分行数             | 按数值百分比             |
| 处理相同值  | **会拆分**到不同组       | **不拆分**，同值同组     |
| 适用场景    | 需要等量分组时           | 需要业务逻辑准确时       |

---

## 8. CUME_DIST 函数（累积分布）

### 功能

计算当前行在分区中的**相对位置百分比**。

### 公式

```
CUME_DIST = 当前行排名 / 总行数
```

- 相同值的行，取**最后一行的排名**计算
- 返回值范围：**(0, 1]**

### 使用场景

筛选价格处于**前 30%** 的产品。

### 语法示例（MySQL 版）

```sql
SELECT product_name, cume_dist_percentage
FROM (
    SELECT *,
        CUME_DIST() OVER (ORDER BY price DESC) AS cume_distribution,
        CONCAT(ROUND(CUME_DIST() OVER (ORDER BY price DESC) * 100, 2), '%') 
            AS cume_dist_percentage
    FROM product
) x
WHERE x.cume_distribution <= 0.3;
```

### 计算示例

假设 27 条数据按价格降序排列：

| 排名 | 产品         | 价格 | CUME_DIST 计算     |
| :--- | :----------- | :--- | :----------------- |
| 1    | XPS 17       | 2500 | 1/27 ≈ 0.037 (3.7%) |
| 2    | XPS 15       | 2300 | 2/27 ≈ 0.074 (7.4%) |
| 4~5  | (price=2000) | 2000 | 5/27 ≈ 0.185 (18.5%) |

!!! warning "注意"
    相同价格（如 2000）的两条记录，均返回 5/27。

---

## 9. PERCENT_RANK 函数（百分比排名）

### 功能

计算当前行的**相对排名百分比**。

### 公式

```
PERCENT_RANK = (当前行号 - 1) / (总行数 - 1)
```

- 返回值范围：**[0, 1]**
- 第一行永远为 **0**
- 最后一行通常为 **1**

### 与 CUME_DIST 的区别

| 函数           | 第一行 | 最后一行 | 公式                     |
| :------------- | :----- | :------- | :----------------------- |
| `CUME_DIST`    | > 0    | 1        | 排名 / 总数              |
| `PERCENT_RANK` | 0      | 1        | (排名 - 1) / (总数 - 1)  |

### 使用场景

查询某产品比其他产品贵了**多少百分比**。

### 语法示例（MySQL 版）

```sql
SELECT product_name, per
FROM (
    SELECT *,
        PERCENT_RANK() OVER (ORDER BY price) AS p_rank,
        ROUND(PERCENT_RANK() OVER (ORDER BY price) * 100, 2) AS per
    FROM product
) x
WHERE x.product_name = 'Galaxy Z Fold 3';
```

### 结果解读

如果返回 `80.77`，意味着 Galaxy Z Fold 3 的价格**比 80.77% 的其他产品都贵**。

---

## 10. MySQL 与 PostgreSQL 语法差异

### 常见问题

| 问题            | PostgreSQL 写法   | MySQL 写法                    |
| :-------------- | :---------------- | :---------------------------- |
| 类型转换        | `::numeric`       | 直接计算或使用 `CAST()`       |
| 字符串拼接      | `\|\|`            | `CONCAT()`                    |

### 示例修正

```sql
-- PostgreSQL（原版）
round(cume_dist() over (...) ::numeric * 100, 2) || '%'

-- MySQL（修正版）
CONCAT(ROUND(CUME_DIST() OVER (...) * 100, 2), '%')
```

---

## 11. 完整 SQL 语句汇总

### FIRST_VALUE - 最贵产品

```sql
SELECT *,
    FIRST_VALUE(product_name) 
        OVER(PARTITION BY product_category ORDER BY price DESC) 
        AS most_exp_product
FROM product;
```

### LAST_VALUE - 最便宜产品

```sql
SELECT *,
    FIRST_VALUE(product_name) 
        OVER(PARTITION BY product_category ORDER BY price DESC) 
        AS most_exp_product,
    LAST_VALUE(product_name) 
        OVER(PARTITION BY product_category ORDER BY price DESC
            RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) 
        AS least_exp_product
FROM product
WHERE product_category = 'Phone';
```

### WINDOW 子句简化版

```sql
SELECT *,
    FIRST_VALUE(product_name) OVER w AS most_exp_product,
    LAST_VALUE(product_name) OVER w AS least_exp_product
FROM product
WHERE product_category = 'Phone'
WINDOW w AS (
    PARTITION BY product_category 
    ORDER BY price DESC
    RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
);
```

### NTH_VALUE - 第 N 贵产品

```sql
SELECT *,
    FIRST_VALUE(product_name) OVER w AS most_exp_product,
    LAST_VALUE(product_name) OVER w AS least_exp_product,
    NTH_VALUE(product_name, 2) OVER w AS second_most_exp_product
FROM product
WINDOW w AS (
    PARTITION BY product_category 
    ORDER BY price DESC
    RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
);
```

### NTILE - 分桶分类

```sql
SELECT 
    x.product_name,
    CASE 
        WHEN x.buckets = 1 THEN 'Expensive Phones'
        WHEN x.buckets = 2 THEN 'Mid Range Phones'
        WHEN x.buckets = 3 THEN 'Cheaper Phones' 
    END AS Phone_Category
FROM (
    SELECT *,
        NTILE(3) OVER (ORDER BY price DESC) AS buckets
    FROM product
    WHERE product_category = 'Phone'
) x;
```

### CUME_DIST - 前 30% 产品

```sql
SELECT product_name, cume_dist_percentage
FROM (
    SELECT *,
        CUME_DIST() OVER (ORDER BY price DESC) AS cume_distribution,
        CONCAT(ROUND(CUME_DIST() OVER (ORDER BY price DESC) * 100, 2), '%') 
            AS cume_dist_percentage
    FROM product
) x
WHERE x.cume_distribution <= 0.3;
```

### PERCENT_RANK - 价格百分比排名

```sql
SELECT product_name, per
FROM (
    SELECT *,
        PERCENT_RANK() OVER (ORDER BY price) AS p_rank,
        ROUND(PERCENT_RANK() OVER (ORDER BY price) * 100, 2) AS per
    FROM product
) x
WHERE x.product_name = 'Galaxy Z Fold 3';
```

---

## ⚠️ 易错点汇总

| 陷阱 | 现象 | 原因 | 解决方案 |
|:----|:----|:----|:--------|
| `LAST_VALUE` 返回当前行 | 每行返回自己的值 | 默认帧是 `CURRENT ROW` | 显式指定 `UNBOUNDED FOLLOWING` |
| `NTH_VALUE` 返回 NULL | 部分行结果为空 | 帧范围未覆盖第 N 行 | 显式指定完整帧范围 |
| `NTILE` 相同值分到不同桶 | 同价商品被拆分 | NTILE 只关心行数均匀 | 改用 `CUME_DIST` 按百分比分组 |
| `RANGE` 与 `ROWS` 混淆 | 结果与预期不符 | 重复值处理方式不同 | 明确需求后选择正确的关键字 |
| PostgreSQL 语法不兼容 | MySQL 报错 | 类型转换/字符串拼接语法差异 | 使用 `CAST()` 和 `CONCAT()` |

---

## 总结：窗口函数速查表

| 函数           | 功能                           | 需要帧子句？ |
| :------------- | :----------------------------- | :----------- |
| `FIRST_VALUE`  | 取分区第一行的值               | ❌ 通常不需要 |
| `LAST_VALUE`   | 取分区最后一行的值             | ✅ **必须**   |
| `NTH_VALUE`    | 取分区第 N 行的值              | ✅ **推荐**   |
| `NTILE`        | 均匀分桶                       | ❌ 不需要     |
| `CUME_DIST`    | 累积分布（当前行排名/总行数）  | ❌ 不需要     |
| `PERCENT_RANK` | 百分比排名（排名-1/总行数-1）  | ❌ 不需要     |

---

!!! tip "学习建议"
    理解帧子句是掌握窗口函数的关键。`LAST_VALUE` 和 `NTH_VALUE` 的正确使用必须配合适当的帧子句！

---

!!! quote "综合性能优化总结"
    SQL 窗口函数的高效运行依赖于 **"索引"** 与 **"写法"** 的双重优化：
    
    1.  **索引优化（基础篇）**：为 `PARTITION BY` 和 `ORDER BY` 的列建立联合索引，避免全表排序。
    2.  **写法优化（进阶篇）**：使用 `WINDOW` 子句复用定义，减少代码冗余并帮助优化器识别执行计划。

---

> **文档版本**：v1.1  
> **最后更新**：2026-02-05  
> **适用范围**：MySQL 8.0+、PostgreSQL、Oracle、SQL Server
