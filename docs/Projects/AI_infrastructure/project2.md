# 项目 2：SQL 数据库设计与查询优化

设计和实现一个电商数据库系统，并优化常见查询。

**难度：** 🌟🌟🌟 高级  
**预计时间：** 3-4 周  
**技能要求：** SQL 高级、数据库设计、性能优化

## 项目概述

本项目将从零开始设计一个电商平台的数据库系统，包括表结构设计、数据填充、复杂查询编写以及性能优化。

### 学习目标

- 掌握数据库设计原则和规范化
- 编写复杂的 SQL 查询
- 理解和优化查询性能
- 实施数据完整性约束
- 使用存储过程和触发器

## 第一阶段：需求分析

### 业务需求

设计一个电商平台的数据库，需要支持：

1. **用户管理**
   - 用户注册和登录
   - 用户资料管理
   - 收货地址管理

2. **商品管理**
   - 商品分类
   - 商品信息
   - 库存管理
   - 商品评论

3. **订单管理**
   - 购物车
   - 订单创建
   - 订单状态跟踪
   - 订单详情

4. **支付管理**
   - 支付方式
   - 支付记录
   - 退款处理

## 第二阶段：数据库设计

### ER 图设计

#### 实体识别

```
主要实体：
- Users (用户)
- Products (商品)
- Categories (分类)
- Orders (订单)
- Order_Items (订单明细)
- Addresses (地址)
- Reviews (评论)
- Payments (支付)
```

#### 关系定义

```
- Users 1:N Addresses
- Users 1:N Orders
- Users 1:N Reviews
- Categories 1:N Products
- Products 1:N Order_Items
- Products 1:N Reviews
- Orders 1:N Order_Items
- Orders 1:1 Payments
```

### 表结构设计

#### Users Table

```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
);
```

#### Categories Table

```sql
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
        ON DELETE SET NULL,
    INDEX idx_parent (parent_category_id)
);
```

#### Products Table

```sql
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(200) NOT NULL,
    category_id INT,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    sku VARCHAR(50) UNIQUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_price (price),
    INDEX idx_active (is_active),
    FULLTEXT INDEX idx_search (product_name, description)
);
```

#### Addresses Table

```sql
CREATE TABLE addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_type ENUM('billing', 'shipping') NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    INDEX idx_user (user_id)
);
```

#### Orders Table

```sql
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipping_address_id INT,
    billing_address_id INT,
    order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') 
        DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id),
    FOREIGN KEY (billing_address_id) REFERENCES addresses(address_id),
    INDEX idx_user (user_id),
    INDEX idx_status (order_status),
    INDEX idx_date (order_date)
);
```

#### Order_Items Table

```sql
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);
```

#### Reviews Table

```sql
CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_rating (rating)
);
```

#### Payments Table

```sql
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT UNIQUE NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer') 
        NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') 
        DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_status (payment_status)
);
```

## 第三阶段：数据填充

### 生成测试数据

```sql
-- 插入分类
INSERT INTO categories (category_name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Books', 'Books and publications'),
('Home & Garden', 'Home improvement and gardening');

-- 插入用户
INSERT INTO users (username, email, password_hash, first_name, last_name, phone) VALUES
('john_doe', 'john@example.com', 'hash123', 'John', 'Doe', '123-456-7890'),
('jane_smith', 'jane@example.com', 'hash456', 'Jane', 'Smith', '098-765-4321'),
('bob_wilson', 'bob@example.com', 'hash789', 'Bob', 'Wilson', '555-123-4567');

-- 插入商品（示例）
INSERT INTO products (product_name, category_id, description, price, stock_quantity, sku) VALUES
('Laptop Pro 15', 1, 'High-performance laptop', 1299.99, 50, 'ELEC-LAP-001'),
('Wireless Mouse', 1, 'Ergonomic wireless mouse', 29.99, 200, 'ELEC-MOU-001'),
('Cotton T-Shirt', 2, 'Comfortable cotton t-shirt', 19.99, 150, 'CLOT-TSH-001');
```

### 批量数据生成脚本

```python
import random
import string
from datetime import datetime, timedelta

# 生成订单数据的 Python 脚本
def generate_orders(num_orders=1000):
    sql_statements = []
    for i in range(num_orders):
        user_id = random.randint(1, 100)
        order_number = f"ORD-{datetime.now().year}-{i+1:06d}"
        order_date = datetime.now() - timedelta(days=random.randint(0, 365))
        total = round(random.uniform(20, 500), 2)
        
        sql = f"""
        INSERT INTO orders (user_id, order_number, order_date, total_amount)
        VALUES ({user_id}, '{order_number}', '{order_date}', {total});
        """
        sql_statements.append(sql)
    
    return sql_statements
```

## 第四阶段：复杂查询

### 1. 销售分析查询

```sql
-- 月度销售趋势
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    COUNT(DISTINCT order_id) AS total_orders,
    SUM(total_amount) AS total_revenue,
    AVG(total_amount) AS avg_order_value
FROM orders
WHERE order_status != 'cancelled'
GROUP BY month
ORDER BY month DESC;

-- Top 10 畅销商品
SELECT 
    p.product_name,
    p.category_id,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.subtotal) AS total_revenue,
    COUNT(DISTINCT oi.order_id) AS order_count
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_status != 'cancelled'
GROUP BY p.product_id, p.product_name, p.category_id
ORDER BY total_revenue DESC
LIMIT 10;
```

### 2. 客户分析查询

```sql
-- 客户购买统计
SELECT 
    u.user_id,
    u.username,
    u.email,
    COUNT(o.order_id) AS total_orders,
    SUM(o.total_amount) AS lifetime_value,
    AVG(o.total_amount) AS avg_order_value,
    MAX(o.order_date) AS last_order_date,
    DATEDIFF(CURRENT_DATE, MAX(o.order_date)) AS days_since_last_order
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE o.order_status != 'cancelled'
GROUP BY u.user_id, u.username, u.email
ORDER BY lifetime_value DESC;

-- RFM 分析
WITH rfm_data AS (
    SELECT 
        user_id,
        DATEDIFF(CURRENT_DATE, MAX(order_date)) AS recency,
        COUNT(order_id) AS frequency,
        SUM(total_amount) AS monetary
    FROM orders
    WHERE order_status != 'cancelled'
    GROUP BY user_id
)
SELECT 
    user_id,
    recency,
    frequency,
    monetary,
    NTILE(5) OVER (ORDER BY recency DESC) AS r_score,
    NTILE(5) OVER (ORDER BY frequency) AS f_score,
    NTILE(5) OVER (ORDER BY monetary) AS m_score
FROM rfm_data;
```

### 3. 库存管理查询

```sql
-- 低库存警报
SELECT 
    p.product_id,
    p.product_name,
    p.stock_quantity,
    COALESCE(SUM(oi.quantity), 0) AS total_sold_30days,
    CASE 
        WHEN p.stock_quantity < 10 THEN 'Critical'
        WHEN p.stock_quantity < 30 THEN 'Low'
        ELSE 'Normal'
    END AS stock_status
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id
    AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
WHERE p.is_active = TRUE
GROUP BY p.product_id, p.product_name, p.stock_quantity
HAVING stock_status IN ('Critical', 'Low')
ORDER BY p.stock_quantity ASC;
```

## 第五阶段：性能优化

### 1. 查询优化

#### 使用 EXPLAIN 分析

```sql
EXPLAIN SELECT 
    p.product_name,
    SUM(oi.quantity) AS total_sold
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name
ORDER BY total_sold DESC;
```

#### 优化前后对比

```sql
-- 慢查询（未优化）
SELECT * FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE YEAR(o.order_date) = 2024;

-- 优化后
SELECT * FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.order_date >= '2024-01-01' 
  AND o.order_date < '2025-01-01';
```

### 2. 索引优化

```sql
-- 创建复合索引
CREATE INDEX idx_orders_user_status_date 
ON orders(user_id, order_status, order_date);

-- 创建覆盖索引
CREATE INDEX idx_order_items_covering 
ON order_items(order_id, product_id, quantity, subtotal);

-- 查看索引使用情况
SHOW INDEX FROM orders;
```

### 3. 使用存储过程

```sql
-- 创建订单的存储过程
DELIMITER //

CREATE PROCEDURE create_order(
    IN p_user_id INT,
    IN p_items JSON,
    OUT p_order_id INT
)
BEGIN
    DECLARE v_order_number VARCHAR(50);
    DECLARE v_total DECIMAL(10, 2);
    DECLARE v_item_index INT DEFAULT 0;
    DECLARE v_item_count INT;
    
    -- 开始事务
    START TRANSACTION;
    
    -- 生成订单号
    SET v_order_number = CONCAT('ORD-', YEAR(NOW()), '-', 
                                LPAD(FLOOR(RAND() * 1000000), 6, '0'));
    
    -- 创建订单
    INSERT INTO orders (user_id, order_number, subtotal, total_amount)
    VALUES (p_user_id, v_order_number, 0, 0);
    
    SET p_order_id = LAST_INSERT_ID();
    
    -- 处理订单项
    SET v_item_count = JSON_LENGTH(p_items);
    SET v_total = 0;
    
    WHILE v_item_index < v_item_count DO
        -- 插入订单项逻辑
        -- ...
        SET v_item_index = v_item_index + 1;
    END WHILE;
    
    -- 更新订单总额
    UPDATE orders 
    SET total_amount = v_total, subtotal = v_total
    WHERE order_id = p_order_id;
    
    COMMIT;
END //

DELIMITER ;
```

### 4. 创建触发器

```sql
-- 更新库存的触发器
DELIMITER //

CREATE TRIGGER after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE product_id = NEW.product_id;
END //

DELIMITER ;
```

## 第六阶段：性能测试

### 基准测试

```sql
-- 测试查询性能
SET @start_time = NOW(6);

-- 执行查询
SELECT ...;

SET @end_time = NOW(6);
SELECT TIMESTAMPDIFF(MICROSECOND, @start_time, @end_time) AS execution_time_ms;
```

## 可交付成果

1. **数据库设计文档**
   - ER 图
   - 表结构说明
   - 关系说明

2. **SQL 脚本**
   - DDL (创建表)
   - DML (插入数据)
   - 查询脚本

3. **性能报告**
   - 查询性能对比
   - 优化建议
   - 索引策略

4. **文档和演示**
   - README
   - 使用说明
   - 演示视频

## 扩展挑战

1. **实现搜索功能**（全文搜索）
2. **添加缓存层**（Redis）
3. **实现分片策略**（水平分表）
4. **添加审计日志**
5. **实现备份和恢复**

## 总结

通过完成这个项目，你将掌握：

✅ 数据库设计和规范化  
✅ 编写复杂 SQL 查询  
✅ 查询性能优化  
✅ 索引策略  
✅ 存储过程和触发器  

## 学习资源

- [Database Design for Mere Mortals](https://www.amazon.com/Database-Design-Mere-Mortals-Hands/dp/0321884493)
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [MySQL Performance Blog](https://www.percona.com/blog/)
