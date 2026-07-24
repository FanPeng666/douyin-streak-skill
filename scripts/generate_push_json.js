/**
 * MCP推送payload生成器
 *
 * 运行方式：
 *   node scripts/generate_push_json.js "commit message"            # 自动检测 git diff
 *   node scripts/generate_push_json.js "commit message" --all      # 强制推全部
 *   node scripts/generate_push_json.js "commit message" file1 file2 # 手动指定
 *
 * 输出完整的 MCP push_files 参数 JSON，可直接用于 DeferExecuteTool 调用。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT = path.join(__dirname, '..');

// ── 硬编码兜底列表（git diff 失败时用） ──
const FALLBACK_FILES = [
  'scripts/auto_streak.js',
  'scripts/config.js',
  'scripts/utils.js',
  'scripts/check_changelog.py',
  'scripts/sync_local.bat',
  'scripts/generate_push_json.js',
  'prompts/自动续火花.md',
  'README.md',
  'SKILL.md',
  '.workbuddy/settings.json',
  'memory/GIT_PUSH_RULE.md',
  'memory/MEMORY.md',
];

// ── 解析参数 ──
const commitMsg = process.argv[2] || 'chore: update';
const restArgs = process.argv.slice(3);

/** 通过 git diff 检测修改过的文件 */
function getChangedFiles() {
  try {
    const diff = execSync('git diff --name-only', { cwd: PROJECT }).toString().trim();
    const staged = execSync('git diff --cached --name-only', { cwd: PROJECT }).toString().trim();
    const untracked = execSync('git ls-files --others --exclude-standard', { cwd: PROJECT }).toString().trim();

    const changed = new Set();
    for (const line of [...diff.split('\n'), ...staged.split('\n'), ...untracked.split('\n')]) {
      const f = line.trim();
      if (f) changed.add(f);
    }
    return [...changed];
  } catch {
    return null;
  }
}

function getFiles() {
  if (restArgs.length > 0) {
    return restArgs.filter((f) => !f.startsWith('--'));
  }
  if (restArgs.includes('--all')) return FALLBACK_FILES;

  const changed = getChangedFiles();
  if (changed && changed.length > 0) {
    return changed.filter((f) => {
      const fp = path.join(PROJECT, f);
      return fs.existsSync(fp) && !f.startsWith('.git') && !f.startsWith('node_modules');
    });
  }
  return FALLBACK_FILES;
}

const targetFiles = getFiles();

const payload = {
  files: targetFiles.map((f) => ({
    path: f,
    content: fs.readFileSync(path.join(PROJECT, f), 'utf-8'),
  })),
  message: commitMsg,
  owner: 'FanPeng666',
  repo: 'douyin-streak-skill',
  branch: 'main',
};

console.log(JSON.stringify(payload, null, 2));
