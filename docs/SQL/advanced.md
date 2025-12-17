# SQL 高级

高级 SQL 查询技巧和优化方法。

## 子查询

### 在 WHERE 中使用子查询

```sql
-- 查找高于平均价格的产品
SELECT product_name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- IN 子查询
SELECT customer_name
FROM customers
WHERE customer_id IN (
    SELECT DISTINCT customer_id
    FROM orders
    WHERE order_date > '2024-01-01'
);
```

### 在 FROM 中使用子查询

```sql
-- 将子查询作为临时表
SELECT category, avg_price
FROM (
    SELECT category, AVG(price) as avg_price
    FROM products
    GROUP BY category
) AS category_avg
WHERE avg_price > 50;
```

## 窗口函数

### ROW_NUMBER

```sql
-- 为每行分配行号
SELECT 
    product_name,
    category,
    price,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) as rank
FROM products;
```

### RANK 和 DENSE_RANK

```sql
-- 排名（相同值有间隙）
SELECT 
    product_name,
    price,
    RANK() OVER (ORDER BY price DESC) as rank
FROM products;

-- 密集排名（相同值无间隙）
SELECT 
    product_name,
    price,
    DENSE_RANK() OVER (ORDER BY price DESC) as dense_rank
FROM products;
```

### 累计和移动平均

```sql
-- 累计和
SELECT 
    order_date,
    amount,
    SUM(amount) OVER (ORDER BY order_date) as cumulative_sum
FROM orders;

-- 移动平均（3 天）
SELECT 
    order_date,
    amount,
    AVG(amount) OVER (
        ORDER BY order_date 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as moving_avg
FROM daily_sales;
```

## CTE (Common Table Expression)

```sql
-- 使用 WITH 创建临时命名结果集
WITH high_value_customers AS (
    SELECT customer_id, SUM(amount) as total_spent
    FROM orders
    GROUP BY customer_id
    HAVING SUM(amount) > 10000
)
SELECT 
    c.customer_name,
    hvc.total_spent
FROM high_value_customers hvc
JOIN customers c ON hvc.customer_id = c.customer_id;

-- 递归 CTE（组织结构）
WITH RECURSIVE employee_hierarchy AS (
    -- 基础查询：顶层员工
    SELECT employee_id, manager_id, employee_name, 1 as level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- 递归查询：下级员工
    SELECT e.employee_id, e.manager_id, e.employee_name, eh.level + 1
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy;
```

## CASE WHEN 条件表达式

```sql
-- 简单 CASE
SELECT 
    product_name,
    price,
    CASE 
        WHEN price < 20 THEN 'Low'
        WHEN price < 50 THEN 'Medium'
        ELSE 'High'
    END as price_category
FROM products;

-- 多条件 CASE
SELECT 
    customer_name,
    CASE 
        WHEN total_orders > 100 THEN 'VIP'
        WHEN total_orders > 50 THEN 'Gold'
        WHEN total_orders > 10 THEN 'Silver'
        ELSE 'Regular'
    END as customer_tier
FROM (
    SELECT c.customer_id, c.customer_name, COUNT(o.order_id) as total_orders
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, c.customer_name
) customer_stats;
```

## PIVOT 和 UNPIVOT

```sql
-- 行转列（使用 CASE WHEN 模拟 PIVOT）
SELECT 
    category,
    SUM(CASE WHEN month = 'Jan' THEN sales ELSE 0 END) as Jan,
    SUM(CASE WHEN month = 'Feb' THEN sales ELSE 0 END) as Feb,
    SUM(CASE WHEN month = 'Mar' THEN sales ELSE 0 END) as Mar
FROM monthly_sales
GROUP BY category;
```

## 索引优化

```sql
-- 创建索引
CREATE INDEX idx_customer_email ON customers(email);

-- 创建复合索引
CREATE INDEX idx_order_customer_date ON orders(customer_id, order_date);

-- 查看执行计划
EXPLAIN SELECT * FROM orders WHERE customer_id = 100;
```

## 性能优化技巧

### 避免 SELECT *

```sql
-- 不推荐
SELECT * FROM large_table;

-- 推荐：只选择需要的列
SELECT id, name, email FROM large_table;
```

### 使用 EXISTS 代替 IN

```sql
-- 使用 EXISTS（通常更快）
SELECT customer_name
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.customer_id
);
```

### 避免在 WHERE 中使用函数

```sql
-- 不推荐（无法使用索引）
SELECT * FROM orders
WHERE YEAR(order_date) = 2024;

-- 推荐
SELECT * FROM orders
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';
```

## 事务处理

```sql
-- 开始事务
BEGIN TRANSACTION;

-- 执行操作
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

-- 提交事务
COMMIT;

-- 或回滚
ROLLBACK;
```

!!! tip "性能优化"
    - 合理使用索引
    - 避免 N+1 查询问题
    - 使用 EXPLAIN 分析查询计划
    - 考虑数据库缓存策略

## 下一步

查看 [最佳实践](best-practices.md) 了解 SQL 编写的最佳实践。
