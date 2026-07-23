#!/usr/bin/env python3
"""
Stop Hook 检查脚本
在每次任务结束时自动检测变更记录是否完整。

返回 exit code：
- 0 = 检查通过，或没有需要检查的变更
- 1 = 检查发现遗漏
"""

import os
import sys
import glob
import subprocess
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def git(*args):
    """运行 git 命令，返回 (stdout, stderr, exitcode)"""
    try:
        r = subprocess.run(
            ["git"] + list(args),
            capture_output=True,
            text=True,
            cwd=PROJECT_DIR,
            timeout=10,
        )
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except Exception:
        return "", "git command failed", -1


def get_mtime(path):
    try:
        return os.path.getmtime(path)
    except OSError:
        return 0


def check():
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    issues = []
    source_list = []

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
    source_list = [os.path.relpath(f, PROJECT_DIR) for f, _ in modified_sources]

    if not modified_sources:
        return 0

    changes_dir = os.path.join(PROJECT_DIR, "docs", "changes")
    today_changes_files = []
    if os.path.isdir(changes_dir):
        for f in os.listdir(changes_dir):
            if f.startswith(today_str) and f.endswith(".md"):
                today_changes_files.append(f)

    changes_missing = len(today_changes_files) == 0
    if changes_missing:
        issues.append(
            f"docs/changes/ 缺少今天的变更记录（已修改：{', '.join(source_list)}）"
        )

    changelog_path = os.path.join(PROJECT_DIR, "CHANGELOG.md")
    changelog_missing = False
    if os.path.isfile(changelog_path):
        with open(changelog_path, "r", encoding="utf-8") as f:
            content = f.read()
        if today_str not in content:
            changelog_missing = True
            issues.append("CHANGELOG.md 缺少今日版本条目")
    else:
        changelog_missing = True
        issues.append("CHANGELOG.md 不存在")

    stdout, _, _ = git("status", "--porcelain")
    has_uncommitted = bool(stdout)
    if has_uncommitted:
        issues.append("存在未提交的变更")

    _, _, push_rc = git("rev-parse", "origin/main")
    has_unpushed = False
    if push_rc == 0:
        local, _, _ = git("rev-parse", "HEAD")
        remote, _, _ = git("rev-parse", "origin/main")
        if local and remote and local != remote:
            has_unpushed = True
            issues.append("存在未推送的 commit，请按 memory/GIT_PUSH_RULE.md 使用 GitHub MCP 工具推送")

    if issues:
        print("=== 变更记录检查结果 ===")
        print(f"需要处理：是")
        print(f"已修改源文件：{'|'.join(source_list)}")
        print(f"issues：{'|'.join(issues)}")
        print(f"changes_missing：{str(changes_missing).lower()}")
        print(f"changelog_missing：{str(changelog_missing).lower()}")
        print(f"has_uncommitted：{str(has_uncommitted).lower()}")
        print(f"has_unpushed：{str(has_unpushed).lower()}")
        print("=======================")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(check())
