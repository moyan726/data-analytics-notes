# Python 数据分析

Python 是数据分析领域最流行的编程语言之一，拥有丰富的库和工具生态系统。

## 为什么选择 Python？

- **易学易用**：语法简洁清晰
- **强大的库支持**：Pandas、NumPy、Matplotlib、Scikit-learn 等
- **活跃的社区**：大量学习资源和开源项目
- **跨平台支持**：Windows、macOS、Linux 均可运行

## 实战内容

- **[动手学数据分析](hands-on-data-analysis/index.md)** - 基于实战的数据分析学习路径
- **[数据可视化基础](Data_Visualization/index.md)** - 掌握 Matplotlib、Seaborn 等绘图工具
- **[机器学习](Machine-Learning/index.md)** - Python 机器学习实战笔记

## 核心库介绍

### Pandas
用于数据操作和分析的核心库。

```python
import pandas as pd

# 创建 DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'city': ['New York', 'London', 'Paris']
})

print(df)
```

### NumPy
用于科学计算和数组操作。

```python
import numpy as np

# 创建数组
arr = np.array([1, 2, 3, 4, 5])
print(f"Mean: {arr.mean()}")
```

### Matplotlib
用于数据可视化。

```python
import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]

plt.plot(x, y)
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.title('Simple Line Plot')
plt.show()
```

!!! note "开始学习"
    点击左侧导航栏中的各个主题，开始你的 Python 数据分析之旅！
