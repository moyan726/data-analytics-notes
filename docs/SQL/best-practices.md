# SQL 最佳实践

编写高质量、可维护的 SQL 代码的最佳实践。

## 命名规范

### 表名和列名

```sql
-- 推荐：使用有意义的名称，小写加下划线
CREATE TABLE customer_orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10, 2)
);

-- 避免：缩写和无意义的名称
CREATE TABLE co (
    oid INT,
    cid INT,
    dt DATE,
    amt DECIMAL(10, 2)
);
```

### 别名使用

```sql
-- 推荐：使用有意义的别名
SELECT 
    c.customer_name,
    o.order_date,
    o.total_amount
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id;

-- 避免：单字母别名（除非表名本身很短）
SELECT c.*, o.*
FROM customers c, orders o;
```

## 代码格式

### 缩进和换行

```sql
-- 推荐：清晰的格式
SELECT 
    c.customer_id,
    c.customer_name,
    c.email,
    COUNT(o.order_id) as order_count,
    SUM(o.total_amount) as total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.country = 'USA'
    AND c.active = 1
GROUP BY 
    c.customer_id,
    c.customer_name,
    c.email
HAVING COUNT(o.order_id) > 0
ORDER BY total_spent DESC
LIMIT 100;
```

### 关键字大写

```sql
-- 推荐：SQL 关键字大写
SELECT customer_name, email
FROM customers
WHERE country = 'USA';

-- 也可接受：全小写（保持一致即可）
select customer_name, email
from customers
where country = 'USA';
```

## 查询优化

### 使用适当的 JOIN 类型

```sql
-- 推荐：明确使用 INNER JOIN
SELECT o.order_id, c.customer_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id;

-- 避免：隐式连接
SELECT o.order_id, c.customer_name
FROM orders o, customers c
WHERE o.customer_id = c.customer_id;
```

### 避免子查询嵌套过深

```sql
-- 不推荐：多层嵌套
SELECT *
FROM customers
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
    WHERE order_id IN (
        SELECT order_id
        FROM order_items
        WHERE product_id = 100
    )
);

-- 推荐：使用 JOIN
SELECT DISTINCT c.*
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
WHERE oi.product_id = 100;
```

### 限制返回结果

```sql
-- 在开发和测试时使用 LIMIT
SELECT *
FROM large_table
LIMIT 100;

-- 对于分页，使用 OFFSET
SELECT *
FROM products
ORDER BY product_id
LIMIT 20 OFFSET 40;  -- 第 3 页，每页 20 条
```

## 安全性

### 防止 SQL 注入

```sql
-- 不安全：直接拼接用户输入
-- query = "SELECT * FROM users WHERE username = '" + username + "'"

-- 安全：使用参数化查询（伪代码）
-- query = "SELECT * FROM users WHERE username = ?"
-- execute(query, [username])
```

### 权限管理

```sql
-- 最小权限原则
GRANT SELECT ON database.table TO 'read_only_user'@'localhost';

-- 不要给予不必要的权限
REVOKE ALL PRIVILEGES ON database.* FROM 'limited_user'@'localhost';
```

## 数据完整性

### 使用约束

```sql
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);
```

### 使用事务

```sql
-- 确保数据一致性
BEGIN TRANSACTION;

INSERT INTO orders (customer_id, total_amount) VALUES (1, 100.00);
INSERT INTO order_items (order_id, product_id, quantity) VALUES (LAST_INSERT_ID(), 10, 2);

COMMIT;
```

## 注释和文档

```sql
-- 表注释
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    -- 价格以美元为单位
    price DECIMAL(10, 2) NOT NULL,
    -- 库存数量
    stock_quantity INT DEFAULT 0
);

-- 复杂查询的注释
-- 查询过去 30 天内销售额最高的前 10 个产品
SELECT 
    p.product_name,
    SUM(oi.quantity * oi.unit_price) as total_sales
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY p.product_id, p.product_name
ORDER BY total_sales DESC
LIMIT 10;
```

## 测试

### 使用测试数据

```sql
-- 创建测试环境
CREATE DATABASE test_db;

-- 插入测试数据
INSERT INTO test_customers (customer_name, email)
VALUES 
    ('Test User 1', 'test1@example.com'),
    ('Test User 2', 'test2@example.com');
```

### 验证查询结果

```sql
-- 检查数据质量
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(*) - COUNT(email) as missing_emails
FROM customers;
```

## 版本控制

- 将 SQL 脚本纳入版本控制（Git）
- 使用迁移工具管理数据库变更
- 为每个变更编写回滚脚本

## 性能监控

```sql
-- 定期检查慢查询
SHOW FULL PROCESSLIST;

-- 分析表统计信息
ANALYZE TABLE customers;

-- 优化表
OPTIMIZE TABLE orders;
```

!!! tip "持续改进"
    - 定期审查和重构 SQL 代码
    - 关注数据库性能指标
    - 学习数据库特定的最佳实践
    - 保持代码简洁和可读性

## 学习资源

- [SQL Style Guide](https://www.sqlstyle.guide/)
- [Use The Index, Luke](https://use-the-index-luke.com/)
- 数据库官方文档
