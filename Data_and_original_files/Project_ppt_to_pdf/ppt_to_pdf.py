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
