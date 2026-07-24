# Git 提交与远程推送规范

AI 在完成项目文件修改后，按照以下流程操作。

---

## 一、何时执行

- **写代码/改配置/改文档后** → 执行 MCP 推送（推远程，不同步本地）
- **用户说"同步到本地"** → 执行本地同步
- **仅执行续火花（无文件修改）** → 跳过所有 Git 操作

---

## 二、推送（MCP + 远程）

### 步骤

1. **生成 payload**：运行辅助脚本，输出完整的 MCP 调用参数：
   ```bash
   node scripts/generate_push_json.js "commit message"
   ```

   脚本会自动读取所有项目文件，拼接成 `push_files` 所需的 JSON 格式。

   如果不方便运行，手动组装参数：
   - `owner`: `FanPeng666`
   - `repo`: `douyin-streak-skill`
   - `branch`: `main`
   - `message`: Conventional Commits 格式
   - `files`: 只传**有修改**的文件，每个元素 `{ path, content }`

2. **调用 MCP**：`DeferExecuteTool → mcp__github__push_files`

3. **完成后**：输出推送的 SHA，**不碰本地 git**

### 禁止

- ❌ `git push origin main`
- ❌ `gh` CLI
- ❌ Force Push

---

## 三、本地同步（用户按需触发）

仅当用户说出"同步到本地"或等效指令时执行。

### 方式 A：同步工作区（默认）

```bash
cd /d C:\04_programme\Project\Skill_Project\douyin-streak-skill
git fetch origin
git reset --hard FETCH_HEAD
```

或双击 `scripts/sync_local.bat`（效果相同）。

### 方式 B：仅更新引用

```bash
git fetch origin
```

不覆盖工作区文件，仅更新远程指针。

---

## 四、Commit Message 规范

```
类型(范围): 简短描述

- 具体改动 1
- 具体改动 2
```

| 类型 | 场景 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `refactor` | 重构代码 |
| `docs` | 文档更新 |
| `chore` | 配置、工具、依赖 |

---

## 五、验证清单

推送后检查：

- [ ] `DeferExecuteTool` 返回了 SHA → 推送成功
- [ ] 文件内容中的引号/反斜杠已正确转义
- [ ] 没有 .gitignore 中的文件被推入
- [ ] 没动本地 git

同步后检查：

- [ ] `git log --oneline -3` 显示最新提交
- [ ] `git status --short` 工作区干净

---

## 六、远程仓库

```
https://github.com/FanPeng666/douyin-streak-skill
```
