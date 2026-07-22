# 抖音自动续火花 Skill

基于 [WorkBuddy](https://www.codebuddy.cn) 的抖音好友火花自动续期 Skill，通过 Playwright 浏览器自动化每天向指定好友发送续火消息。

> ⚠️ **公开仓库声明**：本仓库仅包含任务逻辑描述和可执行脚本，**不含任何 Cookie、Token 或个人隐私数据**。认证凭据通过 WorkBuddy 自动化 prompt 输入框注入，不在仓库中存储。

---

## 功能

- 自动登录抖音网页版（Cookie 注入）
- 按好友名称列表匹配目标好友（瑞士、江川、老张、赵坤）
- 向每位好友发送 `🔥` 消息维持火花
- 发送后验证 + 异常重试 + 验证码检测

## 目录结构

```
├── .gitignore
├── README.md
├── prompts/
│   └── 自动续火花.md          # WorkBuddy 任务 Prompt（逻辑描述）
├── scripts/
│   └── auto_streak.js         # Playwright 自动化脚本（无 Cookie）
└── reports/
    ├── 2026-07-21-面板未渲染.md   # 历史故障记录
    └── 2026-07-21-贴纸迭代失败.md
```

## 技术栈

| 组件 | 用途 |
|------|------|
| Node.js 22 | 脚本运行环境 |
| Playwright | 浏览器自动化（Cookie 注入、DOM 操作、消息发送） |
| Headless Chromium | 无头浏览器执行 |

## 架构设计

```
┌─ Prompt（公开，prompts/）──┐    ┌─ Cookie（私密，WorkBuddy 输入框）─┐
│ 任务逻辑 + DOM 选择器 + 流程  │    │ sessionid=xxx; passport_csrf=xxx... │
└─────────────────────────────┘    └────────────────────────────────────┘
              ↓                                      ↓
         WorkBuddy Automation 读取 Prompt + Cookie
              ↓
     命令：node scripts/auto_streak.js "<cookie>"
              ↓
    Playwright → Chromium → 抖音网页版 → 发送 🔥
              ↓
         输出报告（本地，不上传）
```

## 使用方式

### 在 WorkBuddy 中使用

1. 克隆本仓库：
   ```bash
   git clone https://github.com/FanPeng666/douyin-streak-skill.git
   ```

2. 在 WorkBuddy 中设置工作区指向本仓库目录

3. 创建自动化任务，prompt 内容为：
   ```
   读取 prompts/自动续火花.md，使用下方 Cookie 执行：
   sessionid=xxx; passport_csrf_token=xxx; odin_tt=xxx; uid_tt=xxx; sid_tt=xxx; sid_guard=xxx; ttwid=xxx; s_v_web_id=xxx
   ```

4. 设置定时触发（建议每天一次）

### 独立测试

```bash
# 需要先安装 Playwright + Chromium
node scripts/auto_streak.js "sessionid=xxx; passport_csrf_token=xxx; ..."
```

Cookie 为精简 8 字段格式（`sessionid, passport_csrf_token, odin_tt, uid_tt, sid_tt, sid_guard, ttwid, s_v_web_id`）。

## 安全约定

| ✅ 可以 | ❌ 不可以 |
|---------|-----------|
| 任务逻辑描述 | Cookie/Token 写入文件 |
| DOM 选择器与坐标 | 密码写入注释 |
| 异常处理策略 | 提交 reports/ 中的截图 |
| 历史故障记录（无敏感信息） | 上传 .env / credentials |

## License

MIT License
