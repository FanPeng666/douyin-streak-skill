---
name: douyin-streak
description: 抖音好友火花自动续期，通过 Prompt 参数传入 Cookie / 好友名称 / 发送内容，每天向指定好友发送消息维持火花
version: 2.0.0
triggers:
  - 续火花
  - 抖音续火
  - 自动续火
  - 抖音火花
  - douyin streak
---

## 概述

通过 Playwright 浏览器自动化，登录抖音网页版（www.douyin.com），在消息面板中按好友名称匹配目标用户，依次发送文本消息以维持火花。

所有可变参数（Cookie、好友名称、发送内容）均通过用户 Prompt 输入传入，不写入文件。

## 前置条件

- Node.js 22 + Playwright >= 1.40 + Chromium
- 抖音精简 8 字段 Cookie（通过 Prompt 参数传入）

## 执行流程

1. 用户在 WorkBuddy 对话或自动化任务中输入触发词（如「续火花」），附带参数
2. WorkBuddy 读取 `prompts/自动续火花.md` 获取完整任务指令
3. 从用户 Prompt 中解析参数（Cookie、好友名称、发送内容）
4. 运行 `node scripts/auto_streak.js`，将解析后的参数传入
5. 脚本输出发送报告（Markdown 表格格式）

## Prompt 参数

用户在触发词后按以下格式传入参数（每行一个，中英文冒号均可）：

```
Cookie：sessionid=xxx; passport_csrf_token=xxx; odin_tt=xxx; uid_tt=xxx; sid_tt=xxx; sid_guard=xxx; ttwid=xxx; s_v_web_id=xxx
好友名称：瑞士、江川、老张、赵坤
发送内容：🔥
```

| 参数名 | 必传 | 默认值 | 说明 |
|--------|------|--------|------|
| Cookie | **是** | 无 | 抖音 8 字段 Cookie 字符串 |
| 好友名称 | 否 | 瑞士、江川、老张、赵坤 | 中文顿号或逗号分隔 |
| 发送内容 | 否 | 🔥 | 要发送的消息文本 |

- Cookie 未提供 → 终止并提示「Cookie 未提供」
- 好友名称未提供 → 使用默认列表
- 发送内容未提供 → 使用默认 🔥

## 认证

Cookie 通过 Prompt 参数传入，不写入任何文件。

精简 8 字段格式：
```
sessionid=xxx; passport_csrf_token=xxx; odin_tt=xxx; uid_tt=xxx;
sid_tt=xxx; sid_guard=xxx; ttwid=xxx; s_v_web_id=xxx
```

## 目标好友

默认列表（可通过 Prompt 参数「好友名称」覆盖）：
```
瑞士、江川、老张、赵坤
```

## 安全约定

| 允许 | 禁止 |
|------|------|
| Cookie 通过 Prompt 参数传入 | Cookie 写入文件或日志 |
| 所有文件可公开 | 提交 .env / credentials / reports/ |
| 配置文件只记字段名和默认值 | 配置文件记 Cookie 值 |

## 文件结构

```
├── SKILL.md                     ← 本文件
├── README.md
├── CHANGELOG.md                 ← 版本概要索引
├── docs/
│   └── changes/                 ← 详细变更记录
├── prompts/
│   └── 自动续火花.md              ← WorkBuddy 任务 Prompt
├── scripts/
│   ├── config.js                ← 常量 + Prompt 参数解析
│   ├── utils.js                 ← 通用工具函数
│   └── auto_streak.js           ← Playwright 自动化入口
```
