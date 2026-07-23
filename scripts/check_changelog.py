#!/usr/bin/env python3
"""
Stop Hook 检查脚本
在每次任务结束时自动检查：
1. 是否有代码/脚本/配置/文档文件被修改
2. 如果有修改，docs/changes/ 下是否已有今天的变更记录
3. CHANGELOG.md 是否已更新

返回 exit code：
- 0 = 检查通过，或没有需要检查的变更
- 1 = 检查发现遗漏（会触发提醒但不阻断任务）
"""

import os
import sys
import glob
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_mtime(path):
    try:
        return os.path.getmtime(path)
    except OSError:
        return 0


def check():
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    issues = []

    source_patterns = [
        "scripts/*.js",
        "SKILL.md",
        "README.md",
        "prompts/*.md",
        "memory/*.md",
        ".workbuddy/settings.json",
    ]

    modified_sources = []
    for pattern in source_patterns:
        for f in glob.glob(os.path.join(PROJECT_DIR, pattern)):
            mtime = get_mtime(f)
            if mtime > 0:
                modified_sources.append((f, mtime))

    modified_sources.sort(key=lambda x: -x[1])

    if not modified_sources:
        return 0

    changes_dir = os.path.join(PROJECT_DIR, "docs", "changes")
    today_changes_files = []
    if os.path.isdir(changes_dir):
        for f in os.listdir(changes_dir):
            if f.startswith(today_str) and f.endswith(".md"):
                today_changes_files.append(f)

    if not today_changes_files:
        issues.append(
            f"⚠️ 检测到以下文件有修改，但 docs/changes/ 下缺少今天的变更记录：\n"
        )
        for f, _ in modified_sources[:5]:
            rel = os.path.relpath(f, PROJECT_DIR)
            issues.append(f"   - {rel}")
        issues.append(f"\n  请创建 docs/changes/{now.strftime('%Y-%m-%d-%H%M')}.md")

    changelog_path = os.path.join(PROJECT_DIR, "CHANGELOG.md")
    if os.path.isfile(changelog_path):
        with open(changelog_path, "r", encoding="utf-8") as f:
            content = f.read()
        if today_str not in content:
            issues.append(
                "⚠️ CHANGELOG.md 中没有今天的日期记录。"
                "请在顶部追加版本条目 (YYYY-MM-DD-HHmm)。"
            )
    else:
        issues.append("⚠️ CHANGELOG.md 不存在，请新建并记录本次变更。")

    if issues:
        print("\n=== 变更记录检查 ===")
        print("\n".join(issues))
        print("\n请按 SKILL.md 中的「工作规范」补充变更记录。")
        print("========================\n")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(check())
