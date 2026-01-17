# Python 数据分析

使用 Python 进行数据分析的核心技术和方法。

## Pandas 数据处理

### 读取数据

```python
import pandas as pd

# 从 CSV 读取
df = pd.read_csv('data.csv')

# 从 Excel 读取
df = pd.read_excel('data.xlsx')

# 从字典创建
data = {
    'name': ['Alice', 'Bob', 'Charlie', 'David'],
    'age': [25, 30, 35, 28],
    'salary': [50000, 60000, 70000, 55000]
}
df = pd.DataFrame(data)
```

### 数据探索

```python
# 查看前几行
print(df.head())

# 数据统计信息
print(df.describe())

# 数据类型
print(df.dtypes)

# 数据维度
print(df.shape)

# 列名
print(df.columns)
```

### 数据筛选

```python
# 选择列
ages = df['age']

# 选择多列
subset = df[['name', 'age']]

# 条件筛选
adults = df[df['age'] >= 30]

# 多条件筛选
high_earners = df[(df['age'] >= 30) & (df['salary'] > 60000)]
```

### 数据清洗

```python
# 处理缺失值
df_cleaned = df.dropna()  # 删除含缺失值的行
df_filled = df.fillna(0)  # 填充缺失值

# 删除重复行
df_unique = df.drop_duplicates()

# 重命名列
df_renamed = df.rename(columns={'old_name': 'new_name'})
```

### 数据聚合

```python
# 分组统计
grouped = df.groupby('department')['salary'].mean()

# 多个聚合函数
agg_result = df.groupby('department').agg({
    'salary': ['mean', 'max', 'min'],
    'age': 'mean'
})
```

## NumPy 数值计算

```python
import numpy as np

# 创建数组
arr = np.array([1, 2, 3, 4, 5])

# 数组运算
print(arr + 10)        # 加法
print(arr * 2)         # 乘法
print(arr ** 2)        # 幂运算

# 统计函数
print(np.mean(arr))    # 平均值
print(np.std(arr))     # 标准差
print(np.sum(arr))     # 求和

# 矩阵运算
matrix = np.array([[1, 2], [3, 4]])
print(np.linalg.inv(matrix))  # 矩阵求逆
```

## 数据可视化

```python
import matplotlib.pyplot as plt
import seaborn as sns

# 设置样式
plt.style.use('seaborn-v0_8')

# 折线图
plt.figure(figsize=(10, 6))
plt.plot(df['date'], df['value'], marker='o')
plt.title('Time Series Plot')
plt.xlabel('Date')
plt.ylabel('Value')
plt.show()

# 柱状图
plt.figure(figsize=(10, 6))
df.groupby('category')['value'].sum().plot(kind='bar')
plt.title('Category Summary')
plt.xlabel('Category')
plt.ylabel('Total Value')
plt.show()

# 散点图
plt.figure(figsize=(10, 6))
plt.scatter(df['x'], df['y'], alpha=0.5)
plt.title('Scatter Plot')
plt.xlabel('X')
plt.ylabel('Y')
plt.show()
```

!!! example "实战案例"
    尝试使用真实数据集（如 Kaggle 上的数据集）来练习这些技能。

## 下一步

查看 [常用库](libraries.md) 了解更多数据分析相关的 Python 库。
