# SQL 数据查询

SQL (Structured Query Language) 是用于管理和查询关系型数据库的标准语言。

## 为什么学习 SQL？

- **通用性强**：几乎所有关系型数据库都支持
- **需求广泛**：数据分析、后端开发、数据工程等领域必备
- **易于学习**：语法接近自然语言
- **功能强大**：可以处理复杂的数据查询和分析

## 学习路径

1. **[SQL 基础](basic.md)** - 学习基本的 SQL 语法和查询
2. **[SQL 高级](advanced.md)** - 掌握高级查询技巧和优化
3. **[最佳实践](best-practices.md)** - 了解 SQL 编写的最佳实践

## 快速示例

### 简单查询

```sql
-- 查询所有数据
SELECT * FROM employees;

-- 查询特定列
SELECT first_name, last_name, salary
FROM employees;

-- 条件查询
SELECT *
FROM employees
WHERE salary > 50000;
```

### 聚合统计

```sql
-- 计算平均工资
SELECT AVG(salary) as avg_salary
FROM employees;

-- 按部门分组统计
SELECT department, COUNT(*) as employee_count
FROM employees
GROUP BY department;
```

### 表连接

```sql
-- 内连接
SELECT e.first_name, e.last_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;
```

## 常用数据库

| 数据库 | 类型 | 特点 |
|--------|------|------|
| MySQL | 开源 | 最流行的开源数据库 |
| PostgreSQL | 开源 | 功能强大，支持高级特性 |
| SQL Server | 商业 | 微软产品，与 .NET 集成好 |
| Oracle | 商业 | 企业级，功能最全 |
| SQLite | 嵌入式 | 轻量级，无需服务器 |

!!! note "开始学习"
    点击左侧导航栏开始学习 SQL！

## 在线练习资源

- [SQLZoo](https://sqlzoo.net/)
- [LeetCode Database](https://leetcode.com/problemset/database/)
- [HackerRank SQL](https://www.hackerrank.com/domains/sql)
