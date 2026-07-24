/**
 * MCP推送payload生成器
 * 运行方式：node scripts/generate_push_json.js "commit message"
 *
 * 输出完整的 MCP push_files 参数 JSON，可直接用于 DeferExecuteTool 调用，
 * 省去 Read 每个文件后再拼接的 token 开销。
 */

const fs = require('fs');
const path = require('path');

const files = [
  'scripts/auto_streak.js',
  'scripts/config.js',
  'scripts/utils.js',
  'scripts/check_changelog.py',
  'scripts/sync_local.bat',
  'prompts/自动续火花.md',
  'README.md',
  'SKILL.md',
  '.workbuddy/settings.json',
  'memory/GIT_PUSH_RULE.md',
  'memory/MEMORY.md',
];

const commitMsg = process.argv[2] || 'chore: update';

const payload = {
  files: files
    .filter((f) => {
      const fp = path.join(__dirname, '..', f);
      return fs.existsSync(fp);
    })
    .map((f) => ({
      path: f,
      content: fs.readFileSync(path.join(__dirname, '..', f), 'utf-8'),
    })),
  message: commitMsg,
  owner: 'FanPeng666',
  repo: 'douyin-streak-skill',
  branch: 'main',
};

console.log(JSON.stringify(payload, null, 2));
