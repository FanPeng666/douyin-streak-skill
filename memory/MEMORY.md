# douyin-streak-skill 项目记忆

## 项目定位
基于 Playwright 的抖音网页版自动续火花 Skill，直接导航到独立私信页面（chat?isPopup=1）操作。

## 技术栈
- Node.js 22.22.2 (managed) + Playwright 1.61.1 + Chromium 1228
- node_modules: Junction 软链到 `C:\Users\FireLeopardV\.workbuddy\binaries\node\workspace\node_modules`

## 执行流程（v2.2）
1. 解析 Prompt → 2. 启动浏览器+注入 Cookie → 3. 打开首页验证登录 → 4. 导航到 chat?isPopup=1 → 5. TreeWalker 文本扫描匹配好友 → 6. 搜索兜底（未找到的好友） → 7. 逐个发送：lookup 最新坐标 → 点击 → 验证头部 → 定位输入框 → 打字 → Enter/发送按钮 → 验证聊天面板 → 截图 → 8. 每轮后重新导航页面 → 9. 输出报告

## 关键 DOM 选择器
- 独立私信 URL: `https://www.douyin.com/chat?isPopup=1`
- 好友列表位置：左侧边栏，left ≈ 78，行容器 left ≈ 191
- 好友名称：TreeWalker 文本扫描，width > 20 且不是系统排除词
- 聊天头部验证：top 0-60, left >= 300
- 输入框：`[contenteditable="true"]`，width > 30px
- 发送按钮：`[class*="send-msg"]`
- 搜索框：`input`，left < 400, top < 100, width > 100
- 聊天面板验证：left >= 500 的右侧区域元素

## 核心避坑（2026-07-24 验证）
1. ✅ **独立私信页**：直接导航到 `chat?isPopup=1`，不再用 IM entry hover+click
2. ✅ **每轮页面重载**：发完一个好友后 `page.goto(chatURL)` 重置 React 状态
3. ✅ **fresh 坐标**：`findFriendCoord()` 实时查找，不用预扫描坐标
4. ✅ **验证范围限定**：仅检查左侧 >= 500 的右侧聊天面板，避开 streak 计数
5. ✅ **搜索兜底**：好友列表找不到时通过搜索框查找
6. ❌ **bodyHasMsg 用全页面文本**：会误中好友计数，应用 `chatPanelContains`
7. ❌ **closeChat 切换面板**：已废弃，页面重载替代
8. ❌ **IM entry hover+click**：已废弃

## Prompt 参数体系
| 参数 | 必传 | 默认值 |
|======|:====:|========|
| Cookie | **是** | 无 |
| 好友名称 | **是** | 无 |
| 发送内容 | 否 | 🔥 |

## GitHub 推送
统一使用 MCP push_files，不自动同步本地。详见 `memory/GIT_PUSH_RULE.md`。
辅助脚本：
- `scripts/sync_local.bat` — AI 调用执行 git fetch + reset（用户要求同步时）
- `scripts/generate_push_json.js` — AI 生成 MCP push payload
