# SQL 基础

SQL 的基本语法和常用操作。

## SELECT 查询

### 基本查询

```sql
-- 查询所有列
SELECT * FROM customers;

-- 查询指定列
SELECT customer_id, customer_name, email
FROM customers;

-- 使用别名
SELECT 
    customer_id AS id,
    customer_name AS name
FROM customers;
```

### WHERE 条件筛选

```sql
-- 单个条件
SELECT * FROM products
WHERE price > 100;

-- 多个条件（AND）
SELECT * FROM products
WHERE price > 100 AND category = 'Electronics';

-- 多个条件（OR）
SELECT * FROM products
WHERE category = 'Electronics' OR category = 'Books';

-- IN 操作符
SELECT * FROM products
WHERE category IN ('Electronics', 'Books', 'Toys');

-- LIKE 模糊查询
SELECT * FROM customers
WHERE customer_name LIKE 'A%';  -- 以 A 开头

-- BETWEEN 范围查询
SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';
```

## 排序和限制

```sql
-- 升序排序
SELECT * FROM products
ORDER BY price ASC;

-- 降序排序
SELECT * FROM products
ORDER BY price DESC;

-- 多列排序
SELECT * FROM products
ORDER BY category ASC, price DESC;

-- 限制结果数量
SELECT * FROM products
ORDER BY price DESC
LIMIT 10;
```

## 聚合函数

```sql
-- 计数
SELECT COUNT(*) FROM orders;

-- 求和
SELECT SUM(amount) FROM orders;

-- 平均值
SELECT AVG(price) FROM products;

-- 最大值和最小值
SELECT MAX(price), MIN(price) FROM products;

-- 去重计数
SELECT COUNT(DISTINCT customer_id) FROM orders;
```

## GROUP BY 分组

```sql
-- 按类别分组统计
SELECT category, COUNT(*) as product_count
FROM products
GROUP BY category;

-- 多列分组
SELECT category, supplier_id, COUNT(*) as count
FROM products
GROUP BY category, supplier_id;

-- HAVING 筛选分组结果
SELECT category, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 50;
```

## JOIN 连接

### INNER JOIN

```sql
-- 内连接（只返回匹配的行）
SELECT 
    o.order_id,
    o.order_date,
    c.customer_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id;
```

### LEFT JOIN

```sql
-- 左连接（返回左表所有行）
SELECT 
    c.customer_name,
    o.order_id,
    o.order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;
```

### RIGHT JOIN

```sql
-- 右连接（返回右表所有行）
SELECT 
    c.customer_name,
    o.order_id
FROM customers c
RIGHT JOIN orders o ON c.customer_id = o.customer_id;
```

## INSERT 插入

```sql
-- 插入单行
INSERT INTO customers (customer_name, email, phone)
VALUES ('John Doe', 'john@example.com', '123-456-7890');

-- 插入多行
INSERT INTO products (product_name, price, category)
VALUES 
    ('Product A', 29.99, 'Electronics'),
    ('Product B', 49.99, 'Books'),
    ('Product C', 19.99, 'Toys');
```

## UPDATE 更新

```sql
-- 更新数据
UPDATE products
SET price = 39.99
WHERE product_id = 1;

-- 更新多列
UPDATE customers
SET email = 'newemail@example.com', phone = '098-765-4321'
WHERE customer_id = 100;
```

## DELETE 删除

```sql
-- 删除特定行
DELETE FROM orders
WHERE order_id = 1001;

-- 删除满足条件的行
DELETE FROM products
WHERE price < 10;
```

!!! warning "注意"
    - 使用 DELETE 和 UPDATE 时务必加上 WHERE 条件，否则会影响所有行
    - 在生产环境操作前建议先备份数据

## 下一步

继续学习 [SQL 高级](advanced.md) 来掌握更复杂的查询技巧。
