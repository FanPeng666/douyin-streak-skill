# CHANGELOG

本文件仅记录版本概要。详细变更见 [docs/changes/](docs/changes/)。

---

## v2.3.0 (2026-07-23-1207)

### Added
- 新增 Stop Hook + `check_changelog.py` 自动检查变更记录机制
- 新增 `.workbuddy/settings.json` 项目级 hooks 配置

### Changed
- 好友名称参数从可选改为**必传**，移除默认值列表
- `parsePromptArgs` 中 `friendNames` 初始值从 `DEFAULT_FRIEND_NAMES` 改为 `null`
- SKILL.md / prompts / README / MEMORY 参数表同步更新

详见：[docs/changes/2026-07-23-1207.md](docs/changes/2026-07-23-1207.md)

---

## v2.2.1 (2026-07-23-1042)

### Fixed
- 修复 `parseCookies` 调用缺失 `domain` 参数导致 Cookie 注入失败
- 修复好友点击后聊天未打开的验证遗漏

详见：[docs/changes/2026-07-23-1042.md](docs/changes/2026-07-23-1042.md)

---

## v2.2.0 (2026-07-23-0026)

### Added
- 新增 `fmtLogTime()` 和 `validLogTime()` 时间格式工具函数
- 新增 `memory/MEMORY.md`（从 `.workbuddy/memory/` 移至根目录）
- 新增「十二、任务记录」章节（`prompts/自动续火花.md`）
- 新增「项目工作约定」自动变更记录规则（`memory/MEMORY.md`）

### Changed
- 日志时间格式统一为 `YYYY-MM-DD-HHmm`（示例：2026-07-23-1430）
- 报告文件名和 CHANGELOG 版本日期同步采用新格式

详见：[docs/changes/2026-07-23-0026.md](docs/changes/2026-07-23-0026.md)

---

## v2.1.0 (2026-07-23-0021)

### Added
- 新增 `scripts/utils.js`
- 新增 `docs/changes/` 详细变更记录目录
- 新增 `memory/MEMORY.md` 项目记忆与工作约定
- 新增自动 CHANGELOG 维护机制

### Changed
- `auto_streak.js` 引入 utils 模块，移除内联函数
- 修复重复 `const fs/path = require(...)` 声明
- 发送策略改为 Enter 优先 + hover+click 兜底
- CHANGELOG 重构为概要索引格式

详见：[docs/changes/2026-07-23-0021.md](docs/changes/2026-07-23-0021.md)

---

## v2.0.0 (2026-07-23-0021)

### Added
- Prompt 参数体系（Cookie/好友名称/发送内容通过 Prompt 传入）
- `parsePromptArgs()` 解析函数
- 多维反检测（languages/plugins/chrome.runtime）
- `switchToPrivateMessageTab()` 私信 Tab 切换

### Changed
- `COOKIE_DOMAIN` → `COOKIE`（必传，无默认值）
- `FRIEND_NAMES` → `DEFAULT_FRIEND_NAMES`（可选）
- `MESSAGE_TEXT` → `DEFAULT_MESSAGE_TEXT`（可选）
- 好友匹配从 class 选择器 → TreeWalker 文本扫描
- 好友点击从坐标 → Playwright locator
- 验证增加 body 文本兜底

详见：[docs/changes/2026-07-23-0021.md](docs/changes/2026-07-23-0021.md)

---

## v1.0.0 (2026-07-21)

### Added
- 基于 Playwright 的抖音网页版自动续火花 Skill
- Cookie 通过 CLI 参数传入
- 基础 DOM 选择器 + 坐标定位
- 验证码检测 + 异常重试
