# Python 基础

本节介绍 Python 的基础语法和核心概念。

## 变量和数据类型

### 基本数据类型

```python
# 整数
age = 25

# 浮点数
price = 19.99

# 字符串
name = "Alice"

# 布尔值
is_active = True

# 列表
fruits = ["apple", "banana", "orange"]

# 字典
person = {
    "name": "Alice",
    "age": 25,
    "city": "New York"
}
```

## 控制流

### 条件语句

```python
age = 18

if age >= 18:
    print("成年人")
elif age >= 13:
    print("青少年")
else:
    print("儿童")
```

### 循环

```python
# for 循环
for i in range(5):
    print(f"Number: {i}")

# while 循环
count = 0
while count < 5:
    print(f"Count: {count}")
    count += 1

# 遍历列表
fruits = ["apple", "banana", "orange"]
for fruit in fruits:
    print(fruit)
```

## 函数

```python
def greet(name):
    """问候函数"""
    return f"Hello, {name}!"

# 调用函数
message = greet("Alice")
print(message)

# 带默认参数的函数
def power(base, exponent=2):
    return base ** exponent

print(power(3))      # 9
print(power(3, 3))   # 27
```

## 列表推导式

```python
# 生成平方数列表
squares = [x**2 for x in range(10)]
print(squares)

# 筛选偶数
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
even_numbers = [x for x in numbers if x % 2 == 0]
print(even_numbers)
```

## 文件操作

```python
# 写入文件
with open('data.txt', 'w') as f:
    f.write('Hello, World!\n')
    f.write('This is a test.')

# 读取文件
with open('data.txt', 'r') as f:
    content = f.read()
    print(content)
```

!!! tip "实践建议"
    通过编写小程序来练习这些基础概念，实践是最好的学习方法！

## 下一步

继续学习 [数据分析](data-analysis.md) 来了解如何使用 Python 进行数据分析。
