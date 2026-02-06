---
description: SQL 窗口函数入门教程，系统讲解 OVER、PARTITION BY、ORDER BY 语法，涵盖排名函数（ROW_NUMBER/RANK/DENSE_RANK）与位移函数（LEAD/LAG），配有完整案例与练习数据。
---

!!! abstract "文章概述"

    本文是 **SQL 窗口函数系列**的**基础篇**，系统讲解窗口函数的核心概念与常用函数。
    
    **主要内容**：
    
    - 窗口函数与 `GROUP BY` 聚合的本质区别
    - `OVER()`、`PARTITION BY`、`ORDER BY` 语法详解
    - 排名函数：`ROW_NUMBER()`、`RANK()`、`DENSE_RANK()` 对比与选型
    - 位移函数：`LEAD()` 与 `LAG()` 实现同比/环比分析
    - 实战案例：分组取 Top N、移动平均、累计求和等
    
    **适合读者**：有 SQL 基础，希望掌握窗口函数核心用法的学习者
    
    **进阶内容**：帧子句（Frame Clause）、`FIRST_VALUE`/`LAST_VALUE`/`NTH_VALUE`/`NTILE`/`CUME_DIST`/`PERCENT_RANK` 等高级函数详见 [第二篇进阶笔记](notes2.md)

---

# SQL 窗口函数完整教程

> **课程来源**：[YouTube 视频教程](https://www.youtube.com/watch?v=Ww71knvhQ-s )《SQL Window Function | How to write SQL Query using RANK, DENSE RANK, LEAD/LAG | SQL Queries Tutorial》 
> **适用数据库**：MySQL 8.0+、PostgreSQL、Oracle、SQL Server（语法大体通用，个别细节有差异）

---

## 目录

???- tip "目录-点击下拉"
    [TOC]

---

## 1. 窗口函数概述

### 1.1 什么是窗口函数

**窗口函数**（Window Function），又称**分析函数**（Analytic Function），允许在不减少结果集行数的情况下，对**一组相关行**（称为"窗口"）执行计算。

!!! important "重要"
    **核心区别**：`GROUP BY` 会将多行折叠为一行，而窗口函数保留所有行，只是为每行附加一个计算值。

### 1.2 为什么需要窗口函数

| 传统方法的局限性 | 窗口函数的优势 |
|:---|:---|
| `GROUP BY` + 聚合函数只能返回汇总行 | 保留原始行的同时附加计算值 |
| 需要复杂子查询实现排名 | 使用 `RANK()`/`ROW_NUMBER()` 简洁实现 |
| 难以获取前后行数据 | `LEAD()`/`LAG()` 直接访问相邻行 |

**典型场景示例**：
- 从员工表中找出**每个部门薪水最高的前 3 名员工**
- 显示**每个员工薪资与部门内最高/最低薪资的对比**
- 计算**同比/环比增长率**

### 1.3 面试重点提示

!!! tip "面试重点提示"
    如果您计划参加 SQL 面试，几乎可以肯定会遇到至少一个与窗口函数相关的问题。掌握 `ROW_NUMBER()`、`RANK()`、`DENSE_RANK()`、`LEAD()`、`LAG()` 是必备技能。

---

## 2. 环境准备：测试数据

本教程使用一个简单的 `employee` 表，包含 24 条员工记录，分布在 4 个部门（Admin、HR、IT、Finance）。

### 2.1 创建数据库和表

```sql
-- 创建数据库（如已存在可跳过）
CREATE DATABASE window_function;
USE window_function;

-- 创建员工表
DROP TABLE IF EXISTS employee;
CREATE TABLE employee
(
    emp_ID    INT,           -- 员工ID（假设按入职顺序递增）
    emp_NAME  VARCHAR(50),   -- 员工姓名
    DEPT_NAME VARCHAR(50),   -- 部门名称
    SALARY    INT            -- 薪资
);
```

### 2.2 插入测试数据

```sql
INSERT INTO employee VALUES(101, 'Mohan', 'Admin', 4000);
INSERT INTO employee VALUES(102, 'Rajkumar', 'HR', 3000);
INSERT INTO employee VALUES(103, 'Akbar', 'IT', 4000);
INSERT INTO employee VALUES(104, 'Dorvin', 'Finance', 6500);
INSERT INTO employee VALUES(105, 'Rohit', 'HR', 3000);
INSERT INTO employee VALUES(106, 'Rajesh',  'Finance', 5000);
INSERT INTO employee VALUES(107, 'Preet', 'HR', 7000);
INSERT INTO employee VALUES(108, 'Maryam', 'Admin', 4000);
INSERT INTO employee VALUES(109, 'Sanjay', 'IT', 6500);
INSERT INTO employee VALUES(110, 'Vasudha', 'IT', 7000);
INSERT INTO employee VALUES(111, 'Melinda', 'IT', 8000);
INSERT INTO employee VALUES(112, 'Komal', 'IT', 10000);
INSERT INTO employee VALUES(113, 'Gautham', 'Admin', 2000);
INSERT INTO employee VALUES(114, 'Manisha', 'HR', 3000);
INSERT INTO employee VALUES(115, 'Chandni', 'IT', 4500);
INSERT INTO employee VALUES(116, 'Satya', 'Finance', 6500);
INSERT INTO employee VALUES(117, 'Adarsh', 'HR', 3500);
INSERT INTO employee VALUES(118, 'Tejaswi', 'Finance', 5500);
INSERT INTO employee VALUES(119, 'Cory', 'HR', 8000);
INSERT INTO employee VALUES(120, 'Monica', 'Admin', 5000);
INSERT INTO employee VALUES(121, 'Rosalin', 'IT', 6000);
INSERT INTO employee VALUES(122, 'Ibrahim', 'IT', 8000);
INSERT INTO employee VALUES(123, 'Vikram', 'IT', 8000);
INSERT INTO employee VALUES(124, 'Dheeraj', 'IT', 11000);
COMMIT;
```

### 2.3 验证数据

```sql
-- 查看所有员工数据
SELECT * FROM employee;
```

**预期输出**（共 24 条记录，部分展示）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY |
|:-------|:---------|:----------|:-------|
| 101 | Mohan | Admin | 4000 |
| 102 | Rajkumar | HR | 3000 |
| 103 | Akbar | IT | 4000 |
| ... | ... | ... | ... |
| 124 | Dheeraj | IT | 11000 |

---

## 3. 核心语法详解

### 3.1 窗口函数通用语法

```sql
<窗口函数> OVER (
    [PARTITION BY <分区列>]    -- 可选：定义窗口分区范围
    [ORDER BY <排序列> [ASC|DESC]]  -- 可选：定义窗口内计算顺序
    [ROWS/RANGE BETWEEN ... AND ...]  -- 可选：定义窗口帧范围
)
```

**或者使用命名窗口（Named Window）简化复用**：

> 命名窗口（`WINDOW w AS ...`）可以避免重复书写相同的 `OVER` 子句。这部分属于进阶语法，详见 **[进阶篇笔记-第5章](notes2.md#5-window-子句简化写法)**。

### 3.2 关键子句解析

| 子句 | 必选/可选 | 作用 |
|:-----|:---------|:-----|
| **OVER()** | 必选 | 标识该函数为窗口函数。如果括号为空，则整个结果集作为一个窗口 |
| **PARTITION BY** | 可选 | 将数据划分为多个分区，函数在每个分区内独立计算（类似 `GROUP BY`，但不折叠行） |
| **ORDER BY** | 可选 | 决定分区内数据的排列顺序，对排名函数和位移函数至关重要 |
| **ROWS/RANGE BETWEEN** | 可选 | 定义移动窗口的具体范围（如"前 2 行到当前行"） |

!!! note "笔记"
    `OVER()` 是窗口函数的**标志**。它告诉数据库："不要把结果合并成一行，而是为每一行都去'看一看'根据规则定义的数据窗口，并且把计算结果填回来。"

### 3.3 窗口帧（Window Frame）进阶详解

窗口帧用于在分区（Partition）内部进一步细分窗口范围，这对于计算移动平均、累计求和至关重要。

#### 3.3.1 语法结构
```sql
ROWS|RANGE BETWEEN <start_bound> AND <end_bound>
```

#### 3.3.2 边界选项 (Bound Options)
- `CURRENT ROW`：当前行
- `UNBOUNDED PRECEDING`：分区内的第一行
- `UNBOUNDED FOLLOWING`：分区内的最后一行
- `N PRECEDING`：当前行之前的 N 行
- `N FOLLOWING`：当前行之后的 N 行

#### 3.3.3 ROWS 与 RANGE 的区别
- **ROWS**：按**物理行**计算（如"前 1 行"）。
- **RANGE**：按**排序列的数值**计算（如"日期减 1 天"）。如果排序列有重复值，`RANGE` 会将它们视为同一组同时处理。

#### 3.3.4 默认帧规则
如果指定了 `ORDER BY` 但未指定帧子句，默认帧为：
```sql
RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
```
> 这就是为什么 `LAST_VALUE()` 在默认情况下只看到"截止到当前行的最后一行"，而不是"整个分区的最后一行"。

---

## 4. 聚合函数作为窗口函数

### 4.1 传统聚合 vs 窗口聚合

**需求**：查找员工表中的最高工资

**方法一：传统聚合（单个结果）**

```sql
-- 查看员工的最高工资
SELECT MAX(SALARY) AS max_salary FROM employee;
```

**执行结果**：

| max_salary |
|:-----------|
| 11000 |

> **说明**：返回单行，无法看到具体员工信息。

---

**方法二：分组聚合（每组一行）**

```sql
-- 进一步查看每个部门的最高工资
SELECT dept_name, MAX(salary) AS max_salary
FROM employee
GROUP BY dept_name;
```

**执行结果**：

| dept_name | max_salary |
|:----------|:-----------|
| Admin | 5000 |
| Finance | 6500 |
| HR | 8000 |
| IT | 11000 |

> **说明**：返回 4 行（每个部门一行），但丢失了具体员工的详细信息。

---

**方法三：窗口聚合（保留所有行）**

```sql
-- 窗口函数：保留所有行，同时附加部门最高工资
SELECT e.*,
       MAX(salary) OVER(PARTITION BY dept_name) AS max_salary
FROM employee e;
```

**执行结果**（部分展示）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | max_salary |
|:-------|:---------|:----------|:-------|:-----------|
| 101 | Mohan | Admin | 4000 | 5000 |
| 108 | Maryam | Admin | 4000 | 5000 |
| 113 | Gautham | Admin | 2000 | 5000 |
| 120 | Monica | Admin | 5000 | 5000 |
| 104 | Dorvin | Finance | 6500 | 6500 |
| ... | ... | ... | ... | ... |

> **说明**：
> - `PARTITION BY dept_name`：按部门分组，每个部门作为一个独立的"窗口"
> - `MAX(salary)` 在每个窗口内计算最高工资，并填充到该窗口的每一行
> - 原始 24 条记录全部保留，附加了部门最高工资列

---

### 4.2 全局窗口（不分区）

```sql
-- 全局窗口：不分区，整张表作为一个窗口
SELECT e.*,
       MAX(salary) OVER() AS max_salary  -- 注意：OVER() 为空
FROM employee e;
```

**执行结果**（部分展示）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | max_salary |
|:-------|:---------|:----------|:-------|:-----------|
| 101 | Mohan | Admin | 4000 | 11000 |
| 102 | Rajkumar | HR | 3000 | 11000 |
| 103 | Akbar | IT | 4000 | 11000 |
| ... | ... | ... | ... | 11000 |

> **说明**：
> - `OVER()` 为空时，整张表被视为一个巨大的窗口
> - `MAX(salary)` 计算全公司最高工资（11000），填充到每一行

### 4.3 常用聚合窗口函数

除了 `MAX()` 外，还可以使用 `MIN()`、`SUM()`、`AVG()`、`COUNT()` 等聚合函数作为窗口函数：

```sql
SELECT e.*,
       MAX(salary) OVER(PARTITION BY dept_name) AS max_salary,
       MIN(salary) OVER(PARTITION BY dept_name) AS min_salary,
       AVG(salary) OVER(PARTITION BY dept_name) AS avg_salary,
       SUM(salary) OVER(PARTITION BY dept_name) AS total_salary,
       COUNT(*) OVER(PARTITION BY dept_name) AS emp_count
FROM employee e;
```

---

## 5. 排名函数

### 5.1 ROW_NUMBER()

#### 功能说明
为表中的每条记录分配一个**唯一的连续整数**，不考虑是否有重复值。

#### 基础语法

```sql
-- 行号函数：根据 dept_name 字段对数据进行分组，并为每个分组内的记录分配一个唯一的行号
SELECT e.*,
       ROW_NUMBER() OVER(PARTITION BY dept_name) AS rn
FROM employee e;
```

**执行结果**（Admin 部门示例）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | rn |
|:-------|:---------|:----------|:-------|:---|
| 101 | Mohan | Admin | 4000 | 1 |
| 108 | Maryam | Admin | 4000 | 2 |
| 113 | Gautham | Admin | 2000 | 3 |
| 120 | Monica | Admin | 5000 | 4 |

> **说明**：
> - 行号在每个新的分区（部门）开始时**重置为 1**
> - 由于未指定 `ORDER BY`，分配顺序取决于数据库内部存储顺序（不推荐依赖）

---

#### 全局行号（不分区）

```sql
-- OVER 中如果不指定子句，则会对整张表视为一个窗口，为整个窗口分配行号
SELECT e.*,
       ROW_NUMBER() OVER() AS rn
FROM employee e;
```

**执行结果**：所有 24 条记录分配 1-24 的连续行号。

---

#### 实战案例：获取每个部门最早入职的前 2 名员工

**需求**：假设 `emp_id` 越小代表入职越早，获取每个部门最早入职的前 2 名员工。

```sql
-- 从每个部门中获取最早加入公司的前两名员工
-- 使用窗口函数加上子查询实现
SELECT * FROM (
    SELECT e.*,
           ROW_NUMBER() OVER(PARTITION BY dept_name ORDER BY emp_id) AS rn
    FROM employee e
) x
WHERE x.rn < 3;
```

**执行结果**（共 8 条记录）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | rn |
|:-------|:---------|:----------|:-------|:---|
| 101 | Mohan | Admin | 4000 | 1 |
| 108 | Maryam | Admin | 4000 | 2 |
| 104 | Dorvin | Finance | 6500 | 1 |
| 106 | Rajesh | Finance | 5000 | 2 |
| 102 | Rajkumar | HR | 3000 | 1 |
| 105 | Rohit | HR | 3000 | 2 |
| 103 | Akbar | IT | 4000 | 1 |
| 109 | Sanjay | IT | 6500 | 2 |

!!! note "笔记"
    **为什么需要子查询？** 窗口函数不能直接在 `WHERE` 子句中使用，因为 `WHERE` 的执行顺序先于 `SELECT`（窗口函数在 `SELECT` 阶段执行）。必须先用子查询计算出行号，再在外层筛选。

---

### 5.2 RANK()

#### 功能说明
- 如果有**重复值**（如薪水相同），分配**相同的排名**
- **跳号机制**：如果有 2 个第 1 名，下一名直接是第 3 名（跳过第 2 名）

#### 实战案例：获取每个部门薪水最高的前 3 名员工

```sql
-- RANK() 函数
-- 找到每个部门中薪水最高的前三名员工
SELECT * FROM (
    SELECT e.*,
           RANK() OVER(PARTITION BY dept_name ORDER BY salary DESC) AS rnk
    FROM employee e
) x
WHERE x.rnk < 4;
```

**执行结果**（共 14 条记录）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | rnk |
|:-------|:---------|:----------|:-------|:----|
| 120 | Monica | Admin | 5000 | 1 |
| 101 | Mohan | Admin | 4000 | 2 |
| 108 | Maryam | Admin | 4000 | 2 |
| 113 | Gautham | Admin | 2000 | 4 |
| 104 | Dorvin | Finance | 6500 | 1 |
| 116 | Satya | Finance | 6500 | 1 |
| 118 | Tejaswi | Finance | 5500 | 3 |
| ... | ... | ... | ... | ... |

!!! important "重要"
    注意 Admin 部门的排名：Mohan 和 Maryam 薪水相同（4000），都是第 2 名。下一个 Gautham（2000）直接是第 4 名，跳过了第 3 名。这就是 `RANK()` 的**跳号特性**。

---

### 5.3 DENSE_RANK()

#### 功能说明
- 如果有**重复值**，分配**相同的排名**
- **不跳号**：如果有 2 个第 1 名，下一名仍然是第 2 名

#### 语法示例

```sql
-- DENSE_RANK() 函数
SELECT e.*,
       DENSE_RANK() OVER(PARTITION BY dept_name ORDER BY salary DESC) AS dense_rnk
FROM employee e;
```

**执行结果**（Admin 部门示例）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | dense_rnk |
|:-------|:---------|:----------|:-------|:----------|
| 120 | Monica | Admin | 5000 | 1 |
| 101 | Mohan | Admin | 4000 | 2 |
| 108 | Maryam | Admin | 4000 | 2 |
| 113 | Gautham | Admin | 2000 | 3 |

> **说明**：Mohan 和 Maryam 都是第 2 名，下一个 Gautham 是第 3 名（不跳号）。

---

### 5.4 三者对比

```sql
-- 对比 ROW_NUMBER()、RANK()、DENSE_RANK() 的区别
SELECT e.*,
       RANK() OVER(PARTITION BY dept_name ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER(PARTITION BY dept_name ORDER BY salary DESC) AS dense_rnk,
       ROW_NUMBER() OVER(PARTITION BY dept_name ORDER BY salary DESC) AS rn
FROM employee e;
```

**执行结果**（Admin 部门示例）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | rnk | dense_rnk | rn |
|:-------|:---------|:----------|:-------|:----|:----------|:---|
| 120 | Monica | Admin | 5000 | 1 | 1 | 1 |
| 101 | Mohan | Admin | 4000 | 2 | 2 | 2 |
| 108 | Maryam | Admin | 4000 | 2 | 2 | 3 |
| 113 | Gautham | Admin | 2000 | 4 | 3 | 4 |

#### 对比表格

| 函数 | 处理重复值 | 是否跳号 | 结果示例 (薪资: 5000, 4000, 4000, 2000) |
|:-----|:----------|:--------|:-------------------------------------|
| `ROW_NUMBER()` | 仍分配不同值（唯一） | 不适用 | 1, 2, 3, 4 |
| `RANK()` | 相同值相同排名 | **是** | 1, 2, 2, 4 |
| `DENSE_RANK()` | 相同值相同排名 | **否** | 1, 2, 2, 3 |

!!! tip "技巧"
    **如何选择？**
    - 需要唯一序号 → `ROW_NUMBER()`
    - 需要排名且关注"第几名"（如奖牌榜） → `RANK()`
    - 需要排名且关注"多少个不同等级"（如工资层级） → `DENSE_RANK()`

---

## 6. 位移函数：LEAD() 与 LAG()

### 6.1 功能说明

| 函数 | 作用 | 默认行为 |
|:-----|:-----|:---------|
| **LAG(col, n, default)** | 获取当前行**之前**第 n 行的值 | n=1, default=NULL |
| **LEAD(col, n, default)** | 获取当前行**之后**第 n 行的值 | n=1, default=NULL |

**参数说明**：
- `col`：要获取的列
- `n`：偏移量（向前/向后多少行），默认为 1
- `default`：如果超出范围时的默认值，默认为 NULL

---

### 6.2 LAG() 基础示例

```sql
-- LAG 函数：获取当前行之前的某一行的数据
SELECT e.*,
       LAG(salary) OVER(PARTITION BY dept_name ORDER BY emp_id) AS prev_empl_sal
FROM employee e;
```

**执行结果**（Admin 部门示例）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | prev_empl_sal |
|:-------|:---------|:----------|:-------|:--------------|
| 101 | Mohan | Admin | 4000 | NULL |
| 108 | Maryam | Admin | 4000 | 4000 |
| 113 | Gautham | Admin | 2000 | 4000 |
| 120 | Monica | Admin | 5000 | 2000 |

> **说明**：
> - 第一条记录没有"前一行"，返回 NULL
> - Maryam 的 `prev_empl_sal` 是 Mohan 的薪资（4000）
> - Gautham 的 `prev_empl_sal` 是 Maryam 的薪资（4000）

---

### 6.3 LEAD() 基础示例

```sql
-- LEAD 函数：获取当前行之后的某一行的数据
SELECT e.*,
       LEAD(salary) OVER(PARTITION BY dept_name ORDER BY emp_id) AS next_empl_sal
FROM employee e;
```

**执行结果**（Admin 部门示例）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | next_empl_sal |
|:-------|:---------|:----------|:-------|:--------------|
| 101 | Mohan | Admin | 4000 | 4000 |
| 108 | Maryam | Admin | 4000 | 2000 |
| 113 | Gautham | Admin | 2000 | 5000 |
| 120 | Monica | Admin | 5000 | NULL |

> **说明**：最后一条记录没有"后一行"，返回 NULL。

---

### 6.4 带参数的 LEAD()

```sql
-- lead(salary, 2, 0) 中的参数含义如下：
-- salary: 指定要获取的列
-- 2: 表示向后偏移 2 行的数据（即当前行之后的第 2 行）
-- 0: 表示如果偏移超出范围时的默认值（这里是 0）
SELECT e.*,
       LEAD(salary, 2, 0) OVER(PARTITION BY dept_name ORDER BY emp_id) AS next_empl_sal
FROM employee e;
```

**执行结果**（Admin 部门示例）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | next_empl_sal |
|:-------|:---------|:----------|:-------|:--------------|
| 101 | Mohan | Admin | 4000 | 2000 |
| 108 | Maryam | Admin | 4000 | 5000 |
| 113 | Gautham | Admin | 2000 | 0 |
| 120 | Monica | Admin | 5000 | 0 |

> **说明**：
> - Mohan 向后 2 行是 Gautham（薪资 2000）
> - Gautham 和 Monica 向后 2 行超出范围，返回默认值 0

---

### 6.5 实战案例：薪资比较分析

**需求**：查询显示某员工的薪水是高于、低于还是等于上一位员工（按 emp_id 排序）的薪水。

```sql
-- 查询显示某员工的薪水是高于、低于还是等于上一位员工的薪水
SELECT e.*,
       LAG(salary) OVER(PARTITION BY dept_name ORDER BY emp_id) AS prev_empl_sal,
       CASE 
           WHEN e.salary > LAG(salary) OVER(PARTITION BY dept_name ORDER BY emp_id) 
               THEN 'Higher than previous employee'
           WHEN e.salary < LAG(salary) OVER(PARTITION BY dept_name ORDER BY emp_id) 
               THEN 'Lower than previous employee'
           WHEN e.salary = LAG(salary) OVER(PARTITION BY dept_name ORDER BY emp_id) 
               THEN 'Same as previous employee' 
       END AS sal_range
FROM employee e;
```

**执行结果**（Admin 部门示例）：

| emp_ID | emp_NAME | DEPT_NAME | SALARY | prev_empl_sal | sal_range |
|:-------|:---------|:----------|:-------|:--------------|:----------|
| 101 | Mohan | Admin | 4000 | NULL | NULL |
| 108 | Maryam | Admin | 4000 | 4000 | Same as previous employee |
| 113 | Gautham | Admin | 2000 | 4000 | Lower than previous employee |
| 120 | Monica | Admin | 5000 | 2000 | Higher than previous employee |

!!! tip "技巧"
    **业务应用场景**：
    - 销售业绩环比分析
    - 库存变化趋势
    - 用户行为前后对比

---

## 7. 其他窗口函数（补充）

视频教程主要讲解了 `ROW_NUMBER()`、`RANK()`、`DENSE_RANK()`、`LEAD()`、`LAG()` 五个核心函数。以下补充其他常用窗口函数，确保文档完整性。

### 7.1 FIRST_VALUE() / LAST_VALUE()

#### 功能说明
- `FIRST_VALUE(col)`：返回窗口内第一行的值
- `LAST_VALUE(col)`：返回窗口内最后一行的值

#### 语法示例

```sql
-- 获取每个部门薪资最高和最低的员工姓名
SELECT e.*,
       FIRST_VALUE(emp_name) OVER(
           PARTITION BY dept_name 
           ORDER BY salary DESC
       ) AS highest_paid_emp,
       LAST_VALUE(emp_name) OVER(
           PARTITION BY dept_name 
           ORDER BY salary DESC
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS lowest_paid_emp
FROM employee e;
```

!!! danger "注意"
    **`LAST_VALUE()` 陷阱**：默认窗口帧是 `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`，意味着"最后一行"只是当前行为止的最后一行。要获取真正的最后一行，必须显式指定 `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`。

---

### 7.2 NTH_VALUE()

#### 功能说明
返回窗口内第 N 行的值。

#### 语法示例

```sql
-- 获取每个部门薪资第二高的员工薪资
SELECT e.*,
       NTH_VALUE(salary, 2) OVER(
           PARTITION BY dept_name 
           ORDER BY salary DESC
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS second_highest_salary
FROM employee e;
```

---

### 7.3 NTILE()

#### 功能说明
将窗口内的行**均匀分成 N 个桶**，返回每行所在的桶编号（1 到 N）。

#### 语法示例

```sql
-- 将每个部门的员工按薪资分成 4 个等级
SELECT e.*,
       NTILE(4) OVER(PARTITION BY dept_name ORDER BY salary DESC) AS salary_quartile
FROM employee e;
```

**执行结果示例**（IT 部门，10 名员工）：

| emp_NAME | SALARY | salary_quartile |
|:---------|:-------|:----------------|
| Dheeraj | 11000 | 1 |
| Komal | 10000 | 1 |
| Vikram | 8000 | 1 |
| Ibrahim | 8000 | 2 |
| Melinda | 8000 | 2 |
| Vasudha | 7000 | 2 |
| Sanjay | 6500 | 3 |
| Rosalin | 6000 | 3 |
| Chandni | 4500 | 4 |
| Akbar | 4000 | 4 |

> **说明**：10 名员工分成 4 组，每组 2-3 人。

---

### 7.4 PERCENT_RANK() / CUME_DIST()

#### 功能说明
- `PERCENT_RANK()`：计算当前行的**百分比排名** = (rank - 1) / (total_rows - 1)
- `CUME_DIST()`：计算当前行的**累积分布** = 当前排名及之前的行数 / 总行数

#### 语法示例

```sql
-- 计算每个员工在部门内的薪资百分位排名
SELECT e.*,
       PERCENT_RANK() OVER(PARTITION BY dept_name ORDER BY salary) AS pct_rank,
       CUME_DIST() OVER(PARTITION BY dept_name ORDER BY salary) AS cum_dist
FROM employee e;
```

**执行结果示例**（Admin 部门）：

| emp_NAME | SALARY | pct_rank | cum_dist |
|:---------|:-------|:---------|:---------|
| Gautham | 2000 | 0.000 | 0.25 |
| Mohan | 4000 | 0.333 | 0.75 |
| Maryam | 4000 | 0.333 | 0.75 |
| Monica | 5000 | 1.000 | 1.00 |

> **说明**：
> - Gautham 薪资最低，`PERCENT_RANK` = 0
> - Monica 薪资最高，`PERCENT_RANK` = 1
> - `CUME_DIST` 表示"有多少比例的员工薪资小于等于当前员工"

---

## 8. 实战案例汇总

### 8.1 分组取 Top N

**需求**：每部门薪水最高的前 3 人（推荐使用 CTE 写法）

```sql
-- 使用 CTE（公用表表达式）实现
WITH RankedData AS (
    SELECT 
        *,
        DENSE_RANK() OVER(PARTITION BY dept_name ORDER BY salary DESC) AS ranking
    FROM employee
)
SELECT * 
FROM RankedData 
WHERE ranking <= 3;
```

---

### 8.2 计算移动平均值

**需求**：计算最近 3 个月的平均销量

```sql
-- 使用 ROWS BETWEEN 定义滑动窗口框架
SELECT 
    month, sales,
    AVG(sales) OVER(
        ORDER BY month 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3_months
FROM monthly_sales;
```

---

### 8.3 同比/环比分析

```sql
SELECT 
    year, month, revenue,
    -- 上月营收
    LAG(revenue) OVER(ORDER BY year, month) AS last_month_revenue,
    -- 环比增长率
    ROUND(
        (revenue - LAG(revenue) OVER(ORDER BY year, month)) 
        / LAG(revenue) OVER(ORDER BY year, month) * 100, 
        2
    ) AS growth_rate_pct
FROM sales_data;
```

---

### 8.4 累计求和

```sql
-- 按部门计算累计薪资
SELECT 
    emp_name, dept_name, salary,
    SUM(salary) OVER(
        PARTITION BY dept_name 
        ORDER BY emp_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM employee;
```

---

### 8.5 进阶案例：连续登录问题 (Gaps and Islands)

**需求**：假设有一个用户登录表 `user_login (user_id, login_date)`，找出**连续登录 3 天及以上**的用户。

**思路**：
1. 使用 `ROW_NUMBER()` 按日期排序生成序号。
2. 计算 `login_date - rn`（日期减去序号）。如果是连续登录，这个差值（日期基准）应该是相同的。
3. 按 `user_id` 和 `diff` 分组计数。

```sql
WITH RawData AS (
    -- 1. 生成行号
    SELECT user_id, login_date,
           ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY login_date) AS rn
    FROM user_login
),
GroupedData AS (
    -- 2. 计算差值（Island ID）
    SELECT *,
           DATE_SUB(login_date, INTERVAL rn DAY) AS island_id
    FROM RawData
)
-- 3. 统计连续天数
SELECT user_id, COUNT(*) AS consecutive_days
FROM GroupedData
GROUP BY user_id, island_id
HAVING COUNT(*) >= 3;
```

---

## 9. 性能优化与注意事项

### 9.1 索引优化

!!! important "重要"
    `PARTITION BY` 和 `ORDER BY` 的列应该建立索引。如果数据库能利用索引直接获得预排序的数据，可以避免昂贵的排序操作。

**建议**：
- 对于 `OVER(PARTITION BY dept_id ORDER BY salary)`，建议建立 `(dept_id, salary)` 的**联合索引**
- 复合索引的列顺序应与 `PARTITION BY` + `ORDER BY` 一致

### 9.2 减少列的选择

在子查询中尽量只选择需要的列，而不是 `SELECT *`，减少内存消耗，特别是在处理大数据量排序时。

### 9.3 注意分区大小

- 如果 `PARTITION BY` 产生的基数极高（每个分区只有 1-2 行），可能不适合使用窗口函数
- 全局窗口（无 `PARTITION BY`）会导致数据无法并行处理，只能单线程排序

### 9.4 替代方案评估

对于极简单的需求（如仅需要每组的最大值，不需要其他明细），标准的 `GROUP BY` 可能比窗口函数更高效。

---

## 10. 常见错误排查

### 10.1 窗口函数不能在 WHERE 中使用

**错误写法**：
```sql
-- ❌ 语法错误！
SELECT *, ROW_NUMBER() OVER(ORDER BY salary) AS rn
FROM employee
WHERE rn < 3;
```

**正确写法**：
```sql
-- ✅ 使用子查询或 CTE
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER(ORDER BY salary) AS rn
    FROM employee
) x
WHERE x.rn < 3;
```

### 10.2 LAST_VALUE() 返回意外结果

**问题**：`LAST_VALUE()` 返回当前行的值，而不是窗口的最后一行。

**原因**：默认窗口帧是 `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`。

**解决方案**：显式指定窗口帧
```sql
LAST_VALUE(col) OVER(
    ORDER BY ...
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
```

### 10.3 排名函数不传参数的疑惑

**问题**：`RANK()`、`DENSE_RANK()`、`ROW_NUMBER()` 后面为什么不传参数？

**解答**：这些函数本身不需要列参数，它们的计算依据完全由 `OVER()` 子句中的 `PARTITION BY` 和 `ORDER BY` 决定。它们只是根据排序顺序为每行分配一个值。

### 10.4 ORDER BY 遗漏导致结果不确定

**问题**：`ROW_NUMBER() OVER(PARTITION BY dept_name)` 每次执行结果可能不同。

**原因**：未指定 `ORDER BY` 时，分配顺序取决于数据库内部存储顺序，不保证一致。

**解决方案**：始终为排名函数指定明确的 `ORDER BY`。

---

## 11. 数据库版本差异说明

| 特性 | MySQL | PostgreSQL | Oracle | SQL Server |
|:-----|:------|:-----------|:-------|:-----------|
| 窗口函数支持 | 8.0+ | 8.4+ | 8i+ | 2005+ |
| `ROWS BETWEEN` | 8.0+ | 全支持 | 全支持 | 2012+ |
| `PERCENT_RANK` | 8.0+ | 全支持 | 全支持 | 2012+ |
| `NTH_VALUE` | 8.0+ | 9.0+ | 11g+ | 2012+ |
| `NTILE` | 8.0+ | 全支持 | 全支持 | 2005+ |

!!! warning "警告"
    **MySQL 5.7 及更早版本不支持窗口函数！** 如需使用，请升级到 MySQL 8.0 或使用其他变通方案（如变量模拟）。

---

## 附录：函数速查表

| 函数 | 类别 | 作用 | 是否需要 ORDER BY | 详情 |
|:-----|:-----|:-----|:-----------------|:-----|
| `ROW_NUMBER()` | 排名 | 唯一连续序号 | 推荐 | 本文 |
| `RANK()` | 排名 | 并列排名，跳号 | 必须 | 本文 |
| `DENSE_RANK()` | 排名 | 并列排名，不跳号 | 必须 | 本文 |
| `NTILE(n)` | 排名 | 分成 n 个桶 | 推荐 | [进阶篇](notes2.md) |
| `LEAD(col, n, default)` | 位移 | 向后第 n 行 | 必须 | 本文 |
| `LAG(col, n, default)` | 位移 | 向前第 n 行 | 必须 | 本文 |
| `FIRST_VALUE(col)` | 取值 | 窗口第一行 | 推荐 | [进阶篇](notes2.md) |
| `LAST_VALUE(col)` | 取值 | 窗口最后一行 | 推荐 | [进阶篇](notes2.md) |
| `NTH_VALUE(col, n)` | 取值 | 窗口第 n 行 | 推荐 | [进阶篇](notes2.md) |
| `PERCENT_RANK()` | 统计 | 百分比排名 | 必须 | [进阶篇](notes2.md) |
| `CUME_DIST()` | 统计 | 累积分布 | 必须 | [进阶篇](notes2.md) |
| `SUM/AVG/MAX/MIN/COUNT` | 聚合 | 窗口内聚合 | 可选 | 本文 |

---

> **文档版本**：v2.0  
> **最后更新**：2026-02-02  
> **适用范围**：MySQL 8.0+、PostgreSQL、Oracle、SQL Server
