# 抖音自动续火花 Skill

基于 [WorkBuddy](https://www.codebuddy.cn) 的抖音好友火花自动续期 Skill，通过 Playwright 浏览器自动化每天向指定好友发送续火消息。

> **公开仓库声明**：本仓库仅包含任务逻辑描述和可执行脚本，**不含任何 Cookie、Token 或个人隐私数据**。认证凭据通过 WorkBuddy 的 Prompt 输入框注入，不在仓库中存储。

---

## 功能

- 自动登录抖音网页版（Cookie 注入）
- 按好友名称列表匹配目标好友（可通过 Prompt 参数自定义）
- 向每位好友发送消息维持火花（内容可自定义）
- 发送后验证 + 异常重试 + 验证码检测

## 目录结构

```
├── .gitignore
├── CHANGELOG.md               # 版本概要索引
├── README.md
├── SKILL.md                   # WorkBuddy Skill 元数据
├── memory/
│   └── MEMORY.md              # 项目记忆与工作约定
├── docs/
│   └── changes/               # 详细变更记录（YYYY-MM-DD-HHmm.md）
├── prompts/
│   └── 自动续火花.md            # WorkBuddy 任务 Prompt
├── scripts/
│   ├── config.js              # 常量 + Prompt 参数解析
│   ├── utils.js               # 通用工具函数
│   └── auto_streak.js         # Playwright 自动化入口
```

## 技术栈

| 组件 | 用途 |
|------|------|
| Node.js 22 | ��本运行环境 |
| Playwright | 浏览器自动化（Cookie 注入、DOM 操作、消息发送） |
| Headless Chromium | 无头浏览器执行 |

## 架构设计

```
用户 Prompt 输入
  Cookie：xxx
  好友名称：火豹v    ← 必传
  发送内容：🔥       ← （可选，默认 🔥）
        │
        ▼
  parsePromptArgs(promptText)
  解析参数 → { cookie, friendNames, messageText }
        │
        ▼
  Playwright → Chromium → 抖音网页版 → 发送消息
        │
        ▼
  输出报告
```

所有参数通过 Prompt 传入，不落地文件。

## 使用方式

### 在 WorkBuddy 中使用

1. 克隆本仓库：
   ```bash
   git clone https://github.com/FanPeng666/douyin-streak-skill.git
   ```

2. 在 WorkBuddy 中设置工作区指向本仓库目录

3. 在对话或自动化任务中输入，例如：
   ```
   续火花
   Cookie：sessionid=xxx; passport_csrf_token=xxx; odin_tt=xxx; uid_tt=xxx; sid_tt=xxx; sid_guard=xxx; ttwid=xxx; s_v_web_id=xxx
   好友名称：火豹v
   发送内容：🔥
   ```

4. 设置定时触发（建议每天一次）

### 独立测试

```bash
# 将 Prompt 写入文件后执行
node scripts/auto_streak.js --prompt-file prompt.txt

# 或直接传入 Prompt 文本
node scripts/auto_streak.js "Cookie：sessionid=xxx; ..."
```

## Prompt 参数说明

| 参数名 | 必传 | 默认值 | 格式 |
|--------|:----:|--------|------|
| `Cookie` | **是** | 无 | 8 字段 Cookie 字符串 |
| `好友名称` | **是** | 无 | 好友用户名，多个用顿号/逗号分隔 |
| `发送内容` | 否 | 🔥 | 任意文本 |

Cookie 为精简 8 字段格式（`sessionid, passport_csrf_token, odin_tt, uid_tt, sid_tt, sid_guard, ttwid, s_v_web_id`）。

## 安全约定

| 允许 | 禁止 |
|------|------|
| 任务逻辑描述 | Cookie/Token 写入文件 |
| DOM 选择器与坐标 | 密码写入注释 |
| 异常处理策略 | 提交 reports/ 中的截图 |
| 历史故障记录（无敏感信息） | 上传 .env / credentials |

## License

MIT License
