# GitHub 推送规范

## 推送方式

使用 **GitHub 官方 MCP 工具**（`mcp__github__push_files`）作为代码推送的唯一方式。

**禁止**使用以下方式进行推送：
- `git push origin main` 命令行推送（因 headless 沙箱无 TTY 交互认证）
- `gh` CLI 推送（因当前环境未配置 gh 认证）
- 其他第三方脚本或工具推送

## 推送流程

### 适用条件
当工作区存在已提交的本地 Commit（`git log --oneline` 中存在未推送的记录），或存在需要提交的新修改时。

### 操作步骤

1. **获取文件内容**
   使用 `Read` 工具读取所有需要推送的文件的最新内容。

2. **调用 MCP 推送**
   使用 `DeferExecuteTool` 调用 `mcp__github__push_files`，传入以下参数：
   - `owner`：`FanPeng666`
   - `repo`：`douyin-streak-skill`
   - `branch`：`main`
   - `message`：符合 Conventional Commits 规范的 Commit Message（feat/fix/docs/refactor/chore 等）
   - `files`：数组，每个元素包含 `path`（文件路径）和 `content`（完整内容）

3. **同步本地仓库**
   推送成功后，执行：
   ```bash
   git fetch origin +refs/heads/main:refs/remotes/origin/main
   git reset --hard <SHA>
   ```
   其中 `<SHA>` 为 `push_files` 返回的 `object.sha` 值。

4. **验证**
   确认本地与远程一致：
   ```bash
   git log --oneline -5
   git status
   ```

## 注意事项

- `push_files` 会直接向 GitHub 远程仓库创建一个新的 Commit，不经过本地 Git 流程
- 推送后必须同步本地仓库（`git reset` 到推送的 SHA），否则本地和远程会分叉
- 文件内容中的特殊字符（如反斜杠、引号）需要正确转义
- `git push origin main` 在正常终端中仍可正常使用（仅 headless 沙箱禁止使用）
