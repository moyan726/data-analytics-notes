# Python 常用库

数据分析和科学计算中常用的 Python 库。

## 核心库

### Pandas
**数据处理和分析**

```python
import pandas as pd

# DataFrame 操作
df = pd.DataFrame({
    'A': [1, 2, 3],
    'B': [4, 5, 6]
})

# 数据透视表
pivot = df.pivot_table(values='value', index='category', columns='date')
```

- 官方文档：[https://pandas.pydata.org/](https://pandas.pydata.org/)
- 主要功能：数据读写、数据清洗、数据转换、数据聚合

### NumPy
**科学计算基础**

```python
import numpy as np

# 高维数组操作
arr = np.random.rand(3, 3)
print(arr.T)  # 转置
```

- 官方文档：[https://numpy.org/](https://numpy.org/)
- 主要功能：数组操作、线性代数、傅里叶变换、随机数生成

### Matplotlib
**基础可视化**

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(10, 6))
ax.plot([1, 2, 3], [1, 4, 9])
plt.show()
```

- 官方文档：[https://matplotlib.org/](https://matplotlib.org/)
- 主要功能：各类图表绘制、自定义样式

## 高级可视化

### Seaborn
**统计可视化**

```python
import seaborn as sns

# 热力图
sns.heatmap(data, annot=True, cmap='coolwarm')
plt.show()
```

- 官方文档：[https://seaborn.pydata.org/](https://seaborn.pydata.org/)
- 主要功能：统计图表、美观的默认样式

### Plotly
**交互式可视化**

```python
import plotly.express as px

fig = px.scatter(df, x='x', y='y', color='category')
fig.show()
```

- 官方文档：[https://plotly.com/python/](https://plotly.com/python/)
- 主要功能：交互式图表、仪表板

## 机器学习

### Scikit-learn
**机器学习算法**

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# 训练模型
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = LinearRegression()
model.fit(X_train, y_train)
```

- 官方文档：[https://scikit-learn.org/](https://scikit-learn.org/)
- 主要功能：分类、回归、聚类、降维

## 数据库连接

### SQLAlchemy
**SQL 工具包和 ORM**

```python
from sqlalchemy import create_engine
import pandas as pd

engine = create_engine('sqlite:///database.db')
df = pd.read_sql('SELECT * FROM table', engine)
```

- 官方文档：[https://www.sqlalchemy.org/](https://www.sqlalchemy.org/)
- 主要功能：数据库连接、ORM、SQL 表达式

## Web 数据

### Requests
**HTTP 请求**

```python
import requests

response = requests.get('https://api.example.com/data')
data = response.json()
```

### BeautifulSoup
**网页解析**

```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(html, 'html.parser')
text = soup.find('div', class_='content').get_text()
```

!!! tip "选择合适的库"
    根据具体需求选择合适的库，不要过度依赖单一工具。

## 学习资源

- [Python 官方文档](https://docs.python.org/)
- [Real Python](https://realpython.com/)
- [Kaggle Learn](https://www.kaggle.com/learn)
