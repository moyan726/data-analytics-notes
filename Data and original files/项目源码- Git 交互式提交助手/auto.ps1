<#
.SYNOPSIS
    交互式 Git 分批提交助手 (V2.6 - 稳定运行版)
    修复内容：
    1. 修复单文件显示问题
    2. 修复路径引号处理
    3. 修复字符转义语法错误
    注意：请务必将此文件保存为 "UTF-8 with BOM" 编码格式
#>

# -----------------------------------------------------------------------------
# 0. 配置与初始化
# -----------------------------------------------------------------------------

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Config = @{
    ProtectMainBranch    = $true
    SensitivePatterns    = @(".env", "*.key", "id_rsa", "secrets.*", "*credentials*", "config.prod*")
    LargeFileThresholdMB = 50
    TargetRepoPath       = "E:\pycharm\MyWeb\data-analytics-notes"
}

$Global:CommittedFiles = @()
$Global:InitialFileCount = 0

# -----------------------------------------------------------------------------
# 1. 辅助函数
# -----------------------------------------------------------------------------

function Write-Log {
    param([string]$Message, [string]$Level = "Info", [switch]$NoNewLine)
    $color = "Cyan"
    switch ($Level) {
        "Success" { $color = "Green" }
        "Warn"    { $color = "Yellow" }
        "Error"   { $color = "Red" }
    }
    $timeStr = (Get-Date -Format "HH:mm:ss")
    Write-Host "[$timeStr] $Message" -ForegroundColor $color -NoNewline:$NoNewLine
}

function Get-GitRoot {
    $root = git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -eq 0 -and $root) { return $root }
    
    if (Test-Path $Config.TargetRepoPath) {
        Push-Location $Config.TargetRepoPath
        try {
            $root = git rev-parse --show-toplevel 2>$null
            if ($LASTEXITCODE -eq 0 -and $root) { return $root }
        } finally {
            Pop-Location
        }
    }
    return $null
}

function Check-GitState {
    $gitDir = git rev-parse --git-dir 2>$null
    if (-not $gitDir) { return $true }

    $blockers = @("MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-apply", "rebase-merge", "BISECT_LOG")
    foreach ($item in $blockers) {
        $lockPath = Join-Path $gitDir $item
        if (Test-Path $lockPath) {
            Write-Log "严重警告：检测到 Git 正在进行复杂操作 ($item)。" "Error"
            return $false
        }
    }
    return $true
}

function Parse-GitStatus {
    $rawLines = git -c core.quotepath=false status --porcelain=v1 2>$null
    
    # 强制转换为数组
    if ($rawLines -is [string]) {
        $rawLines = @($rawLines)
    }
    
    if (-not $rawLines -or $rawLines.Count -eq 0) { 
        return @() 
    }
    
    $results = [System.Collections.ArrayList]@()
    $index = 1
    
    foreach ($line in $rawLines) {
        if ([string]::IsNullOrWhiteSpace($line) -or $line.Length -lt 3) { 
            continue 
        }
        
        try {
            $status = $line.Substring(0, 2)
            $rest   = $line.Substring(3).Trim()
            
            if ([string]::IsNullOrWhiteSpace($rest)) { continue }
            
            # 移除 Git 添加的路径引号
            if ($rest.StartsWith('"') -and $rest.EndsWith('"') -and $rest.Length -gt 1) {
                $rest = $rest.Substring(1, $rest.Length - 2)
            }
            
            $obj = [PSCustomObject]@{
                Index   = $index
                Status  = $status
                Path    = ""
                OldPath = $null
                Display = ""
                RawLine = $line
            }

            # 处理重命名
            if ($status -match "^R") {
                if ($rest -match '^(.+?)\s+->\s+(.+)$') {
                    $oldPath = $matches[1].Trim()
                    $newPath = $matches[2].Trim()
                    
                    # 分别去除引号
                    if ($oldPath.StartsWith('"') -and $oldPath.EndsWith('"')) {
                        $oldPath = $oldPath.Substring(1, $oldPath.Length - 2)
                    }
                    if ($newPath.StartsWith('"') -and $newPath.EndsWith('"')) {
                        $newPath = $newPath.Substring(1, $newPath.Length - 2)
                    }
                    
                    $obj.OldPath = $oldPath
                    $obj.Path    = $newPath
                    $obj.Display = "$status $oldPath -> $newPath"
                } else {
                    $obj.Path = $rest
                    $obj.Display = "$status $rest"
                }
            } else {
                $obj.Path = $rest
                $obj.Display = "$status $rest"
            }
            
            [void]$results.Add($obj)
            $index++
            
        } catch {
            Write-Host "警告：无法解析行: $line" -ForegroundColor Yellow
            continue
        }
    }
    
    return $results.ToArray()
}

function Get-SafeCount {
    param($Collection)
    if ($null -eq $Collection) { return 0 }
    if ($Collection -is [array]) { return $Collection.Count }
    if ($Collection -is [System.Collections.ICollection]) { return $Collection.Count }
    return 1
}

function Show-RemainingFilesWarning {
    param([int]$Remaining, [int]$Total, [int]$Committed)
    
    if ($Remaining -gt 0) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
        Write-Host "║  ⚠️  注意：还有 $Remaining 个文件未提交！" -ForegroundColor Yellow
        Write-Host "║  📊 统计：初始 $Total 个 → 已提交 $Committed 个 → 剩余 $Remaining 个" -ForegroundColor Yellow
        Write-Host "║  💡 建议：输入 [r] 刷新列表，确认是否还有文件需要处理" -ForegroundColor Yellow
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
        Write-Host ""
    }
}

function Get-SafeFullPath {
    param([string]$RepoRoot, [string]$RelativePath)
    
    try {
        # 使用字符串拼接，避免 Join-Path 的问题
        $sep = [System.IO.Path]::DirectorySeparatorChar
        $cleanRoot = $RepoRoot.TrimEnd(@('\', '/'))
        $cleanRel = $RelativePath.TrimStart(@('\', '/'))
        return "$cleanRoot$sep$cleanRel"
    } catch {
        return $RelativePath
    }
}

# -----------------------------------------------------------------------------
# 2. 主逻辑
# -----------------------------------------------------------------------------

try {
    Write-Log "正在初始化..."
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { 
        throw "未找到 git 命令。" 
    }

    $repoRoot = Get-GitRoot
    if (-not $repoRoot) { 
        throw "未找到有效的 Git 仓库。" 
    }

    Set-Location $repoRoot
    Write-Log "仓库根目录: $repoRoot" "Success"

    if (-not (Check-GitState)) { 
        throw "请先解决 Git 状态锁问题。" 
    }

    $currentBranch = git branch --show-current
    if (-not $currentBranch) { 
        $currentBranch = "DETACHED_HEAD" 
    }
    Write-Log "当前分支: $currentBranch" "Info"

    if ($Config.ProtectMainBranch -and ($currentBranch -in "main", "master")) {
        Write-Log "!!! 警告：当前处于主分支 '$currentBranch' !!!" "Warn"
        $confirm = Read-Host "确定要继续操作吗？(输入 YES 继续)"
        if ($confirm -ne "YES") { 
            Write-Log "已取消。" "Info"
            exit 0 
        }
    }

    # 记录初始文件数
    $initialChanges = Parse-GitStatus
    $Global:InitialFileCount = Get-SafeCount $initialChanges
    Write-Log "检测到 $Global:InitialFileCount 个待处理文件" "Info"

    $doLoop = $true
    while ($doLoop) {
        Write-Host "`n----------------------------------------" -ForegroundColor Gray
        
        $changes = Parse-GitStatus
        $remainingCount = Get-SafeCount $changes
        
        if ($remainingCount -eq 0) {
            Write-Log "✓ 工作区干净，所有文件已处理完毕！" "Success"
            break
        }

        # 显示文件列表
        Write-Host "待处理变更 (共 $remainingCount 项)：" -ForegroundColor Cyan
        
        foreach ($change in $changes) {
            $color = "White"
            if ($change.Status -like "M*") { $color = "Yellow" }
            elseif ($change.Status -like "A*" -or $change.Status -like "??") { $color = "Green" }
            elseif ($change.Status -like "D*") { $color = "Red" }
            elseif ($change.Status -like "R*") { $color = "Magenta" }
            
            Write-Host " [$($change.Index)] $($change.Display)" -ForegroundColor $color
        }

        # 显示警告
        $committedCount = Get-SafeCount $Global:CommittedFiles
        if ($remainingCount -gt 0 -and $committedCount -gt 0) {
            Show-RemainingFilesWarning -Remaining $remainingCount -Total $Global:InitialFileCount -Committed $committedCount
        }

        Write-Host "`n指令: [数字]选择 | [a]全选 | [r]刷新 | [q]完成并推送 | [x]强制退出" -ForegroundColor White
        $inputStr = Read-Host "请输入"
        
        # 处理指令
        if ($inputStr -eq 'q') { 
            if ($remainingCount -gt 0) {
                Write-Host "`n⚠️  警告：还有 $remainingCount 个文件未提交！" -ForegroundColor Yellow
                Write-Host "这些文件将不会被推送到远程仓库。" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "剩余文件：" -ForegroundColor Yellow
                foreach ($c in $changes) {
                    Write-Host "  • $($c.Path)" -ForegroundColor Yellow
                }
                Write-Host ""
                $confirmQuit = Read-Host "确认要结束提交阶段吗？(输入 YES 确认，其他任意键返回)"
                if ($confirmQuit -ne "YES") {
                    Write-Log "已取消，继续处理文件..." "Info"
                    continue
                }
            }
            Write-Log "结束提交阶段，进入推送..." "Info"
            break 
        }
        
        if ($inputStr -eq 'x') { 
            Write-Log "已强制退出，未执行推送。" "Warn"
            exit 0 
        }
        
        if ($inputStr -eq 'r') { 
            Write-Log "正在刷新文件列表..." "Info"
            continue 
        }
        
        # 选择文件
        $selectedFiles = @()
        if ($inputStr -eq 'a') {
            $selectedFiles = $changes
            $selectCount = Get-SafeCount $selectedFiles
            Write-Log "已选择全部 $selectCount 个文件" "Info"
        } else {
            $indices = $inputStr -split "[,\s]+" | Where-Object { $_ -match "^\d+$" }
            foreach ($idx in $indices) {
                $item = $changes | Where-Object { $_.Index -eq [int]$idx }
                if ($item) { $selectedFiles += $item }
            }
        }

        $selectedCount = Get-SafeCount $selectedFiles
        if ($selectedCount -eq 0) { 
            Write-Log "未选择任何文件。" "Warn"
            continue 
        }

        Write-Log "正在暂存 $selectedCount 个文件..."
        $stagedFilesThisRound = @()

        foreach ($file in $selectedFiles) {
            $targetPath = $file.Path
            
            Write-Host "  处理: $targetPath" -ForegroundColor Gray
            
            # 使用安全路径
            $fullPath = Get-SafeFullPath -RepoRoot $repoRoot -RelativePath $targetPath
            
            # 目录检查
            try {
                if (Test-Path -LiteralPath $fullPath -PathType Container -ErrorAction SilentlyContinue) {
                    Write-Log "跳过目录: $targetPath" "Warn"
                    continue
                }
            } catch {
                # 忽略路径检查错误
            }

            # 敏感文件检查
            $isSensitive = $false
            foreach ($p in $Config.SensitivePatterns) {
                $fileName = Split-Path $targetPath -Leaf
                if ($targetPath -like $p -or $fileName -like $p) {
                    $isSensitive = $true
                    break
                }
            }
            if ($isSensitive) {
                Write-Host "!!! 敏感文件: $targetPath !!!" -ForegroundColor Red
                if ((Read-Host "确认暂存? (y/n)") -ne 'y') { 
                    continue 
                }
            }

            # 大文件检查
            try {
                if ((Test-Path -LiteralPath $fullPath -ErrorAction SilentlyContinue) -and $file.Status -notlike "D*") {
                    $fileInfo = Get-Item -LiteralPath $fullPath -ErrorAction SilentlyContinue
                    if ($fileInfo -and $fileInfo.Length) {
                        $sizeMB = $fileInfo.Length / 1MB
                        if ($sizeMB -gt $Config.LargeFileThresholdMB) {
                            $sizeStr = "{0:N2} MB" -f $sizeMB
                            Write-Log "大文件警告: $targetPath ($sizeStr)" "Warn"
                        }
                    }
                }
            } catch {
                # 忽略大小检查错误
            }

            # 执行 git add
            $err = & git add -v -- $targetPath 2>&1
            if ($LASTEXITCODE -eq 0) {
                $stagedFilesThisRound += $file
                Write-Host "  ✓ $targetPath" -ForegroundColor Green
            } else {
                Write-Log "暂存失败: $targetPath" "Error"
                Write-Host "  Git 错误: $err" -ForegroundColor Red
            }
        }

        $stagedCount = Get-SafeCount $stagedFilesThisRound
        if ($stagedCount -eq 0) { 
            Write-Log "本轮没有成功暂存任何文件。" "Warn"
            continue 
        }

        Write-Host "`n当前暂存区状态:" -ForegroundColor Green
        git status --short

        $msg = Read-Host "`nCommit Message (留空取消本次提交)"
        if ([string]::IsNullOrWhiteSpace($msg)) { 
            Write-Log "已取消提交。" "Warn"
            Write-Log "正在撤销暂存..." "Info"
            git reset HEAD
            continue 
        }

        & git commit -m "$msg"
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ Commit 成功！" "Success"
            foreach ($f in $stagedFilesThisRound) {
                if ($f.Path -notin $Global:CommittedFiles) { 
                    $Global:CommittedFiles += $f.Path 
                }
            }
        } else {
            Write-Log "Commit 失败，请检查错误信息。" "Error"
        }
    }

    # ========== 推送阶段 ==========
    Write-Host "`n========================================"
    Write-Host "进入推送阶段..." -ForegroundColor Cyan
    Write-Host "========================================"
    
    # 最后检查遗漏文件
    $finalCheck = Parse-GitStatus
    $finalCount = Get-SafeCount $finalCheck
    
    if ($finalCount -gt 0) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Red
        Write-Host "║  ❌ 发现遗漏文件！" -ForegroundColor Red
        Write-Host "║  以下 $finalCount 个文件未被提交：" -ForegroundColor Red
        Write-Host "╠════════════════════════════════════════╣" -ForegroundColor Red
        foreach ($f in $finalCheck) {
            Write-Host "║    • $($f.Path)" -ForegroundColor Red
        }
        Write-Host "╠════════════════════════════════════════╣" -ForegroundColor Red
        Write-Host "║  建议返回处理 (输入 n 返回)" -ForegroundColor Red
        Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Red
        Write-Host ""
        
        $continueWithMissing = Read-Host "仍然继续推送？(y/n)"
        if ($continueWithMissing -ne 'y') {
            Write-Log "已取消。请重新运行脚本处理遗漏文件。" "Warn"
            exit 0
        }
    }
    
    $upstream = git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null
    $shouldPush = $false

    if ($LASTEXITCODE -ne 0) {
        Write-Log "当前分支无上游分支，需要首次推送。" "Warn"
        $shouldPush = $true
    } else {
        $counts = git rev-list --left-right --count "$upstream...HEAD" 2>$null
        if ($counts -match "(\d+)\s+(\d+)") {
            $behind = [int]$matches[1]
            $ahead  = [int]$matches[2]
            
            if ($behind -gt 0) { 
                Write-Log "⚠ 本地落后远端 $behind 个提交，建议先执行 'git pull'。" "Error" 
                $shouldPush = $false
            }
            elseif ($ahead -gt 0) { 
                Write-Log "有 $ahead 个本地提交待推送。" "Info"
                $shouldPush = $true 
            }
            else {
                Write-Log "本地与远端已同步，无需推送。" "Success"
                $shouldPush = $false
            }
        }
    }

    if ($shouldPush) {
        Write-Host "`n准备推送到远程仓库..." -ForegroundColor Yellow
        
        $pushArgs = @("push")
        if (-not $upstream) { 
            Write-Log "将设置上游分支为: origin/$currentBranch" "Info"
            $pushArgs += @("-u", "origin", $currentBranch)
        }
        
        $confirm = Read-Host "确认推送? (y/n)"
        if ($confirm -eq 'y') {
            Write-Log "正在推送..." "Info"
            & git @pushArgs
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✓ 推送成功！" "Success"
            } else {
                Write-Log "✗ 推送失败，请检查网络或权限。" "Error"
            }
        } else {
            Write-Log "已取消推送。" "Warn"
        }
    }

    # 显示统计
    $committedCount = Get-SafeCount $Global:CommittedFiles
    $missedCount = $Global:InitialFileCount - $committedCount
    
    Write-Host "`n========================================" -ForegroundColor Gray
    Write-Host "📊 本次会话统计：" -ForegroundColor Cyan
    Write-Host "  • 初始文件数：$Global:InitialFileCount" -ForegroundColor White
    Write-Host "  • 已提交文件：$committedCount" -ForegroundColor Green
    Write-Host "  • 遗漏文件数：$missedCount" -ForegroundColor $(if ($missedCount -gt 0) { "Red" } else { "Green" })
    
    if ($committedCount -gt 0) {
        Write-Host "`n已提交的文件列表：" -ForegroundColor Cyan
        $Global:CommittedFiles | Sort-Object -Unique | ForEach-Object { 
            Write-Host "  • $_" -ForegroundColor White
        }
    }
    
    if ($missedCount -gt 0) {
        Write-Host "`n⚠️  提醒：有 $missedCount 个文件未提交" -ForegroundColor Yellow
    } else {
        Write-Host "`n✓ 所有文件都已成功处理！" -ForegroundColor Green
    }

} catch {
    Write-Host "`n[脚本错误] $_" -ForegroundColor Red
    Write-Host "错误位置: $($_.InvocationInfo.ScriptLineNumber) 行" -ForegroundColor Red
    Write-Host "堆栈信息: $($_.ScriptStackTrace)" -ForegroundColor Red
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")