##  程序详细说明

[程序源码](#yuanma)

这是一个使用 **Windows COM 接口**控制 PowerPoint 来批量转换 PPT/PPTX 文件为 PDF 的 Python 工具。

---

### 🎯 实现的功能

| 功能                 | 说明                                                |
| -------------------- | --------------------------------------------------- |
| **批量转换**         | 自动扫描指定文件夹中所有 `.ppt` 和 `.pptx` 文件     |
| **格式支持**         | 同时支持旧版 `.ppt` 和新版 `.pptx` 格式             |
| **自动创建输出目录** | 如果输出文件夹不存在，自动创建                      |
| **进度显示**         | 显示转换进度 `[当前/总数]`，便于跟踪                |
| **转换统计**         | 完成后汇总成功和失败的数量                          |
| **错误处理**         | 单个文件转换失败不会中断整个批处理流程              |
| **资源清理**         | 使用 `try-finally` 确保 PowerPoint 应用程序正确关闭 |

---

### ✅ 优点

1. **高保真转换**
   - 通过 PowerPoint 原生 COM 接口进行转换，确保格式、字体、动画效果等100%还原

2. **稳定可靠**
   - 使用 `ReadOnly=True` 打开文件，避免意外修改原文件
   - 添加 `time.sleep(1)` 等待文件完全加载，减少转换错误

3. **友好的用户交互**
   - 清晰的进度提示（✓ 成功 / ✗ 失败）
   - 程序结束时等待用户按回车退出，便于查看结果

4. **容错性强**
   - 单个文件失败后继续处理其他文件
   - 完善的异常捕获机制

5. **代码简洁易懂**
   - 核心功能封装在单一函数中
   - 注释详尽，便于维护和修改

---

### 📋 适用场景

| 场景           | 描述                                                         |
| -------------- | ------------------------------------------------------------ |
| **教育领域**   | 教师批量转换课程 PPT 为 PDF 供学生下载（正如代码中的示例路径所示） |
| **企业办公**   | 将会议资料、培训材料统一转为 PDF 格式便于分发                |
| **归档存储**   | 将大量演示文稿转换为 PDF 进行长期保存                        |
| **跨平台分享** | PDF 格式兼容性更好，适合分享给没有安装 PowerPoint 的用户     |
| **打印准备**   | PDF 格式更适合打印，避免排版错乱                             |

---

### ⚠️ 使用前提

- **必须安装 Microsoft PowerPoint**（程序通过 COM 接口调用 PowerPoint）
- **仅限 Windows 系统**（依赖 Windows COM 技术）
- 需要安装 `comtypes` 库：`pip install comtypes`

---

### 💡 使用方法

修改第 97-98 行的路径即可：

```python
input_folder = r"你的PPT文件夹路径"
output_folder = r"你的PDF输出路径"
```

然后直接运行脚本即可完成批量转换！



<a id="yuanma"></a>

## 程序源码

```python
"""
批量将文件夹中的PPT/PPTX文件转换为PDF
使用Windows COM接口控制PowerPoint
"""
import os
import sys
import time
import comtypes.client

def convert_ppt_to_pdf(input_folder, output_folder):
    """
    将input_folder中的所有PPT/PPTX文件转换为PDF并保存到output_folder
    """
    # 确保输出文件夹存在
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"创建输出文件夹: {output_folder}")
    
    # 支持的PPT扩展名
    ppt_extensions = ('.ppt', '.pptx')
    
    # 获取所有PPT文件
    ppt_files = [f for f in os.listdir(input_folder) 
                 if f.lower().endswith(ppt_extensions)]
    
    if not ppt_files:
        print("未找到任何PPT/PPTX文件！")
        return
    
    print(f"找到 {len(ppt_files)} 个PPT文件")
    
    # 创建PowerPoint应用程序实例
    powerpoint = None
    try:
        powerpoint = comtypes.client.CreateObject("PowerPoint.Application")
        powerpoint.Visible = 1  # 设置为可见（有时候不可见会有问题）
        
        success_count = 0
        fail_count = 0
        
        for i, ppt_file in enumerate(ppt_files, 1):
            input_path = os.path.join(input_folder, ppt_file)
            # 获取不带扩展名的文件名
            base_name = os.path.splitext(ppt_file)[0]
            output_path = os.path.join(output_folder, f"{base_name}.pdf")
            
            print(f"[{i}/{len(ppt_files)}] 正在转换: {ppt_file}")
            
            try:
                # 打开PPT文件
                # Open(FileName, ReadOnly, Untitled, WithWindow)
                presentation = powerpoint.Presentations.Open(
                    input_path,
                    ReadOnly=True,
                    Untitled=False,
                    WithWindow=False
                )
                
                # 等待一下确保文件完全加载
                time.sleep(1)
                
                # 保存为PDF (32 = ppSaveAsPDF)
                presentation.SaveAs(output_path, 32)
                
                # 关闭演示文稿
                presentation.Close()
                
                print(f"    ✓ 转换成功: {base_name}.pdf")
                success_count += 1
                
            except Exception as e:
                print(f"    ✗ 转换失败: {str(e)}")
                fail_count += 1
                continue
        
        print("\n" + "="*50)
        print(f"转换完成！成功: {success_count}, 失败: {fail_count}")
        print(f"PDF文件保存在: {output_folder}")
        
    except Exception as e:
        print(f"初始化PowerPoint失败: {str(e)}")
        print("请确保已安装Microsoft PowerPoint")
        
    finally:
        # 关闭PowerPoint应用程序
        if powerpoint:
            try:
                powerpoint.Quit()
            except:
                pass


if __name__ == "__main__":
    # ============================================
    # 在这里修改你的输入和输出路径
    # ============================================
    input_folder = r"E:\2025.9.3大三上学期实训课\大三下学期实验报告2025-9--12\计算机组成原理---王珏\课程PPT\PPT"
    output_folder = r"E:\2025.9.3大三上学期实训课\大三下学期实验报告2025-9--12\计算机组成原理---王珏\课程PPT\pdf"
    
    # 检查输入文件夹是否存在
    if not os.path.exists(input_folder):
        print(f"错误：输入文件夹不存在: {input_folder}")
        sys.exit(1)
    
    print("="*50)
    print("PPT批量转PDF工具")
    print("="*50)
    print(f"输入文件夹: {input_folder}")
    print(f"输出文件夹: {output_folder}")
    print("="*50 + "\n")
    
    convert_ppt_to_pdf(input_folder, output_folder)
    
    input("\n按回车键退出...")

```

