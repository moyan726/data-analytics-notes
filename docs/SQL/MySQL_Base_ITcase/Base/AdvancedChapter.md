# 进阶篇相关内容

## 一、存储引擎

### 1.1 MySQL 体系结构

![结构图](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/MySQL%E4%BD%93%E7%B3%BB%E7%BB%93%E6%9E%84.png)
![层级描述](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/MySQL%E4%BD%93%E7%B3%BB%E7%BB%93%E6%9E%84%E5%B1%82%E7%BA%A7%E5%90%AB%E4%B9%89.png)

### 1.2 存储引擎简介

存储引擎就是存储数据、建立索引、更新/查询数据等技术的实现方式。存储引擎是基于表而不是基于库的，所以存储引擎也可以被称为表引擎。
默认存储引擎是 InnoDB。

相关操作：

```mysql
-- 03.进阶-存储引擎-简介
-- 查询建表语句  建表时不指定存储引擎  默认为InnoDB
show create table account;
-- 建表时指定存储引擎
CREATE TABLE 表名(
	...
) ENGINE=INNODB;

-- 查看当前数据库支持的存储引擎
show engines;

-- 创建表my_myisam,并指定MyISAM存储引擎
create table my_myisam(
    id int,
    name varchar(10)
)engine = MyISAM;

-- 创建表my_memory,并指定Memory存储引擎
create table my_memory(
    id int,
    name varchar(10)
)engine = Memory;
```

### 1.3 常见存储引擎

#### 1.3.1 InnoDB

InnoDB 是一种兼顾**高可靠性**和**高性能**的通用存储引擎，在 MySQL 5.5 之后，InnoDB 是默认的 MySQL 引擎。

**特点：**

- DML 操作遵循 ACID 模型，支持**事务**
- **行级锁**，提高并发访问性能
- 支持**外键** `FOREIGN KEY` 约束，保证数据的完整性和正确性

**文件：**

- `xxx.ibd`: xxx代表表名，InnoDB 引擎的每张表都会对应这样一个**表空间文件**，存储该表的表结构（frm、sdi）、数据和索引。

**参数：** `innodb_file_per_table` (MySQL 8.0 以后默认打开)，决定多张表共享一个表空间还是每张表对应一个表空间。

查看 MySQL 中 InnoDB 存储引擎是否为每张表开启了独立的表空间文件：
`show variables like 'innodb_file_per_table';`

查询 MySQL 数据库的数据文件存放目录：`show variables like 'datadir';`
从 ibd 文件提取表结构数据：（在 cmd 运行）`ibd2sdi xxx.ibd`

**InnoDB 逻辑存储结构：**
![InnoDB逻辑存储结构](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/%E9%80%BB%E8%BE%91%E5%AD%98%E5%82%A8%E7%BB%93%E6%9E%84.png)

#### 1.3.2 MyISAM

MyISAM 是 MySQL 早期的默认存储引擎。

**特点：**

- 不支持事务，不支持外键
- 支持表锁，不支持行锁
- 访问速度快

**文件：**

- `xxx.sdi`: 存储表结构信息
- `xxx.MYD`: 存储数据
- `xxx.MYI`: 存储索引

#### 1.3.3 Memory

Memory 引擎的表数据是存储在内存中的，受硬件问题、断电问题的影响，可能会丢失数据，所以只能将这些表作为临时表或缓存使用。

**特点：**

- 存放在内存中，速度快
- Hash 索引（默认）支持哈希索引

**文件：**

- `xxx.sdi`: 存储表结构信息

### 1.4 存储引擎特点对比

| 特点         | InnoDB              | MyISAM | Memory |
| ------------ | ------------------- | ------ | ------ |
| 存储限制     | 64TB                | 有     | 有     |
| 事务安全     | 支持                | -      | -      |
| 锁机制       | 行锁                | 表锁   | 表锁   |
| B+tree索引   | 支持                | 支持   | 支持   |
| Hash索引     | -                   | -      | 支持   |
| 全文索引     | 支持（5.6版本之后） | 支持   | -      |
| 空间使用     | 高                  | 低     | N/A    |
| 内存使用     | 高                  | 低     | 中等   |
| 批量插入速度 | 低                  | 高     | 高     |
| 支持外键     | 支持                | -      | -      |

==【面试】重点掌握 InnoDB 和 MyISAM 的区别：事务，外键，行级锁==

### 1.5 存储引擎的选择

在选择存储引擎时，应该根据应用系统的特点选择合适的存储引擎。对于复杂的应用系统，还可以根据实际情况选择多种存储引擎进行组合。

- **InnoDB**: 如果应用对事物的完整性有比较高的要求，在并发条件下要求数据的一致性，数据操作除了插入和查询之外，还包含很多的更新、删除操作，则 InnoDB 是比较合适的选择。
- **MyISAM**: 如果应用是以读操作和插入操作为主，只有很少的更新和删除操作，并且对事务的完整性、并发性要求不高，那这个存储引擎是非常合适的。
- **Memory**: 将所有数据保存在内存中，访问速度快，通常用于临时表及缓存。Memory 的缺陷是对表的大小有限制，太大的表无法缓存在内存中，而且无法保障数据的安全性。

**总结：** 日志数据，电商中的足迹和评论适合使用 MyISAM 引擎，缓存适合使用 Memory 引擎。

## 二、索引

### 2.1 索引概述

索引是帮助 MySQL **高效获取数据**的**数据结构（有序）**。在数据之外，数据库系统还维护着满足特定查找算法的数据结构，这些数据结构以某种方式引用（指向）数据，这样就可以在这些数据结构上实现高级查询算法，这种数据结构就是索引。

**优缺点：**

*   **优点：**
    - 提高数据检索效率，降低数据库的 IO 成本
    - 通过索引列对数据进行排序，降低数据排序的成本，降低 CPU 的消耗
*   **缺点：**
    - 索引列也是要占用空间的
    - 索引大大提高了查询效率，但降低了更新的速度，比如 INSERT、UPDATE、DELETE

### 2.2 索引结构

MySQL 的索引是在存储引擎中实现的，具体实现可能因存储引擎而异。

| 索引结构            | 描述                                                         |
| ------------------- | ------------------------------------------------------------ |
| B+Tree（默认）      | 最常见的索引类型，大部分引擎都支持 B+ 树索引                   |
| Hash                | 底层数据结构是用哈希表实现，只有精确匹配索引列的查询才有效，不支持范围查询 |
| R-Tree(空间索引)    | 空间索引是 MyISAM 引擎的一个特殊索引类型，主要用于地理空间数据类型，通常使用较少 |
| Full-Text(全文索引) | 是一种通过建立倒排索引，快速匹配文档的方式，类似于 Lucene, Solr, ES |

| 索引       | InnoDB        | MyISAM | Memory |
| ---------- | ------------- | ------ | ------ |
| B+Tree索引 | 支持          | 支持   | 支持   |
| Hash索引   | 不支持        | 不支持 | 支持   |
| R-Tree索引 | 不支持        | 支持   | 不支持 |
| Full-text  | 5.6版本后支持 | 支持   | 不支持 |

#### 2.2.1 B-Tree

![二叉树](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/%E4%BA%8C%E5%8F%89%E6%A0%91.png)

二叉树的缺点可以用红黑树来解决：
![红黑树](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/%E7%BA%A2%E9%BB%91%E6%A0%91.png)
红黑树也存在大数据量情况下，层级较深，检索速度慢的问题。

为了解决上述问题，可以使用 B-Tree 结构。
B-Tree (多路平衡查找树) 以一棵最大度数（max-degree，指一个节点的子节点个数）为 5（5 阶）的 B-Tree 为例（每个节点最多存储 4 个 key，5 个指针）

![B-Tree结构](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/B-Tree%E7%BB%93%E6%9E%84.png)

> B-Tree 的数据插入过程动画参照：https://www.bilibili.com/video/BV1Kr4y1i7ru?p=68
> 演示地址：https://www.cs.usfca.edu/~galles/visualization/BTree.html

#### 2.2.2 B+Tree

结构图：

![B+Tree结构图](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/B+Tree%E7%BB%93%E6%9E%84%E5%9B%BE.png)

> 演示地址：https://www.cs.usfca.edu/~galles/visualization/BPlusTree.html

**与 B-Tree 的区别：**

- 所有的数据都会出现在叶子节点
- 叶子节点形成一个单向链表

MySQL 索引数据结构对经典的 B+Tree 进行了优化。在原 B+Tree 的基础上，增加一个指向相邻叶子节点的链表指针，就形成了带有顺序指针的 B+Tree，提高区间访问的性能。

![MySQL B+Tree 结构图](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/%E7%BB%93%E6%9E%84%E5%9B%BE.png)

#### 2.2.3 Hash

哈希索引就是采用一定的 hash 算法，将键值换算成新的 hash 值，映射到对应的槽位上，然后存储在 hash 表中。
如果两个（或多个）键值，映射到一个相同的槽位上，他们就产生了 hash 冲突（也称为 hash 碰撞），可以通过链表来解决。

![Hash索引原理图](https://jimhackking.github.io/Hash%E7%B4%A2%E5%BC%95%E5%8E%9F%E7%90%86%E5%9B%BE)

**特点：**

- Hash 索引只能用于对等比较（=、in），不支持范围查询（between、>、<、…）
- 无法利用索引完成排序操作
- 查询效率高，通常只需要一次检索就可以了，效率通常要高于 B+Tree 索引

**存储引擎支持：**

- Memory
- InnoDB: 具有自适应 hash 功能，hash 索引是存储引擎根据 B+Tree 索引在指定条件下自动构建的

#### 2.2.4 面试题

> **1. 为什么 InnoDB 存储引擎选择使用 B+Tree 索引结构？**

- 相对于二叉树，层级更少，搜索效率高
- 对于 B-Tree，无论是叶子节点还是非叶子节点，都会保存数据，这样导致一页中存储的键值减少，指针也跟着减少，要同样保存大量数据，只能增加树的高度，导致性能降低
- 相对于 Hash 索引，B+Tree 支持范围匹配及排序操作

### 2.3 索引分类

| 分类     | 含义                                                 | 特点                     | 关键字   |
| -------- | ---------------------------------------------------- | ------------------------ | -------- |
| 主键索引 | 针对于表中主键创建的索引                             | 默认自动创建，只能有一个 | PRIMARY  |
| 唯一索引 | 避免同一个表中某数据列中的值重复                     | 可以有多个               | UNIQUE   |
| 常规索引 | 快速定位特定数据                                     | 可以有多个               |          |
| 全文索引 | 全文索引查找的是文本中的关键词，而不是比较索引中的值 | 可以有多个               | FULLTEXT |

在 InnoDB 存储引擎中，根据索引的存储形式，又可以分为以下两种：

| 分类                      | 含义                                                       | 特点                 |
| ------------------------- | ---------------------------------------------------------- | -------------------- |
| 聚集索引(Clustered Index) | 将数据存储与索引放一块，索引结构的叶子节点保存了行数据     | 必须有，而且只有一个 |
| 二级索引(Secondary Index) | 将数据与索引分开存储，索引结构的叶子节点关联的是对应的主键 | 可以存在多个         |

演示图：

![大致原理](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/%E5%8E%9F%E7%90%86%E5%9B%BE.png)

#### 2.3.1 索引结构深入解析：聚集索引与二级索引

**1. 两种索引的存储结构对比**

在 MySQL (InnoDB 引擎) 中，索引主要分为两类：**聚集索引 (Clustered Index)** 和 **二级索引 (Secondary Index)**。这两种索引在 B+ 树的存储结构上有本质的区别。

**(1) 聚集索引 (Clustered Index)**

*   **定义**：基于表的主键 (Primary Key) 构建的索引。
*   **特性**：
    *   每张表**有且仅有一个**聚集索引。
    *   如果表定义了主键，主键索引就是聚集索引。
*   **存储结构**：
    *   采用 **B+ 树** 结构。
    *   **核心特点**：**叶子节点 (Leaf Nodes) 直接存储整行数据 (Row Data)**。
    *   如上图所示，主键 ID 为 `5` 的叶子节点下，挂载的就是 ID=5 这整一行的数据（包含 id, name, gender 等所有列）。ID 为 `8` 的节点下挂载的就是 ID=8 的整行数据。
    *   因为数据和索引是“聚集”在一起存储的，所以称为聚集索引。

**(2) 二级索引 (Secondary Index)**

*   **定义**：基于非主键字段（如 `name`、`gender`）建立的索引，也称为辅助索引或非聚集索引。
*   **特性**：
    *   一张表可以有多个二级索引。
*   **存储结构**：
    *   同样采用 **B+ 树** 结构。
    *   **核心特点**：**叶子节点存储的是对应的主键值 (Primary Key Value)**，而不是整行数据。
    *   **为什么不存整行数据？** 如果每个索引都存储整行数据，会导致数据严重冗余，占用大量磁盘空间，且维护成本极高。
    *   如上图所示，针对 `name` 字段建立的二级索引中，叶子节点 `Arm` 下面存储的是它对应的主键 ID `10`；`Dawn` 下面存储的是对应的主键 ID `15`。

---

**2. 索引查询原理与回表机制**

理解了两种索引的结构差异后，我们通过一条 SQL 语句来模拟真实的查询过程。

**SQL 语句：**

```sql
SELECT * FROM user WHERE name = 'Arm';
```

**(1) SQL执行流程详解**

1.  **第一步：走二级索引 (Secondary Index)**
    *   查询条件是 `where name = 'Arm'`，数据库优化器会选择走 `name` 字段的二级索引。
    *   在 `name` 索引树中查找 `Arm`：
        *   与根节点比较，`Arm` < `Lee`，走左侧指针。
        *   与中间节点比较，定位到叶子节点。
    *   **获取主键**：在叶子节点找到 `Arm`，并提取出其对应的主键值 **ID = 10**。

2.  **第二步：回表查询 (Table Lookup)**
    *   由于查询语句是 `SELECT *`，需要返回整行数据，而二级索引中只有 `name` 和 `id`，缺少 `gender` 等其他字段。
    *   数据库会拿着刚才找到的主键 **ID = 10**，去 **聚集索引** 中再次进行查找。
    *   在聚集索引树中查找 `10`：
        *   与根节点比较，`10` < `15`，走左侧指针。
        *   与中间节点比较，定位到叶子节点 `10`。
    *   **获取数据**：在聚集索引的叶子节点下，直接读取到 ID=10 的**完整行数据**。

3.  **总结：什么是回表查询？**
    *   **回表查询**指的是：先通过 **二级索引** 定位到对应的主键值，再拿着这个主键值回到 **聚集索引** 中定位整行数据的过程。
    *   这是一个“跳跃”两次索引树的过程，比直接查聚集索引多了一步路。

![演示图](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/%E6%BC%94%E7%A4%BA%E5%9B%BE.png)

**聚集索引选取规则：**

- 如果存在主键，主键索引就是聚集索引
- 如果不存在主键，将使用第一个唯一(UNIQUE)索引作为聚集索引
- 如果表没有主键或没有合适的唯一索引，则 InnoDB 会自动生成一个 rowid 作为隐藏的聚集索引

#### 2.3.2 思考题

> **1. 以下 SQL 语句，哪个执行效率高？为什么？**

```sql
select * from user where id = 10;
select * from user where name = 'Arm';
-- 备注：id为主键，name字段创建的有索引
```

**答**：第一条语句效率更高。因为第二条语句需要回表查询，相当于走了两遍索引树。

> **2. InnoDB 主键索引的 B+Tree 高度为多少？**

**答**：假设一行数据大小为 1k，一页中可以存储 16 行这样的数据。InnoDB 的指针占用 6 个字节的空间，主键假设为 bigint，占用字节数为 8。
可得公式：`n * 8 + (n + 1) * 6 = 16 * 1024`，其中 8 表示 bigint 占用的字节数，n 表示当前节点存储的 key 的数量，(n + 1) 表示指针数量（比 key 多一个）。算出 n 约为 1170。

- 如果树的高度为 2，那么它能存储的数据量大概为：`1171 * 16 = 18736`；
- 如果树的高度为 3，那么它能存储的数据量大概为：`1171 * 1171 * 16 = 21939856`。

另外，如果有成千上万的数据，那么就要考虑分表，涉及运维篇知识。

### 2.4 语法

**创建索引：**
`CREATE [ UNIQUE | FULLTEXT ] INDEX index_name ON table_name (index_col_name, ...);`
如果不加 CREATE 后面不加索引类型参数，则创建的是常规索引

- 单列索引：一个索引关联一个字段
- 联合索引/组合索引：一个索引关联了多个字段

**查看索引：**
`SHOW INDEX FROM table_name;`

**删除索引：**
`DROP INDEX index_name ON table_name;`

**案例：**

```mysql
create database itcast;

use itcast;

CREATE TABLE `tb_user` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `email` VARCHAR(50) DEFAULT NULL COMMENT '邮箱',
  `profession` VARCHAR(50) DEFAULT NULL COMMENT '专业',
  `age` TINYINT UNSIGNED DEFAULT NULL COMMENT '年龄',
  `gender` TINYINT UNSIGNED DEFAULT NULL COMMENT '性别（1:男，2:女）',
  `status` TINYINT UNSIGNED DEFAULT NULL COMMENT '状态',
  `createtime` DATETIME DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';


INSERT INTO `tb_user` (`name`, `phone`, `email`, `profession`, `age`, `gender`, `status`, `createtime`)
VALUES ('吕布', '17799990000', 'lvbu666@163.com', '软件工程', 23, 1, 6, '2001-02-02 00:00:00'),
       ('曹操', '17799990001', 'caocao666@qq.com', '通讯工程', 34, 1, 0, '2001-03-05 00:00:00'),
       ('赵云', '17799990002', '177999008@139.com', '英语', 35, 1, 2, '2002-03-02 00:00:00'),
       ('孙悟空', '17799990003', '177999008@sina.com', '工程造价', 34, 1, 0, '2001-09-08 00:00:00'),
       ('花木兰', '17799990004', '199097929@sina.com', '软件工程', 22, 2, 1, '2001-04-22 00:00:00'),
       ('大乔', '17799990005', 'daqiao666@163.com', '舞蹈', 22, 2, 0, '2001-02-07 00:00:00'),
       ('露娜', '17799990006', 'luna_love@163.com', '应用数学', 24, 2, 0, '2001-02-08 00:00:00'),
       ('程咬金', '17799990007', 'chengyaojin@163.com', '化工', 38, 1, 5, '2001-05-23 00:00:00'),
       ('项羽', '17799990008', 'xiangyu666@qq.com', '金属材料', 43, 1, 0, '2001-09-28 00:00:00'),
       ('白起', '17799990009', 'baiqi666@sina.com', '机械工程及自动化', 27, 1, 2, '2001-08-16 00:00:00'),
       ('韩信', '17799990010', 'hanxin666@163.com', '无机非金属材料工程', 27, 1, 0, '2001-06-12 00:00:00'),
       ('荆轲', '17799990011', 'jingke666@qq.com', '会计', 22, 1, 0, '2001-05-11 00:00:00'),
       ('兰陵王', '17799990012', 'lanlingwang666@126.com', '工程造价', 44, 1, 1, '2001-04-09 00:00:00'),
       ('狂铁', '17799990013', 'kuangtie@sina.com', '应用数学', 43, 1, 2, '2001-04-13 00:00:00'),
       ('貂蝉', '17799990014', '849989473@qq.com', '软件工程', 40, 2, 3, '2001-09-20 00:00:00'),
       ('妲己', '17799990015', '178323829@qq.com', '软件工程', 35, 2, 0, '2001-03-02 00:00:00'),
       ('芈月', '17799990016', 'xiaomin6001@sina.com', '工业经济', 33, 2, 0, '2000-05-03 00:00:00'),
       ('嬴政', '17799990017', '893943448@qq.com', '化工', 38, 1, 1, '2001-03-08 00:00:00'),
       ('狄仁杰', '17799990018', 'jiedaren816@163.com', '国际贸易', 30, 1, 0, '2007-03-12 00:00:00'),
       ('安琪拉', '17799990019', 'jdadm@126.com', '城市规划', 51, 2, 1, '2001-08-15 00:00:00'),
       ('典韦', '17799990020', 'yaanp@163.com', '城市规划', 52, 1, 2, '2000-04-12 00:00:00'),
       ('廉颇', '17799990021', 'lianpo321@126.com', '土木工程', 19, 1, 3, '2002-07-18 00:00:00'),
       ('后羿', '17799990022', 'altycg2008@139.com', '城市园林', 20, 1, 0, '2002-03-10 00:00:00'),
       ('姜子牙', '17799990023', '374838448@qq.com', '工程造价', 29, 1, 4, '2003-05-26 00:00:00');
```

```mysql
-- name字段为姓名字段，该字段的值可能会重复，为该字段创建索引
create index idx_user_name on tb_user(name);

-- phone手机号字段的值非空，且唯一，为该字段创建唯一索引
create unique index idx_user_phone on tb_user (phone);

-- 为profession, age, status创建联合索引
create index idx_user_pro_age_stat on tb_user(profession, age, status);

-- 为email建立合适的索引来提升查询效率
create index idx_user_email on tb_user(email);

-- 删除索引
drop index idx_user_email on tb_user;
```

### 2.5 性能分析

#### 2.5.1 查看执行频次

查看当前数据库的 INSERT, UPDATE, DELETE, SELECT 访问频次：
`SHOW GLOBAL STATUS LIKE 'Com_______';` 或者 `SHOW SESSION STATUS LIKE 'Com_______';`
例：`show global status like 'Com_______'`

```mysql
-- 用于统计服务器执行的各种 SQL 操作的次数，例如 Com_select 表示执行 SELECT 语句的次数。
show global status like 'Com_______';
```

分析当前数据库是以（插入，删除，查询）为主

#### 2.5.2 慢查询日志

慢查询日志记录了所有执行时间超过指定参数（long_query_time，单位：秒，默认 10 秒）的所有 SQL 语句的日志。
MySQL 的慢查询日志默认没有开启，需要在 MySQL 的配置文件（/etc/my.cnf）中配置如下信息：

```mysql
# 查询 MySQL 慢查询日志（Slow Query Log）的相关配置状态。
show variables like 'slow_query_log%';

# 如果不显式指定慢查询日志的文件路径，默认的存储规则如下：
# 默认位置通常在 /var/lib/mysql/ 目录下。
# 文件名默认为 主机名-slow.log。既然你提到的是 localhost-slow.log，那么：
# 完整路径： 通常是 /var/lib/mysql/localhost-slow.log
# 如何确认： 你可以登录 MySQL 后执行以下 SQL 语句，直接查询系统当前认定的具体路径
show variables like 'slow_query_log_file';
```

- 查看慢查询日志，寻找哪些查询的查询时间较长，经行优化

```bash
# 开启慢查询日志开关
slow_query_log=1
# 设置慢查询日志的时间为2秒，SQL语句执行时间超过2秒，就会视为慢查询，记录慢查询日志
long_query_time=2
```

更改后记得重启 MySQL 服务，`systemctl restart mysqld`

日志文件位置：`/var/lib/mysql/localhost-slow.log` (一般情况下)

#### 2.5.3 profile

show profile 能在做 SQL 优化时帮我们了解时间都耗费在哪里。

```mysql
# 通过 have_profiling 参数，能看到当前 MySQL 是否支持 profile 操作：
-- 查看当前MySQL是否支持profile操作
SELECT @@have_profiling;

# profiling 默认关闭，可以通过set语句在session/global级别开启 profiling：
-- 查看当前profile是否开启
select @@profiling;

-- 开启profile操作
set profiling = 1;

# 查看所有语句的耗时：
show profiles;

# 查看指定query_id的SQL语句各个阶段的耗时：
-- 注意：这里的 query_id 是一个占位符，直接运行会报错。
-- 你需要先运行 show profiles 查看 Query_ID，然后将其替换为具体的数字（例如 1）。
-- show profile for query query_id;
show profile for query 40;

# 查看指定query_id的SQL语句CPU的使用情况
show profile cpu for query 40;
```

**Tips**: 在这里你可以执行**聚集索引与二级索引**的查询语句，直观的感受他们查询的耗时情况。

#### 2.5.4 explain

EXPLAIN 或者 DESC 命令获取 MySQL 如何执行 SELECT 语句的信息，包括在 SELECT 语句执行过程中表如何连接和连接的顺序。
语法：
`# 直接在select语句之前加上关键字 explain / desc`
`EXPLAIN SELECT 字段列表 FROM 表名 WHERE 条件;`

```mysql
-- 查询表 tb_user 中 id 为 1 的记录。
select * from tb_user where id = 1;

-- 使用 EXPLAIN 分析 SQL 查询的执行计划，查看索引使用情况和查询效率。
explain select * from tb_user where id = 1;

-- 使用 DESC 查看表 tb_user 的结构信息。
desc select * from tb_user where id = 1;
```

| 字段名           | 含义       | 详细说明                                                     |
| :--------------- | :--------- | :----------------------------------------------------------- |
| **id**           | 查询序列号 | 表示查询中执行 select 子句或者操作表的顺序。<br>• **id 相同**：执行顺序从上到下<br>• **id 不同**：值越大越先执行 |
| **select_type**  | 查询类型   | • **SIMPLE**：简单表（不使用表连接或子查询）<br>• **PRIMARY**：主查询（外层的查询）<br>• **UNION**：UNION 中的第二个或后面的查询语句<br>• **SUBQUERY**：SELECT/WHERE 之后包含了子查询 |
| **type**         | 连接类型   | 性能由好到差依次为：<br>`NULL` > `system` > `const` > `eq_ref` > `ref` > `range` > `index` > `all` |
| **possible_key** | 可能的索引 | 可能应用在这张表上的索引，一个或多个。                       |
| **Key**          | 实际索引   | 实际使用的索引。如果为 `NULL`，则没有使用索引。              |
| **Key_len**      | 索引长度   | 表示索引中使用的字节数。该值为索引字段最大可能长度，并非实际使用长度。在不损失精确性的前提下，长度越短越好。 |
| **rows**         | 扫描行数   | MySQL 认为必须要执行查询的行数。在 InnoDB 引擎中，这是一个估计值，可能并不总是准确的。 |
| **filtered**     | 过滤比例   | 表示返回结果的行数占需读取行数的百分比。`filtered` 的值越大越好。 |

**id 字段详细展示**

[student course相关建表语句](https://moyan726.github.io/data-analytics-notes/SQL/MySQL_Base_ITcase/Base/BasicChapter/#_34)

```mysql
select s.*, c.*
from student s,
     course c,
     student_course sc
where s.id = sc.studentid
  and c.id = sc.courseid
  and c.id = sc.courseid;

# explain id 值相同，从上到下执行
explain select s.*, c.*
from student s,
     course c,
     student_course sc
where s.id = sc.studentid
  and c.id = sc.courseid
  and c.id = sc.courseid;
```

 `EXPLAIN` 关键字告诉 MySQL 不要真正执行这条查询并返回数据，而是返回该查询的**执行计划**。这用于分析 SQL 性能，比如是否用到了索引、表的读取顺序等。

*   查询涉及 `student` (s), `course` (c), `student_course` (sc) 三张表。
*   结果中三行的 `id` 均为 **1**。
*   这意味着这三张表的加载优先级是一样的。
*   MySQL 优化器决定按照结果列表中的顺序来执行：先加载 `s` 表，再与 `sc` 表关联，最后与 `c` 表关联。

当没有子查询嵌套时，MySQL 会将所有表的执行 `id` 设为相同，并按照优化器认为最高效的顺序，从上往下依次读取并关联这些表。

```mysql
# explain id 值不相同，从大到小执行
-- 操作示例：查询选修了MySQL的学生信息
select id from course c where c.name = 'MySQL';
select studentid from student_course sc where sc.courseid = 3;
select  * from student s where s.id in (1,2);

select  * from student s where s.id in (select studentid from student_course sc where sc.courseid = (select id from course c where c.name = 'MySQL'));

explain select  * from student s where s.id in (select studentid from student_course sc where sc.courseid = (select id from course c where c.name = 'MySQL'));
```

 `EXPLAIN` 在**包含子查询（Subquery）**情况下的执行计划规则，重点在于 **`id` 值不同时的执行顺序**。

**`EXPLAIN` 结果预期**：执行最后一句 `EXPLAIN` 时，你会在结果中看到三行记录，`id` 分别为 3、2、1：

*   **id = 3**：对应 `course` 表（最内层），**最先执行**。
*   **id = 2**：对应 `student_course` 表（中间层），利用内层结果执行。
*   `subquery2`表示第二个子查询
*   **id = 1**：对应 `student` 表（最外层），**最后执行**。

**子查询**是从里向外执行的，`id` 越大越先执行。

---

**EXPLAIN `type` 字段详解**

```mysql
# NULL: 查询执行不需要访问任何表。直接返回结果
explain select 'A';
# 备注: 业务系统中的 SQL 很难优化到此级别。

# system:访问系统表时通常会出现此类型，属于 const 的特例。

-- type类型 const:  通过主键或唯一索引进行等值查询时出现，因为只匹配一行数据，所以速度很快。
explain select * from tb_user where id = 1;

# ref: 使用非唯一性索引进行等值查询时出现。
explain select * from tb_user where name = '白起';
```

**1. 性能排序（由高到低）**
`NULL` > `system` > `const` > `eq_ref` > `ref` > `range` > `index` > `ALL`

**2. 常见类型说明**

*   **NULL**:
    *   **含义**: 查询执行不需要访问任何表。
    *   **示例**: `explain select 'a';` —— 直接返回结果，不涉及表查询，性能最高。
    *   **备注**: 业务系统中的 SQL 很难优化到此级别。

*   **system**:
    *   **含义**: 访问系统表时通常会出现此类型，属于 `const` 的特例。

*   **const**:
    *   **含义**: 通过**主键**或**唯一索引**进行等值查询时出现，因为只匹配一行数据，所以速度很快。
    *   **示例**: `explain select * from tb_user where phone = '17799990000';` （假设 phone 字段有唯一索引）。

*   **ref**:
    *   **含义**: 使用**非唯一性索引**进行等值查询时出现。
    *   **示例**: `explain select * from tb_user where name = '白起';` （假设 name 字段有普通索引，不唯一）。

*   **index**:
    *   **含义**: 使用了索引，但需要扫描遍历整个索引树。
    *   **性能**: 比 `ALL` 快，但效率依然不算高。

*   **ALL**:
    *   **含义**: 全表扫描（Full Table Scan），不使用索引。
    *   **性能**: 效率最低。

**3. 优化建议**

*   在优化 SQL 语句时，应尽量让 `type` 的指标向前靠拢。
*   尽量避免出现 `ALL`（全表扫描）。
*   尽量避免出现 `index`（全索引扫描），虽然比全表扫描稍好，但性能仍不理想。

---

**索引对于查询效率的提示**

```mysql
# 查看导入的1999609条数据
select count(*) from tb_sku;

select * from tb_sku where id = 1;
-- 通过主键id查询 存在索引 查询速度快

select * from tb_sku where sn = 100000003145001;
-- 没有 index 查询速度慢

-- 查看 tb_sku 表的索引信息。
show index from tb_sku;

-- 为 sn 字段创建索引来提升查询性能:
CREATE INDEX idx_sku_sn ON tb_sku(sn);
-- 耗时原因：扫描全表读取 sn 列的所有值，对这些值进行排序，构建 B+Tree 索引结构

-- 查看 tb_sku 表的索引信息，确保索引已创建:
-- 再次执行查询语句，观察查询性能的提升:
select * from tb_sku where sn = 100000003145001;

-- 使用 EXPLAIN 分析 SQL 查询的执行计划，查看索引使用情况和查询效率。
explain select * from tb_sku where sn = 1000000031450014;
```

### 2.6 使用规则

#### 2.6.1 最左前缀法则

如果索引关联了多列（联合索引），要遵守最左前缀法则，最左前缀法则指的是查询从索引的最左列开始，并且不跳过索引中的列。
**如果跳跃某一列，索引将部分失效（后面的字段索引失效）。**

```mysql
-- 23进阶-索引-
-- 查询 tb_user 表的索引信息,
show index from tb_user;

-- 查询 profession = '软件工程' and age = 35 and status = '0' 的记录
select * from tb_user where profession = '软件工程' and age = 35 and status = '0';

-- 使用 EXPLAIN 分析 SQL 查询的执行计划，查看索引使用情况和查询效率。
explain select * from tb_user where profession = '软件工程' and age = 35 and status = '0';

-- 生效规则(最左前缀原则)
-- 删除 status 条件后查询
explain select * from tb_user where profession = '软件工程' and age = 35 ;

-- 此时不满足最左前缀原则，联合索引无法生效，全表扫描
explain select * from tb_user where  age = 35 and status = '0';
-- 最左边的列不存在 索引失效

-- 删除 age 条件后查询，仍然走索引，
explain select * from tb_user where profession = '软件工程'and status = '0';
-- 也就是说：如果跳跃某一列，索引将部分失效（后面的字段索引失效）
```

```mysql
-- 条件的书写顺序会影响索引的使用吗？
explain select * from tb_user where age = 35 and status = '0' and  profession = '软件工程' ;
-- MySQL 优化器会重排条件顺序，条件的书写顺序不重要,只要包含了索引的最左字段(profession)即可
```

联合索引中，出现范围查询（<, >），范围查询右侧的列索引失效(**这是 B+Tree 索引结构的特性决定的**)。可以用>=或者<=来规避索引失效问题。

```mysql
-- 联合索引中，出现范围查询（<, >），范围查询右侧的列索引失效
explain select * from tb_user where profession = '软件工程' and age > 25 and status = '0';

-- 如果业务允许,改为:
explain select * from tb_user WHERE profession = '软件工程' AND age >= 26 AND status = '0'
```

#### 2.6.2 索引失效情况

1.  在索引列上进行运算操作，索引将失效
2.  字符串类型字段使用时，不加引号，索引将失效。此处 phone 的值没有加引号
3.  模糊查询中，如果仅仅是尾部模糊匹配，索引不会是失效；如果是头部模糊匹配，索引失效。前后都有 % 也会失效。
4.  用 or 分割开的条件，如果 or 其中一个条件的列没有索引，那么涉及的索引都不会被用到。
5.  如果 MySQL 评估使用索引比全表更慢，则不使用索引。

```mysql
-- 24.进阶-索引-使用规则-索引失效的情况
# 1. 在索引列上进行运算操作，索引将失效。
explain select * from tb_user where substring(phone, 10, 2) = '15';
-- 全表扫描 索引没有被使用

# 2. 字符串类型字段使用时，不加引号，索引将失效。
explain select * from tb_user where phone = 17799990015;
-- 字符串不加单引号，存在隐式类型转化 索引失效 全表扫描

# 3. 模糊查询中，如果仅仅是尾部模糊匹配，索引不会是失效；如果是头部模糊匹配，索引失效。
explain select * from tb_user where profession like '软件%'; -- 尾部模糊匹配
explain select * from tb_user where profession like '%工程'; -- 头部模糊匹配
-- 在大数据查询时，应规避头部模糊匹配，避免全表扫描，影响查询效率。

# 4. 用 or 分割开的条件，如果 or 其中一个条件的列没有索引，那么涉及的索引都不会被用到。
-- id有索引 age没有索引, 所以整个语句不会使用索引
explain select * from tb_user where id =10 or age =23;
-- phone有索引 age没有索引, 所以整个语句不会使用索引
explain select * from tb_user where phone  ='17799990001' or age =34;
-- 为age创建索引后
create index idx_user_age on tb_user(age);

# 5. 如果 MySQL 评估使用索引比全表更慢，则不使用索引。
-- 走 phone 的索引
explain select * from tb_user where phone >= '17799990020';
-- 全表扫描
explain select * from tb_user where phone >= '17799990000';
# MySQL 优化器的智能选择
# 使用索引的成本：1.读取索引树 2.回表查询获取完整数据 3.当匹配行数过多时,回表次数过多,成本高
# 全表扫描的成本：1.顺序读取数据页 2.当匹配大部分数据时,全表扫描更高效

```

#### 2.6.3 SQL 提示

是优化数据库的一个重要手段，简单来说，就是在 SQL 语句中加入一些人为的提示来达到优化操作的目的。

`use` 是建议，实际使用哪个索引 MySQL 还会自己权衡运行速度去更改，`force` 就是无论如何都强制使用该索引。

```mysql
-- 26.进阶-索引-使用规则-SQL提示
-- 符合最左前缀原则的联合索引
explain select * from tb_user where profession = '软件工程';

-- 对于profession字段创建单列索引
create index idx_user_pro on tb_user(profession);

-- 此时表中有两个profession的索引，联合索引和单列索引
explain select * from tb_user where profession = '软件工程';
-- MySQL 优化器会选择最优的索引进行查询 即联合索引

-- 使用索引：  use index(索引名)
explain select * from tb_user use index(idx_user_pro) where profession='软件工程';
-- 不使用哪个索引：ignore index(索引名)
explain select * from tb_user ignore index(idx_user_pro) where profession='软件工程';
-- 必须使用哪个索引：force index(索引名)
explain select * from tb_user force index(idx_user_pro) where profession='软件工程';
```

#### 2.6.4 覆盖索引&回表查询

尽量使用覆盖索引（查询使用了索引，并且需要返回的列，在该索引中已经全部能找到），减少 `select *`。

explain 中 extra 字段含义：
`using index condition`：查找使用了索引，但是需要回表查询数据
`using where; using index;`：查找使用了索引，但是需要的数据都在索引列中能找到，所以不需要回表查询

```mysql
-- 27.进阶-索引-使用规则-覆盖索引&回表查询
-- 查询 tb_user 表中的所有索引
show index from tb_user;

-- 删除冗余的索引
drop index idx_user_age on tb_user;
drop index idx_user_pro on tb_user;

-- 符合最左前缀原则的联合索引
explain select * from tb_user where profession = '软件工程' and age = 35 and status = '0';


explain select id,profession,age from tb_user where profession = '软件工程' and age = 35 and status = '0';
explain select id,profession,age,status from tb_user where profession = '软件工程' and age = 35 and status = '0';
explain select id,profession,age,status,name from tb_user where profession = '软件工程' and age = 35 and status = '0';
-- Extra列显示 Using index，表示使用了覆盖索引，避免了回表查询，提高了查询效率。
-- id,profession,age,status 二级索引的叶子节点下包含id值，不需要回表查询即可获取id值(覆盖索引)
-- id,profession,age,status,name。name字段不在联合索引中，必须回表查询获取name值
```

如果在聚集索引中直接能找到对应的行，则直接返回行数据，只需要一次查询，哪怕是 `select *`；如果在辅助索引中找聚集索引，如 `select id, name from xxx where name='xxx';`，也只需要通过辅助索引(name)查找到对应的 id，返回 name 和 name 索引对应的 id 即可，只需要一次查询；如果是通过辅助索引查找其他字段，则需要回表查询，如 `select id, name, gender from xxx where name='xxx';`

所以尽量不要用 `select *`，容易出现回表查询，降低效率，除非有联合索引包含了所有字段

==【面试题】==：**一张表，有四个字段（id, username, password, status），由于数据量大，需要对以下 SQL 语句进行优化，该如何进行才是最优方案**：
`select id, username, password from tb_user where username='itcast';`

**解**：给 username 和 password 字段建立联合索引，则不需要回表查询，直接覆盖索引

利用 **覆盖索引 (Covering Index)** 来消除 **回表 (Back-table Lookup)** 操作，从而减少 I/O 次数。

#### 2.6.5 前缀索引

当字段类型为字符串（varchar, text 等）时，有时候需要索引很长的字符串，这会让索引变得很大，查询时，浪费大量的磁盘 IO，影响查询效率，此时可以只降字符串的一部分前缀，建立索引，这样可以大大节约索引空间，从而提高索引效率。

语法：`create index idx_xxxx on table_name(columnn(n));`
前缀长度：可以根据索引的选择性来决定，而选择性是指不重复的索引值（基数）和数据表的记录总数的比值，索引选择性越高则查询效率越高，唯一索引的选择性是 1，这是最好的索引选择性，性能也是最好的。
求选择性公式：

```mysql
-- 28.进阶-索引-使用规则- 前缀索引
    -- 建立前缀索引 (Prefix Index) 的评估阶段。
-- 查询 tb_user 表中的所有数据个数
select count(*) from tb_user ;

-- 统计 email 字段不为 NULL 的记录数
select count(email) from tb_user;
-- 统计 email 字段中不重复（去重后）的值的数量。
select count(distinct  email) from tb_user;
-- 计算 索引选择性 (Index Selectivity)。公式：不重复的索引值数量 / 表的总记录数
select count(distinct  email)/count(*) from tb_user;
-- 算出截取不同长度的选择性
select count(distinct  substring(email,1,5)) /count(*) from tb_user;

--  前缀索引的命名规则 推荐格式：idx_表名_列名_长度
-- 为 email 字段创建前缀索引，索引长度为前 5 个字符
create index idx_user_email_5 on tb_user (email(5));

show index from tb_user;
-- Sub_part为5 截取前五个字符建立索引

-- 此时explain可以看到使用了前缀索引
explain select * from tb_user where email = 'daqiao666@163.com';

```

show index 里面的 sub_part 可以看到接取的长度

**使用前缀索引进行精确匹配查询（如 `=` 操作）时，极大概率（基本上）会发生回表查询。**

即使你查询的 SELECT 字段只有 id（例如 `select id from ...`），为了验证 `where` 条件中的剩余字符是否匹配，MySQL 也不得不回表读取完整的列数据。因为前缀索引丢失了后缀信息，无法确信索引中的记录就是你真正要找的那条。

 **前缀索引查询的逻辑流程**

假设你有索引 `idx_user_email_5(email(5))`，并且执行 SQL：
`select * from tb_user where email = 'daqiao666@163.com';`

执行步骤如下：

1.  **提取搜索前缀**
    MySQL 截取搜索条件 `'daqiao666@163.com'` 的前 5 个字符，即 `'daqia'`。

2.  **搜索二级索引（前缀索引树）**
    MySQL 到 `idx_user_email_5` 的 B+ 树中查找 `'daqia'`。

3.  **获取主键 ID**
    假设在索引树中找到了一个节点，其值为 `'daqia'`，对应的主键 ID 为 `1`。
    *   *此时 MySQL 并不确定这行数据的完整 email 是什么，它只知道前 5 位匹配。*

4.  **回表（Back-table Lookup）**
    拿着 ID `1`，去 **主键索引（聚簇索引）** 中查找完整的行记录。

5.  **真值验证（对比）**
    取出完整行记录中的 `email` 字段完整值（例如 `'daqiao666@163.com'`），与 SQL 语句中的原始条件（`'daqiao666@163.com'`）进行完全比对。
    *   **匹配成功**：将该行放入结果集。
    *   **匹配失败**：例如取出的行是 `'daqia_other@163.com'`（前缀也是 'daqia'），则丢弃该行。

6.  **循环查找**
    返回二级索引树，寻找**下一个** `'daqia'` 节点，重复 3~5 步，直到二级索引中不再是 `'daqia'` 为止。

**总结**

这就是为什么前缀索引无法实现 **覆盖索引 (Covering Index)** 的原因。

*   **普通联合索引**：树里存了完整的字段值，所以可以直接确认“这就是你要找的人”，并直接返回。
*   **前缀索引**：树里只存了残缺的字段值，它只能告诉你“这个人**可能**是你要找的人”，必须回表看一眼“真身”才能确认。

#### 2.6.6 单列索引&联合索引

单列索引：即一个索引只包含单个列
联合索引：即一个索引包含了多个列
在业务场景中，如果存在多个查询条件，考虑针对于查询字段建立索引时，建议建立联合索引，而非单列索引。

单列索引情况：
`explain select id, phone, name from tb_user where phone = '17799990010' and name = '韩信';`
这句只会用到 phone 索引字段

**注意事项:**

- 多条件联合查询时，MySQL 优化器会评估哪个字段的索引效率更高，会选择该索引完成本次查询
- 创建联合索引时务必考虑顺序

```mysql
-- 29.进阶-索引-使用规则-单列索引&联合索引
-- 查询 tb_user 表中的所有索引
show index from tb_user;

-- 涉及到两个索引idx_user_phone,idx_user_name，但是最后只使用了idx_user_phone索引
explain select id,phone,name from tb_user where phone = '17799990001' and name = '曹操';
-- 所以会发生回表查询

-- 创建联合索引idx_user_phone_name
create unique index  idx_user_phone_name on tb_user(phone, name);

-- 可能使用的所以有3个，但是MySQL只走了idx_user_phone
explain select id,phone,name from tb_user where phone = '17799990001' and name = '曹操';
-- 此时Extra列显示 null，表示使用回表查询

-- 使用联合索引idx_user_phone_name
explain select id,phone,name from tb_user use index(idx_user_phone_name)where phone = '17799990001' and name = '曹操';
-- 此时Extra列显示 Using index，表示使用了覆盖索引，避免了回表查询
```

### 2.7 设计原则

1. 针对于数据量较大，且查询比较频繁的表建立索引
2. 针对于常作为查询条件（where）、排序（order by）、分组（group by）操作的字段建立索引
3. 尽量选择区分度高的列作为索引，尽量建立唯一索引，区分度越高，使用索引的效率越高
4. 如果是字符串类型的字段，字段长度较长，可以针对于字段的特点，建立前缀索引
5. 尽量使用联合索引，减少单列索引，查询时，联合索引很多时候可以覆盖索引，节省存储空间，避免回表，提高查询效率
6. 要控制索引的数量，索引并不是多多益善，索引越多，维护索引结构的代价就越大，会影响增删改的效率
7. 如果索引列不能存储 NULL 值，请在创建表时使用 NOT NULL 约束它。当优化器知道每列是否包含 NULL 值时，它可以更好地确定哪个索引最有效地用于查询

---

## 修改清单

| 修改位置 | 原内容 | 修改后内容 | 修改理由 |
| :--- | :--- | :--- | :--- |
| **全文** | (无统一编号) | 增加 1.1, 1.2, 2.1 等层级编号 | 优化文档结构，提升可读性 |
| **1.3.1 InnoDB** | `innodb_file_per_table(MySQL8.0以后默认打开)` | `innodb_file_per_table` (MySQL 8.0 以后默认打开) | 增加空格，优化排版 |
| **2.2.3 Hash** | `betwwn` | `between` | 修正拼写错误 |
| **2.5.4 explain** | `HWERE` | `WHERE` | 修正拼写错误 |
| **2.6.2 索引失效** | `betwwn` (隐含) | `between` | 修正拼写错误 |
| **2.6.3 SQL提示** | `use` / `force` | `use` / `force` (增加代码格式) | 优化排版 |
| **2.6.6 单列索引** | `注意事项` (无标题) | `**注意事项:**` | 增加标题强调 |



## SQL 优化

### 插入数据

普通插入：

1. 采用批量插入（一次插入的数据不建议超过1000条）
2. 手动提交事务
3. 主键顺序插入

大批量插入：
如果一次性需要插入大批量数据，使用insert语句插入性能较低，此时可以使用MySQL数据库提供的load指令插入。

```
# 客户端连接服务端时，加上参数 --local-infile（这一行在bash/cmd界面输入）
mysql --local-infile -u root -p
# 设置全局参数local_infile为1，开启从本地加载文件导入数据的开关
set global local_infile = 1;
select @@local_infile;
# 执行load指令将准备好的数据，加载到表结构中
load data local infile '/root/sql1.log' into table 'tb_user' fields terminated by ',' lines terminated by '\n';
```

### 主键优化

数据组织方式：在InnoDB存储引擎中，表数据都是根据主键顺序组织存放的，这种存储方式的表称为索引组织表（Index organized table, IOT）

页分裂：页可以为空，也可以填充一般，也可以填充100%，每个页包含了2-N行数据（如果一行数据过大，会行溢出），根据主键排列。
页合并：当删除一行记录时，实际上记录并没有被物理删除，只是记录被标记（flaged）为删除并且它的空间变得允许被其他记录声明使用。当页中删除的记录到达 MERGE_THRESHOLD（默认为页的50%），InnoDB会开始寻找最靠近的页（前后）看看是否可以将这两个页合并以优化空间使用。

MERGE_THRESHOLD：合并页的阈值，可以自己设置，在创建表或创建索引时指定

> 文字说明不够清晰明了，具体可以看视频里的PPT演示过程：https://www.bilibili.com/video/BV1Kr4y1i7ru?p=90

主键设计原则：

- 满足业务需求的情况下，尽量降低主键的长度
- 插入数据时，尽量选择顺序插入，选择使用 AUTO_INCREMENT 自增主键
- 尽量不要使用 UUID 做主键或者是其他的自然主键，如身份证号
- 业务操作时，避免对主键的修改

### order by优化

1. Using filesort：通过表的索引或全表扫描，读取满足条件的数据行，然后在排序缓冲区 sort buffer 中完成排序操作，所有不是通过索引直接返回排序结果的排序都叫 FileSort 排序
2. Using index：通过有序索引顺序扫描直接返回有序数据，这种情况即为 using index，不需要额外排序，操作效率高

如果order by字段全部使用升序排序或者降序排序，则都会走索引，但是如果一个字段升序排序，另一个字段降序排序，则不会走索引，explain的extra信息显示的是`Using index, Using filesort`，如果要优化掉Using filesort，则需要另外再创建一个索引，如：`create index idx_user_age_phone_ad on tb_user(age asc, phone desc);`，此时使用`select id, age, phone from tb_user order by age asc, phone desc;`会全部走索引

总结：

- 根据排序字段建立合适的索引，多字段排序时，也遵循最左前缀法则
- 尽量使用覆盖索引
- 多字段排序，一个升序一个降序，此时需要注意联合索引在创建时的规则（ASC/DESC）
- 如果不可避免出现filesort，大数据量排序时，可以适当增大排序缓冲区大小 sort_buffer_size（默认256k）

### group by优化

- 在分组操作时，可以通过索引来提高效率
- 分组操作时，索引的使用也是满足最左前缀法则的

如索引为`idx_user_pro_age_stat`，则句式可以是`select ... where profession order by age`，这样也符合最左前缀法则

### limit优化

常见的问题如`limit 2000000, 10`，此时需要 MySQL 排序前2000000条记录，但仅仅返回2000000 - 2000010的记录，其他记录丢弃，查询排序的代价非常大。
优化方案：一般分页查询时，通过创建覆盖索引能够比较好地提高性能，可以通过覆盖索引加子查询形式进行优化

例如：

```
-- 此语句耗时很长
select * from tb_sku limit 9000000, 10;
-- 通过覆盖索引加快速度，直接通过主键索引进行排序及查询
select id from tb_sku order by id limit 9000000, 10;
-- 下面的语句是错误的，因为 MySQL 不支持 in 里面使用 limit
-- select * from tb_sku where id in (select id from tb_sku order by id limit 9000000, 10);
-- 通过连表查询即可实现第一句的效果，并且能达到第二句的速度
select * from tb_sku as s, (select id from tb_sku order by id limit 9000000, 10) as a where s.id = a.id;
```

### count优化

MyISAM 引擎把一个表的总行数存在了磁盘上，因此执行 count(*) 的时候会直接返回这个数，效率很高（前提是不适用where）；
InnoDB 在执行 count(*) 时，需要把数据一行一行地从引擎里面读出来，然后累计计数。
优化方案：自己计数，如创建key-value表存储在内存或硬盘，或者是用redis

count的几种用法：

- 如果count函数的参数（count里面写的那个字段）不是NULL（字段值不为NULL），累计值就加一，最后返回累计值
- 用法：count(*)、count(主键)、count(字段)、count(1)
- count(主键)跟count(*)一样，因为主键不能为空；count(字段)只计算字段值不为NULL的行；count(1)引擎会为每行添加一个1，然后就count这个1，返回结果也跟count(*)一样；count(null)返回0

各种用法的性能：

- count(主键)：InnoDB引擎会遍历整张表，把每行的主键id值都取出来，返回给服务层，服务层拿到主键后，直接按行进行累加（主键不可能为空）
- count(字段)：没有not null约束的话，InnoDB引擎会遍历整张表把每一行的字段值都取出来，返回给服务层，服务层判断是否为null，不为null，计数累加；有not null约束的话，InnoDB引擎会遍历整张表把每一行的字段值都取出来，返回给服务层，直接按行进行累加
- count(1)：InnoDB 引擎遍历整张表，但不取值。服务层对于返回的每一层，放一个数字 1 进去，直接按行进行累加
- count(*)：InnoDB 引擎并不会把全部字段取出来，而是专门做了优化，不取值，服务层直接按行进行累加

按效率排序：count(字段) < count(主键) < count(1) < count(*)，所以尽量使用 count(*)

### update优化（避免行锁升级为表锁）

InnoDB 的行锁是针对索引加的锁，不是针对记录加的锁，并且该索引不能失效，否则会从行锁升级为表锁。

如以下两条语句：
`update student set no = '123' where id = 1;`，这句由于id有主键索引，所以只会锁这一行；
`update student set no = '123' where name = 'test';`，这句由于name没有索引，所以会把整张表都锁住进行数据更新，解决方法是给name字段添加索引

## 视图/存储过程/触发器

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/%E8%A7%86%E5%9B%BE%E7%AD%89%E5%86%85%E5%AE%B9%E7%9A%84%E6%80%BB%E7%BB%93.png)

### 视图

视图(View)是一种虚拟存在的表。视图中的数据并不在数据库中实际存在，行和列数据来自定义视图的查询中使用的表，并且是在使用视图时动态生成的。

通俗的讲，视图只保存了查询的SQL逻辑，不保存查询结果。所以我们在创建视图的时候，主要的工作就落在创建这条SQL查询语句上。

#### 语法

创建视图：
`CREATE [OR REPLACE] VIEW 视图名称(列名列表)】AS SELECT语句[WITH[CASCADED|LOCAL] CHECK OPTION]`

查询视图：
查看创建视图语句：`SHOW CRETE VIEW 视图名称;`
查看视图数据：`查看视图数据:SELECT*FROM 视图名称…;`

修改视图：
方式一：
`CREATE [OR REPLACE]VIEW 视图名称(列名列表)AS SELECT语句[WITH[CASCADEDLLOCAL] CHECK OPTION`
方式二：
`ALTER VEW 视图名称(列名列表)AS SELECT语句[WITH[CASCADED|LOCAL]CHECK OPTION]`

删除视图：
`DROP VIEW [IF EXISTS]视图名称[,视图名称]`

```
-- 创建视图
create or replace view stu_v_1 as select id, name from student where id <= 10;

-- 查询视图
show create view stu_v_1;
select * from stu_v_1;

-- 修改视图
create or replace view stu_v_1 as select id, name, no from student where id <= 10;
alter view stu_v_1 as select id, name from student where id <= 10;

-- 删除视图
drop view if exists stu_v_1;/*  */
```

#### 检查选项

**视图的检查选项：**

当使用WITH CHECK OPTION子句创建视图时，MySOL会通过视图检查正在更改的每个行，例如 插入，更新，删除，以使其符合视图的定义。MVSOL允许基于另一个视图创建视图，它还会检查依赖视图中的规则以保持一致性。

为了确定检查的范围，mysql 提供了两个选项:CASCADED 和 LOCAL，默认值为CASCADED。

**cascaded：**在对创建时含有该字段的视图，插入数据时，该视图依赖的视图都会加上检查，需要**所有条件**都满足才能够插入成功。

**local：**在对创建时含有该字段的视图，插入数据时，对于该视图依赖的视图中**含有检查语句的条件**进行检查判断。

#### 更新及作用

**视图的更新：**

要使视图可更新，视图中的行与基础表中的行之间**必须存在一对一的关系**。

如果视图包含以下任何一项，则该**视图不可更新**：

1. 聚合函数或窗口函数(SUM()、MIN()、MAX()、COUNT()等
2. DISTINCT
3. GROUP BY
4. HAVINGA
5. UNION 或者 UNION ALL

**作用：**

- **简单**
  视图不仅可以简化用户对数据的理解，也可以简化他们的操作。那些被经常使用的查询可以被定义为视图，从而使得用户不必为以后的操作每次指定全部的条件。
- **安全**
  数据库可以授权，但不能授权到数据库特定行和特定的列上。通过视图用户只能查询和修改他们所能见到的数据。
- **数据独立**
  视图可帮助用户屏蔽真实表结构变化带来的影响。

#### 案例

```
-- 1.为了保证数据库表的安全性，开发人员在操作tb_user表时，只能看到的用户的基本字段，屏蔽手机号和邮箱两个字段。
create view tb user view as select id,name,profession, age,gender,status,createtime from tb_user;
select *from tb user view;

-- 2.查询每个学生所选修的课程（三张表联查），这个功能在很多的业务中都有使用到，为了简化操作，定义一个视图。
create view tb_stu_course_view 
select s.name student_name, s.no student_no, c.name course_name 
from student s, stuent_course sc, course c 
where s.id = sc.studentid and sc.courseid = c.id;

-- 以后每次只需要进行查询视图即可
select * from tb_stu_course_view;
```

### 存储过程

存储过程其实就类似 java，c 这种语言，这一部分可以通过文档快速学习，不懂的再回过头看视频。

存储过程是事先经过编译并存储在数据库中的一段 SQL语句的集合，调用存储过程可以简化应用开发人员的很多工作，减少数据在数据库和应用服务器之间的传输，对于提高数据处理的效率是有好处的。

存储过程思想上很简单，就是数据库 SOL语言层面的代码封装与重用。

**特点：**

- 封装，复用
- 可以接收参数，也可以返回数据
- 减少网络交互，效率提升

#### 基本语法

```
查看视图数据:SELECT*FROM 视图名称…;
```

**查看：**

```
SELECT* FROM INFORMATION SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA='xx';--查询数据库的存储过程及状态信息`
`SHOW CREATE PROCEDURE 存储过程名称;--查询某个存储过程的定义
```

**删除：**

```
DROP PROCEDURE [IF EXISTS]存储过程名称;
```

案例：

```
-- 存储过程基本语法
-- 创建
create procedure p1()
begin
  select count(*)from student;
end;

-- 调用
call p1();

-- 查看
select * from information_schema.ROUTINES where ROUTINE_SCHEMA = 'itcast';
show create procedure p1;

-- 删除
drop procedure if exists p1;
```

#### 变量

##### 系统变量

系统变量 是MySQL服务器提供，不是用户定义的，属于服务器层面。分为全局变量(GLOBAL)、会话变量(SESSION)。

查看系统变量

```
SHOW [SESSION |GLOBAL] VARIABLES ; --查看所有系统变量`
`SHOW[SESSION|GLOBAL] VARIABLES LIKE'; --可以通过LKE模糊匹配方式查找变量`
`SELECT @@[SESSION|GLOBAL]系统变量名; -- 查看指定变量的值
-- 变量：系统变量
-- 查看系统变量
show session variables;
show session variables like 'auto%';
show glabal variables like 'auto%';
select @@global.autocommit;

-- 设置系统变量
set session autocommit = 1;
insert intto course(id, name) values (6, 'ES');
set global auto commit = 0;
```

**注意：**

- 如果没有指定 session / global，默认 session，会话变量
- myesql 服务器重启之后，所设置的全局参数会失效，要想不失效，需要更改/etc/my.cnf 中的配置。

##### 用户定义变量

用户定义变量 是用户根据需要自己定义的变量，用户变量不用提前声明，在用的时候直接用“@变量名”使用就可以。其作用域为当前连接。

**赋值：**

```
SET @var name = expr [, @var_name = expr]...;`
`SET @var name := expr [, @var_name := expr]...;
SELECT @var name := expr , @var name := expr ...;`
`SELECT 字段名 INTO @var_name FROM 表名;
```

**使用：**

```
SELECT @var_name;
```

案例：

```
-- 变量：用户变量
-- 赋值
set @myname = 'itcast';
set @myage := 10;

select @mycolor := 'red';
select count(*) into @mycount from tb_user;

-- 使用
select @myname, @myage, @mycolor, @mycount;

select @abc; -- 输出为NULL
```

**注意：**

用户定义的变量无需对其进行声明或者初始化，只不过获取到的值为 NULL。

##### 局部变量

局部变量 是根据需要定义的在局部生效的变量，访问之前，需要DECLARE声明。可用作存储过程内的局部变量和输入参数，局部变量的范围是在其内声明的BEGIN .. END块。

**声明：**

```
DECLARE 变量名 变量类型 [DEFAULT..];
```

变量类型就是数据库字段类型:INT、BIGINT、CHAR、VARCHAR、DATE、TIME等。

**赋值：**

```
SET 变量名=值;
SET 变量名:=值;
SELECT 字段名 INTO 变量名 FROM 表名 ...;
```

案例：

```
-- 变量：局部变量
-- 声明 - declare
-- 赋值 -
create procedure p2()
begin
  declare stu_count int default 0;
  select count(*) into stu_count from student;
  select stu_count;
end;

call p2();
```

#### if 判断

语法：

```
IF 条件1 THEN
        ...
ELSEIF 条件2 THEN -- 可选
        ...
ELSE              -- 可选
        ...
END IF;
```

案例：

```
create procedure p3()
begin
  declare score int default 58;
  declare result varchar(10);
  if score >= 85 then
    set result :='优秀';
  elseif score >= 60 then
    set result :='及格';
  else
    set result :='不及格';
  end if;
  select result;
end;
```

#### 参数（in, out, inout)

| 类型  | 含义                                         | 备注 |
| ----- | -------------------------------------------- | ---- |
| IN    | 该类参数作为输入，也就是需要调用时传入值     | 默认 |
| OUT   | 该类参数作为输出，也就是该参数可以作为返回值 |      |
| INOUT | 既可以作为输入参数，也可以作为输出参数****   |      |

**用法：**

```
CREATE PROCEDURE 存储过程名称([IN/OUT/INOUT 参数名 参数类型 ])
BEGIN
    -- SQL语句
END :
```

**案例：**

```
-- 根据传入(in)参数score，判定当前分数对应的分数等级，并返回(out)
-- score >= 85分，等级为优秀。
-- score >= 60分 且 score < 85分，等级为及格
-- score < 60分，等级为不及格。
create procedure p3(in score int, out result varchar(10))
begin
  if score >= 85 then
    set result :='优秀';
  elseif score >= 60 then
    set result :='及格';
  else
    set result :='不及格';
  end if;
  select result;
end;

-- 将传入的200分制的分数，进行换算，换算成百分制，然后返回分数 --> inout
create procedure p5(inout score double)
begin
  set score := score * 0.5;
end;

set @score = 198;
call p5(score);
select @score;
```

#### case

**语法一：**

```
CASE case value
  WHEN when_value1 THEN statement_list1
  [WHEN when_value2 THEN statement_list2]...
  [ELSE statement_list ]
END CASE;
```

**语法二：**

```
CASE
  WHEN search_conditionl THEN statement_list1
  WHEN search_condition2 THEN statement_list2]...
  [ELSE statement_list]
END CASE;
```

**案例：**

```
-- case
-- 根据传入的月份，判定月份所属的季节(要求采用case结构)
-- 1-3月份，为第一季度
-- 4-6月份，为第二季度
-- 7-9月份，为第三季度
-- 10-12月份，为第四季度

create procedure p6(in month int)
begin 
  declare result varchar(10);
  case 
    when month >= 1 and month <= 3 then
      set result := '第一季度';
    when month >= 4 and month <= 6 then
      set result := '第二季度';
    when month >= 7 and month <= 9 then
      set result := ' 第三季度';
    when month >= 10 and month <= 12 then
      set result := '第四季度';
    else
      set result := '非法参数';
  end case;

  select concat('你输入的月份为：', month, '，所属季度为：', result);
end;
```

#### 循环

##### while

while 循环是有条件的循环控制语句。满足条件后，再执行循环体中的SQL语句。

**语法：**

```
#先判定条件，如果条件为true，则执行逻辑，否则，不执行逻辑
WHILE 条件 DO
  SOL逻辑...
END WHILE;
```

**案例：**

```
-- while计算从1累加到 n 的值，n 为传入的参数值。
-- A.定义局部变量，记录累加之后的值;
-- B.每循环一次，就会对 n 进行减1，如果 n 减到0，则退出循环

create procedure p7(in n int)
begin
  declare total int default 0;
  
  while n>0 do
    set total := total + n
    set n:=n-1;
  end while;
  
  select total;
end;
call p7( n: 100);
```

##### repeat

repeat是有条件的循环控制语句,当满足条件的时候退出循环。

与 while 区别：

1. 先进行循环一次再判断。相当于 c 语言中的 do while();
2. 满足条件则退出

**语法：**

```
#先执行一次逻辑，然后判定逻辑是否满足，如果满足，则退出。如果不满足，则继续下一次循环
REPEAT
  SOL逻辑.
  UNTIL 条件
END REPEAT;
```

**案例：**

```
-- while计算从1累加到 n 的值，n 为传入的参数值。
-- A.定义局部变量，记录累加之后的值;
-- B.每循环一次，就会对 n 进行减1，如果 n 减到0，则退出循环

create procedure p8(innint)
begin
  declare total int default 0;
  
  repeat
    set total := total + n;
    set n := n - 1;
  until n <= 0
  end repeat;
  
  select total;
end;

call p8( n: 10);
call p8( n: 100);
```

##### loop

LOOP 实现简单的循环，如果不在SQL逻辑中增加退出循环的条件，可以用其来实现简单的死循环。LOOP可以配合一下两个语句使用。

1. LEAVE:配合循环使用，退出循环。
2. ITERATE:必须用在循环中，作用是跳过当前循环剩下的语句，直接进入下一次循环。

```
[begin label:] LOOP
  SQL逻辑..
END LOOP [end label];

LEAVE label;  -- 退出指定标记的循环体
ITERATE label;-- 直接进入下一次循环
```

**案例：**

```
-- loop 计算从1到n之间的偶数累加的值，n为传入的参数值。
-- A.定义局部变量，记录累加之后的值;
-- B.每循环一次，就会劝进行-1，如果n减到0，则退出循环。------> leave xx
-- C.如果当次累加的数据是奇数，则直接进入下一次循坏。-------> iterate xx

create procedure p10(in n int)
begin 
  declare total int defatult 0;

  sum: loop
    if n <= 10 then
      leave sum;
    end if;

    if n %2 = 1 then
      set n := n - 1;
      iterate sum;
    end if;

    set total := total + n;
    set n := n - 1;
  end loop sum;

  select total;
end;
```

#### 游标-cursor

游标(CURSOR)是用来存储查询结果集的数据类型,在存储过程和函数中可以使用游标对结果集进行循环的处理。游标的使用包括游标的声明、OPEN、FETCH和 CLOSE，其语法分别如下。

通俗点讲：类似于 c 语言中的结构体，java 中的实体类。

**声明游标**

```
DECLARE 游标名称 CURSOR FOR 查询语句;
```

**打开游标：**

```
OPEN 游标名称;
```

**获取游标记录：**

```
FETCH 游标名称 INTO 变量[,变量];
```

**关闭游标：**

```
CLOSE 游标名称;
```

**案例：**

```
-- 游标
-- 根据传入的参数uage，来查询用户表tb_user 中， 所有的用户年龄小于uage的用户姓名（name)和专业（profession），
-- 并将用户的姓名和专业插入到所创建的一张新表(id,name,profession)中。
-- 逻辑:
-- A.声明游标，存储查询结果集-
-- B.准备:创建表结构
-- C.开启游标-
-- D.获取游标中的记录
-- E.插入数据到新表中-
-- F.关闭游标

create procedure p11(in uage int)
begin 
  declare uname varchar(100);
  declare upro varchar(100);
  declare u_cursor cursor for select name, profession from tb_user where age <= uage;

  drop table if exists tb_user_pro;
  create table if not exists tb_user_pro(
    id int primary key auto_increment,
    name varchar(100),
    profession varchar(100)
  );
  
  open u_cursor;
  while true do
    fetch u_cursor into uname,upro;
    insert into tb_user_pro values(null, uname, upro);
  end while;
  close u_cursor;
end;
```

##### 条件处理程序-handler

条件处理程序(Handler)可以用来定义在流程控制结构执行过程中遇到问题时相应的处理步骤。

**语法：**

```
DECLARE handler action HANDLERFOR condition value l, condition value.... statement;
handler action
  CONTINUE: 继续执行当前程序
  EXIT: 终止执行当前程序
condition value
  SOLSTATE sqlstate_value:状态码，如 02000
  SQLWARNING:所有以01开头的SQLSTATE代码的简写
  NOT FOUND:所有以02开头的SOLSTATE代码的简写
  SOLEXCEPTION:所有没有被SOLWARNING 或 NOT FOUND捕获的SOLSTATE代码的简写
```

**案例：**

```
create procedure p11(in uage int)
begin 
  declare uname varchar(100);
  declare upro varchar(100);
  declare u_cursor cursor for select name, profession from tb_user where age <= uage;
  
  -- 监控到02000的状态码后，关闭游标后执行exit退出操作。
  declare exit handler for not found close u_cursor; 

  drop table if exists tb_user_pro;
  create table if not exists tb_user_pro(
    id int primary key auto_increment,
    name varchar(100),
    profession varchar(100)
  );
  
  open u_cursor;
  while true do
    fetch u_cursor into uname,upro;
    insert into tb_user_pro values(null, uname, upro);
  end while;
  close u_cursor;
end;
```

### 存储函数：

存储函数是有返回值的存储过程，存储函数的参数只能是IN类型的。

存储函数用的较少，能够使用存储函数的地方都可以用存储过程替换。

**语法：**

```
CREATE FUNCTION 存储函数名称([ 参数列表 ])
RETURNS type [characteristic ...]
BEGIN
  -- SQL语句
  RETURN ...;
END ;
characteristic说明:
· DETERMINISTIC:相同的输入参数总是产生相同的结果
· NO SQL:不包含 SQL语句。
· READS SOL DATA:包含读取数据的语句，但不包含写入数据的语句,
```

**案例：**

```
create function fun1(n int)
returns int deterministic
begin
  declare total int default 0;

  while n > 0 do 
    set total := total + n;
    set n := n - 1;
  end while;

  return total;
end;
```

### 触发器

触发器是与表有关的数据库对象，指在 insert/update/delete 之前或之后，触发并执行触发器中定义的SQL语句集合。触发器的这种特性可以协助应用在数据库端确保数据的完整性，日志记录，数据校验等操作。

使用别名 OLD 和 NEW 来引用触发器中发生变化的记录内容，这与其他的数据库是相似的。现在触发器还只支持行级触发，不支持语句级触发。

| 触发器类型      | NEW 和 OLD                                             |
| --------------- | ------------------------------------------------------ |
| insert 型触发器 | NEW 表示将要或者已经新增的数据                         |
| update 型触发器 | OLD 表示修改之前的数据，NEW 表示将要或已经修改后的数据 |
| delete 型触发器 | OLD 表示将要或者已经删除的数据                         |

**语法：**

**创建：**

```
CREATE TRIGGER trigger name
BEFORE/AFTER INSERT/UPDATE/DELETE
ON tbl name FOR EACH ROW --行级触发器BEGIN
  trigger_stmt;
END;
```

**查看：**

```
SHOW TRIGGERS;
```

**删除：**

```
DROP TRIGGER [schema_name.]trigger_name; --如果没有指定 schema name，默认为当前数据库
```

**案例：**

```
-- 插入数据触发器
create trigger tb_user_insert_trigger
  after insert on tb_user for each row
  begin 
  insert into user_logs(id, operation, operate_time, operate_id, operate_params)values
  (null, 'insert', now(), new.id, concat('插入的数据内容为：id=', new.id, ',name=', new.name, ', phone=', new.phone, ', email=', new.email, ', profession=', new.profession));
end;

-- 查看
show triggers;

-- 删除
drop trigger tb_user_insert_trigger;

-- 插入数据tb_user
insert into tb_user(id, name, phtone, email, profession, age, gender, status, createtime) values(25, '二皇子', '1880901212', 'erhuangzi@163.com', '软件工程', 23, '1', '1'1, now());

-- 修改数据触发器
create trigger tb_user_update_trigger
  after update on tb_user for each row
  begin 
  insert into user_logs(id, operation, operate_time, operate_id, operate_params)values
  (null, 'update', now(), new.id, 
   concat('更新之前的数据：id=', old.id, ',name=', old.name, ', phone=', old.phone, ', email=', old.email, ', profession=', old.profession,
    '更新之后的数据：id=', new.id, ',name=', new.name, ', phone=', new.phone, ', email=', new.email, ', profession=', new.profession));
end;

update tb_user set age = 32 where id = 23;
update tb_user set age = 32 where id <= 5; -- 触发器为行级触发器，所以更改几行数据则出发几次，该语句出发5次

-- 删除数据触发器
create trigger tb_user_delete_trigger
  after delete on tb_user for each row
  begin 
  insert into user_logs(id, operation, operate_time, operate_id, operate_params)values
  (null, 'insert', now(), old.id, 
   concat('删除之前的数据：id=', new.id, ',name=', old.name, ', phone=', old.phone, ', email=', old.email, ', profession=', old.profession));
end;

delete from tb_user where id = 26;
```

## 锁

介绍：

锁是计算机协调多个进程或线程并发访问某一资源的机制。在数据库中，除传统的计算资源(CPU、RAM、I/0)的争用以外，数据也是一种供许多用户共享的资源。如何保证数据并发访问的一致性、有效性是所有数据库必须解决的一个问题，锁冲突也是影响数据库并发访问性能的一个重要因素。从这个角度来说，锁对数据库而言显得尤其重要，也更加复杂。

分类：

MySQL中的锁，按照锁的粒度分，分为一下三类：

1. 全局锁：锁定数据库中的所有表。
2. 表级锁：每次操作锁住整张表。
3. 行级锁：每次操作锁住对应的行数据。

### 全局锁

介绍：

全局锁就是对整个数据库实例加锁，加锁后整个实例就处于只读状态，后续的DML的写语句，DDL语句，已经更新操作的事务提交语句都将被阻塞。

其典型的使用场景是做全库的逻辑备份，对所有的表进行锁定，从而获取一致性视图，保证数据的完整性。

基本操作：

使用全局锁：`flush tables with read lock`
释放全局锁：`unlock tables`

演示图：

![image.png](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/51083972978.png)

![image.png](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/fqweqwegqg.png)

特点：

数据库中加全局锁，是一个比较重的操作，存在以下问题:

1. 如果在主库上备份，那么在备份期间都不能执行更新，业务基本上就得停摆。
2. 如果在从库上备份，那么在备份期间从库不能执行主库同步过来的二进制日志(binlog)，会导致主从延迟。（该结构会在后续主从复制讲解）

解决方法：

在InnoDB引擎中，我们可以在备份时加上参数 –single-transaction 参数来完成不加锁的一致性数据备份。

`mysqldump --single-transaction -uroot -p123456 itcast > itcast.sql`（只适用于支持「可重复读隔离级别的事务」的存储引擎）

原理补充：通过加上这个参数，确保了在备份开始时创建一个一致性的快照，通过启动一个新的事务来实现这一点。（该事务的隔离级别是Repeatable Read级别），从而实现在该事务读取下一直读取的是创建时的数据，而不影响其他事务的读写操作。

### 表级锁

每次操作锁住整张表。锁定粒度大，发生锁的冲突的概率最高，并发度最低。应用在MyISAM、InnoDB、BDB等存储引擎中。

对于表级锁，主要分为一下三类：

1. 表锁
2. 元数据锁（meta data lock，MDL）
3. 意向锁

#### 表锁

对于表锁，分为两类：

1. 表共享读锁（read lock）
2. 表独占写锁（write lock）

**读锁不会阻塞其他客户端的读，但是会阻塞写。写锁既会阻塞其他客户端的读，又会阻塞其他客户端的写。**

语法：

```
//表级别的共享锁，也就是读锁；
//允许当前会话读取被锁定的表，但阻止其他会话对这些表进行写操作。
lock tebles t_student read;

//表级锁的独占锁，也是写锁；
//允许当前会话对表进行读写操作，但阻止其他会话对这些表进行任何操作（读或写）。
lock tables t_stuent write;
```

释放所有锁：

`unlock tables` （会话退出，也会释放所有锁）

#### 元数据锁

MDL加锁过程是系统自动控制，无需显式使用，在访问一张表的时候会自动加上。MDL锁主要作用是维护表元数据的数据一致性，在表
上有活动事务的时候，不可以对元数据进行写入操作。**为了避免DML与DDL冲突，保证读写的正确性。**

- 对一张表进行 CRUD 操作时，加的是 **MDL 读锁**；
- 对一张表做结构变更操作的时候，加的是 **MDL 写锁**；

| 对应SQL                                     | 锁类型                                | 说明                                             |
| ------------------------------------------- | ------------------------------------- | ------------------------------------------------ |
| lock tables xxx read /write                 | SHARED_READ_ONLY/SHARED_NO_READ_WRITE |                                                  |
| select 、 select … lock in share mode       | SHARED_READ                           | 与SHARED_READ、SHARED_WRITE兼容，与EXCLUSIVE互斥 |
| insert 、update、delete、select …for update | SHARED_WRITE                          | 与SHARED_READ、SHARED_WRITE兼容，与EXCLUSIVE互斥 |
| alter table …                               | EXCLYSIVE                             | 与其他的MDL都互斥                                |

查看元数据锁：

```
select object_type,object_schema,object_name,lock_type,lock_duration from performance_schema.metadata_locks;
```

#### 意向锁

为了避免DML在执行时，加的行锁与表锁的冲突，在InnoDB中引入了意向锁，使得表锁不用检查每行数据是否加锁，使用意向锁来减
少表锁的检查。

**意向共享锁和意向独占锁是表级锁，不会和行级的共享锁和独占锁发生冲突，而且意向锁之间也不会发生冲突，只会和共享表锁（lock tables … read)和独占表锁（lock tables … write）发生冲突**

如果没有「意向锁」，那么加「独占表锁」时，就需要遍历表里所有记录，查看是否有记录存在独占锁，这样效率会很慢。

那么有了「意向锁」，由于在对记录加独占锁前，先会加上表级别的意向独占锁，那么在加「独占表锁」时，直接查该表是否有意向独占锁，如果有就意味着表里已经有记录被加了独占锁，这样就不用去遍历表里的记录。

**意向锁的目的是为了快速判断表里是否有记录被加锁**。

加锁方式：

意向共享锁：（先在表上加上意向共享锁，然后对读取的记录加共享锁）
由 `select ... lock in share mode` 添加

意向独占锁：（先表上加上意向独占锁，然后对读取的记录加独占锁）
由 `insert、update、delete、select ... for update `添加

#### AUTO-INC锁（补充）

![qrer231r123r.png](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/qrer231r123r.png)

![qewf23f.png](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/qewf23f.png)

### 行级锁

行级锁，每次操作锁住对应的行数据。锁定粒度最小，发生锁冲突的概率最低，并发度最高。应用在InnoDB存储引擎中。

1. 行锁(Record Lock):锁定单个行记录的锁，防止其他事务对此行进行update和delete。在RC、RR隔离级别下都支持。
2. 间隙锁(GapLock):锁定索引记录间隙(不含该记录)，确保索引记录间隙不变，防止其他事务在这个间隙进行insert，产生幻读。在RR隔离级别下都支持。
3. 临键锁(Next-Key Lock):行锁和间隙锁组合，同时锁住数据，并锁住数据前面的间隙Gap。在RR隔离级别下支持。

#### Record Lock（行锁）

Record Lock 称为记录锁，锁住的是一条记录。而且记录锁是有 S 锁和 X 锁之分。

InnoDB实现了以下两种类型的行锁：

1. 共享锁(S)：允许一个事务去读一行，阻止其他事务获得相同数据集的排它锁。
2. 排他锁(X)：允许获取排他锁的事务更新数据，阻止其他事务获得相同数据集的共享锁和排他锁。

|           | S(共享锁) | X(排他锁) |
| --------- | --------- | --------- |
| S(共享锁) | 兼容      | 冲突      |
| X(排他锁) | 冲突      | 冲突      |

行锁类型：

| SQL                         | 行锁类型   | 说明                                     |
| --------------------------- | ---------- | ---------------------------------------- |
| insert，update，delete …    | 排他锁     | 自动加锁                                 |
| select                      | 不加任何锁 |                                          |
| select … lock in share mode | 共享锁     | 需要手动select之后加上lock in share mode |
| select … for update         | 排他锁     | 需要手动在select之后for update           |

默认情况下，InnoDB在 REPEATABLE READ事务隔离级别运行，InnoDB使用 next-key锁进行搜索和索引扫描，以防止幻读。

1. 针对唯一索引进行检索时，对已存在的记录进行等值匹配时，将会自动优化为行锁。
2. InnoDB的行锁是针对于索引加的锁，不通过索引条件检索数据，那么!nnoDB将对表中的所有记录加锁，此时 **就会升级为表锁**。

查看意向锁及行锁的加锁情况：

```
select object_schema,object_name,index_name,lock_type,lock_mode,lock_data from peformance_schema.data_locks;
```

#### Gap Lock（间隙锁）

![qweg2431123qw.png](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/qweg2431123qw.png)

#### Next-Key Lock（临键锁）

![qwegfqew24.png](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/qwegfqew24.png)

默认情况下，InnODB在 REPEATABLE READ事务隔离级别运行，InnoDB使用 next-key 锁进行搜索和索引扫描，以防止幻读。

1. 索引上的等值查询(唯一索引)，给不存在的记录加锁时,优化为间隙锁 。
2. 索引上的等值查询(普通索引)，向右遍历时最后一个值不满足查询需求时，next-keylock退化为间隙锁。
3. 索引上的范围查询(唯一索引)–会访问到不满足条件的第一个值为止。

## InnoDB引擎

### 逻辑存储结构

![image.png](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/ewqqeg423.png)

![image.png](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/ewqg1341.png)

### 架构

![架构图.png](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/qewg13g423f.png)

#### 内存架构

![文件无法预览。](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/qwef12t132r.png)

![文件无法预览。](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/910310644164.png)

![文件无法预览。](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/2633356152.png)

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/21810694716.png)

#### 磁盘结构

![文件无法预览。](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/71896219103.png)

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/6345845897.png)

#### 后台线程

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/1192969375.png)

### 事务原理

事务：

事务 是一组操作的集合，它是一个不可分割的工作单位，事务会把所有的操作作为一个整体一起向系统提交或撤销操作请求，即这些操作要么同时成功，要么同时失败。

特征：

- 原子性(Atomicity)：事务是不可分割的最小操作单元，要么全部成功，要么全部失败。
- 一致性(Consistency) ：事务完成时，必须使所有的数据都保持一致状态。
- 隔离性(lsolation)：数据库系统提供的隔离机制，保证事务在不受外部并发操作影响的独立环境下运行。
- 持久性(Durability)：事务一旦提交或回滚，它对数据库中的数据的改变就是永久的。

特性原理分类图：

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/10723932987.png)

#### redo log

重做日志，记录的是事务提交时数据页的物理修改，是用来实现事务的**持久性**。

该日志文件由两部分组成:重做日志缓冲(redo log buffer)以及重做日志文件(redo log file),前者是在内存中，后者在磁盘中。当事务提交之后会把所有修改信息都存到该日志文件中,用于在刷新脏页到磁盘,发生错误时,进行数据恢复使用。

Buffer Pool在产生脏页数据的时候，会先将数据存储到 redo log buffer 再存储到 redo log 中进行磁盘持久化存储，在内存出现异常（比如突然断电）时，通过redo log中持久化的数据进行回滚。过程如下图：

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/7521579557.png)

redo log 要写到磁盘，数据也要写磁盘，为什么要多此一举?

写入 redo log 的方式使用了追加操作，所以磁盘操作是**顺序写**，而写入数据需要先找到写入位置，然后才写到磁盘，所以磁盘操作是**随机写**。

#### undo log

回滚日志，用于记录数据被修改前的信息，作用包含两个:提供回滚 和 MVCC(多版本并发控制)。

undo log 和 redo log 记录物理日志不一样，它是逻辑日志。可以认为当 delete 一条记录时，undo log中会记录一条对应的insert记录，反之亦然，当 update 一条记录时，它记录一条对应相反的 update 记录。当执行 rollback 时，就可以从 undo log 中的逻辑记录读取到相应的内容并进行回滚。

Undo log 销毁：undo log 在事务执行时产生，事务提交时，并不会立即删除undol0g，因为这些日志可能还用于 MVCC。

Undo log 存储：undo log 采用段的方式进行管理和记录，存放在前面介绍的 rollback segment 回滚段中，内部包含1024个 undo log segment.

### MVCC

**当前读：**

读取的是记录的最新版本，读取时还要保证其他并发事务不能修改当前记录，会对读取的记录进行加锁。对于我们日常的操作，如:select…lock in share mode(共享锁)，select… for update、update、insert、delete(排他锁)都是一种当前读。

**快照读：**

简单的select(不加锁)就是快照读，快照读，读取的是记录数据的可见版本，有可能是历史数据，不加锁，是非阻塞读。

- Read committed:每次select，都生成一个快照读。
- Repeatable Read:开启事务后第一个select语句才是快照读的地方。
- Serializable:快照读会退化为当前读。

**MVCC：**

全称 Multi-Version Concurrency Control，多版本并发控制。指维护一个数据的多个版本，使得读写操作没有冲突，快照读为MVSOL实现MVCC提供了一个非阻塞读功能。MVCC的具体实现，还需要依赖于数据库记录中的三个隐式字段、undo log日志、read View。

#### 三个隐藏字段

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/9225237599.png)

#### undo log

回滚日志，在insert、update、delete的时候产生的便于数据回滚的日志。

当insert的时候，产生的undoloq日志只在回滚时需要，在事务提交后，可被立即删除。

而update、delete的时候，产生的undo log日志不仅在回滚时需要，在快照读时也需要，不会立即被删除。

那么何时删除？

- 事务提交后

  ：

  - 对于`INSERT`操作，事务提交后，undo log可以被立即删除，因为不再需要用于回滚。
  - 对于`UPDATE`和`DELETE`操作，undo log不会立即被删除，因为它们可能在后续的快照读取中被使用。

- 快照读取结束

  ：

  - 当所有依赖于该undo log的快照读取操作结束后，undo log才会被删除。这意味着如果有一个事务正在进行快照读取，并且依赖于某个undo log，那么这个undo log会一直保留直到该事务结束。

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/921810810932.png)

#### readview

ReadView(读视图)是 快照读 SOL执行时MVCC提取数据的依据，记录并维护系统当前活跃的事务(未提交的)id。

ReadView中包含了四个核心字段:

| 字段           | 含义                                                 |
| -------------- | ---------------------------------------------------- |
| m_ids          | 当前活跃的事务ID集合                                 |
| min_trx_id     | 最小活跃事务ID                                       |
| max_trx_id     | 预分配事务ID，当前最大事务ID+1（因为事务ID是自增的） |
| creator_trx_id | ReadView创建者的事务ID                               |

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/84711022753.png)

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/6934998817.png)

依次比较 undo log 日志中版本数据链，找到可以进行访问的版本数据。

## MySQL管理

### 系统数据库介绍

Mysql数据库安装完成后，自带了一下四个数据库，具体作用如下：

| 数据库             | 含义                                                         |
| ------------------ | ------------------------------------------------------------ |
| mysql              | 存储MVSQL服务器正常运行所需要的各种信息(时区、主从、用户、权限等) |
| information_schema | 提供了访问数据库元数据的各种表和视图，包含数据库、表、字段类型及访问权限等 |
| performance_schema | 为MySQL服务器运行时状态提供了一个底层监控功能，主要用于收集数据库服务器性能参数 |
| sys                | 包含了一系列方便 DBA和开发人员利用 performance_schema性能数据库进行性能调优和诊断的视图 |

### 常用工具

#### mysql

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/3233394951.png)

#### mysqladmin

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/10103131010198.png)

#### mysqlbinlog

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/1285451886.png)

#### mysqlshow

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/8210310352105.png)

#### mysqldump

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/479211610103.png)

#### mysqlimport/source

![img](https://jimhackking.github.io/%E8%BF%90%E7%BB%B4/MySQL%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/34108898837.png)



