# douyin-streak-skill 项目记忆

## 项目定位
基于 Playwright 的抖音网页版自动续火花 Skill，通过 Prompt 参数传入 Cookie/好友名称/发送内容。

## 技术栈
- Node.js 22.22.2 (managed) + Playwright 1.61.1 + Chromium 1228
- node_modules: Junction 软链到 `C:\Users\FireLeopardV\.workbuddy\binaries\node\workspace\node_modules`
- UA: Chrome 127.0.0.0 (匹配 Chromium 1228)

## 关键 DOM 选择器 (2026-07-22 验证)
- IM 入口: `[data-e2e="im-entry"]` (坐标约 1414,28)
- 私信 tab: `text=私信` (x>1000 右侧面板)
- 好友名: 文本扫描 (TreeWalker, x>1000, y>150, width>20)
- 输入框: `[contenteditable="true"]` (DraftEditor, 约 1036,607)
- 发送按钮: `[class*="send-msg"]` (约 1449,600)

## 核心避坑
1. Cookie 注入后需**刷新页面**让 Cookie 生效
2. 消息面板默认在「互动消息」→ 需切换「私信」tab
3. class 名不稳定（conversationConversationItemtitle 已废弃）→ 用文本扫描
4. 好友名宽度仅 32px → 宽阈值设 20px
5. 点击好友用 Playwright locator（`text="好友名"`），不要用坐标
6. 发送用点击发送按钮（`[class*="send-msg"]`），不用 Enter
7. 验证用 body 文本检查兜底

## Prompt 参数体系
| 参数 | 必传 | 默认值 |
|------|:--:|--------|
| Cookie | 是 | 无 |
| 好友名称 | 否 | 瑞士、江川、老张、赵坤 |
| 发送内容 | 否 | 🔥 |

## 反检测措施
```js
navigator.webdriver = false
navigator.languages = ['zh-CN', 'zh', 'en']
navigator.plugins = [1,2,3,4,5]
window.chrome = { runtime: {}, loadTimes: () => ({}), csi: () => ({}) }
```

## 执行流程
1. 解析 Prompt → 2. 启动浏览器+注入 Cookie → 3. 刷新页面 → 4. 关闭弹窗 → 5. 点 IM 入口 → 6. 切私信 tab → 7. 文本扫描匹配好友 → 8. locator 点击好友 → 9. 找输入框 → 10. 输入消息 → 11. 点发送按钮 → 12. 验证 → 13. 关闭聊天 → 14. 循环 → 15. 输出报告

## 项目工作约定

### 自动变更记录
对本项目完成任何代码/配置/文档修改后，必须：
1. 在 `docs/changes/YYYY-MM-DD-HHmm.md` 写入详细变更记录
2. 在 `CHANGELOG.md` 顶部追加版本概要 + 链接到详细记录
3. 时间格式严格为 `YYYY-MM-DD-HHmm`，使用 `fmtLogTime()` 生成
4. 具体格式和规范参照 `SKILL.md` 中的「工作规范」章节

### GitHub 推送
GitHub 推送方式见 `memory/GIT_PUSH_RULE.md`，统一使用官方 GitHub MCP 工具。
