---
name: douyin-streak
description: 抖音好友火花自动续期，每天向指定好友（瑞士、江川、老张、赵坤）发送 🔥 消息维持火花
version: 1.0.0
triggers:
  - 续火花
  - 抖音续火
  - 自动续火
  - 抖音火花
  - douyin streak
---

## 概述

通过 Playwright 浏览器自动化，登录抖音网页版（www.douyin.com），在消息面板中按好友名称匹配目标用户，依次发送 🔥 文本消息以维持火花。

## 前置条件

- Node.js 22 + Playwright ≥ 1.40 + Chromium
- 抖音精简 8 字段 Cookie（通过 Prompt 命令行参数传入）

## 执行流程

1. 用户在 WorkBuddy 对话或自动化任务中输入触发词（如「续火花」）
2. WorkBuddy 读取 `prompts/自动续火花.md` 获取完整任务指令
3. 运行 `node scripts/auto_streak.js "<cookie>"`
4. 脚本输出发送报告（Markdown 表格格式）

## 认证

Cookie 通过命令行参数传入脚本，不写入任何文件。

精简 8 字段格式：
```
sessionid=xxx; passport_csrf_token=xxx; odin_tt=xxx; uid_tt=xxx;
sid_tt=xxx; sid_guard=xxx; ttwid=xxx; s_v_web_id=xxx
```

## 目标好友

```
瑞士、江川、老张、赵坤
```

## 安全约定

| ✅ | ❌ |
|----|-----|
| Cookie 通过 CLI 参数传递 | Cookie 写入文件或日志 |
| 所有文件可公开 | 提交 .env / credentials |
| 配置文件只记字段名 | 配置文件记 Cookie 值 |

## 文件结构

```
├── SKILL.md                     ← 本文件
├── README.md
├── prompts/
│   └── 自动续火花.md              ← WorkBuddy 任务 Prompt
├── scripts/
│   ├── config.js                ← 常量集中管理
│   └── auto_streak.js           ← Playwright 自动化入口
└── reports/                     ← 历史执行记录
```
