// 抖音自动续火花 — Playwright 自动化脚本
// 参数通过 Prompt 输入传入，由 parsePromptArgs 解析
// 所有常量定义在 config.js，不含任何敏感数据

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { sleep, parseCookies, safeClick, fmtLogTime } = require('./utils');

// ============================================
// 参数解析
// ============================================

let promptText = '';
if (process.argv[2] === '--prompt-file' && process.argv[3]) {
  promptText = fs.readFileSync(process.argv[3], 'utf-8');
} else {
  promptText = process.argv[2] || process.env.STREAK_PROMPT || '';
}

const params = config.parsePromptArgs(promptText);

if (!params.cookie) {
  console.error('❌ Cookie 未提供');
  process.exit(1);
}
if (!params.friendNames || params.friendNames.length === 0) {
  console.error('❌ 好友名称未提供');
  process.exit(1);
}
if (!params.messageText) {
  console.error('❌ 发送内容为空');
  process.exit(1);
}

const FRIEND_NAMES = params.friendNames;
const MESSAGE_TEXT = params.messageText;
const COOKIE_STR = params.cookie;

console.log('='.repeat(50));
console.log('抖音自动续火花');
console.log('='.repeat(50));
console.log(`好友列表: ${FRIEND_NAMES.join(', ')}`);
console.log(`发送内容: ${MESSAGE_TEXT}`);
console.log(`好友数量: ${FRIEND_NAMES.length}`);
console.log('');

const CHAT_URL = config.CHAT_URL;

// ============================================
// Cookie 注入
// ============================================

const cookies = parseCookies(COOKIE_STR, config.COOKIE_DOMAIN);

// ============================================
// 页面交互辅助函数
// ============================================

async function dismissLoginSavePopup(page) {
  try {
    const cancelBtn = page.locator('text=取消').first();
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelBtn.click({ timeout: 3000 });
      console.log('  [弹窗] 已关闭"是否保存登录信息"');
      await sleep(1000);
    }
  } catch (_) {}
}

async function closeQrLoginPopup(page) {
  try {
    const qrPopup = page.locator('text=登录后免费畅享高清视频').first();
    if (await qrPopup.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  [弹窗] 检测到二维码登录弹窗，关闭中...');
      const closeX = page.locator('[class*="modal"] [class*="close"], [class*="dialog"] [class*="close"], [class*="Modal"] svg').first();
      try { if (await closeX.isVisible({ timeout: 1000 }).catch(() => false)) { await closeX.click({ timeout: 2000 }); await sleep(500); } } catch (_) {}
      try { await page.keyboard.press('Escape'); await sleep(500); } catch (_) {}
    }
  } catch (_) {}
}

async function checkLoginState(page) {
  try {
    return await page.evaluate(() => {
      const text = document.body.innerText;
      if (text.includes('登录后免费畅享') || text.includes('扫码登录')) return false;
      const hasImEntry = !!document.querySelector('[data-e2e="im-entry"]');
      const hasUserNav = text.includes('朋友') && text.includes('我的');
      return hasImEntry || hasUserNav;
    });
  } catch (_) { return false; }
}

/** 截图保存到 screenshots/ 目录 */
async function takeScreenshot(page, subdir, name) {
  try {
    const dir = path.join(__dirname, '..', 'screenshots', subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`  截图已保存: screenshots/${subdir}/${name}.png`);
  } catch (_) {}
}

/** 获取聊天区最后一条消息文本（仅右侧聊天面板） */
async function getLastMessageText(page) {
  try {
    return await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll('[class*="message"], [class*="Message"], [class*="chat-msg"], [class*="DraftEditor"], [class*="bubble"]'));
      const rightEls = allEls.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left >= 500 && r.width > 20 && r.height > 10;
      });
      if (rightEls.length === 0) return '';
      rightEls.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
      const last = rightEls[0];
      const text = (last.innerText || last.textContent || '').trim();
      return text;
    });
  } catch (_) { return ''; }
}

/** 检查右侧聊天面板是否包含指定文本 */
async function chatPanelContains(page, text) {
  try {
    return await page.evaluate((t) => {
      const allEls = Array.from(document.querySelectorAll('[class*="message"], [class*="Message"], [class*="chat-msg"], [class*="DraftEditor"], [class*="bubble"], [class*="chat"]'));
      const rightText = allEls.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left >= 500;
      }).map((el) => el.innerText || '').join('\n');
      return rightText.includes(t);
    }, text);
  } catch (_) { return false; }
}

// ============================================
// 主流程
// ============================================

async function main() {
  const startTime = Date.now();
  const results = [];

  console.log('[1/6] 启动浏览器...');
  const browser = await chromium.launch({ headless: true, args: config.BROWSER_ARGS });
  const context = await browser.newContext({ viewport: config.VIEWPORT, userAgent: config.USER_AGENT });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    window.chrome = { runtime: {}, loadTimes: () => ({}), csi: () => ({}) };
  });

  await context.addCookies(cookies);
  console.log(`  已注入 ${cookies.length} 个 Cookie`);

  const page = await context.newPage();

  try {
    // ── 第 2 步：登录验证 ──
    console.log('[2/6] 访问抖音并验证登录状态...');
    await page.goto(config.DOUYIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(config.PAGE_LOAD_WAIT);
    await dismissLoginSavePopup(page);
    await closeQrLoginPopup(page);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(config.PAGE_LOAD_WAIT);
    await dismissLoginSavePopup(page);
    await closeQrLoginPopup(page);

    const title = await page.title();
    if (!title.includes(config.PAGE_TITLE_CHECK)) {
      console.error(`❌ 登录失败，页面标题: "${title}"`);
      await browser.close();
      process.exit(1);
    }
    const isLoggedIn = await checkLoginState(page);
    if (!isLoggedIn) {
      console.error('❌ Cookie 注入后未登录');
      await browser.close();
      process.exit(1);
    }
    console.log(`  登录成功: "${title}"`);

    // ── 第 3 步：直接打开私信页面 ──
    console.log('[3/6] 打开私信页面...');
    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
    await dismissLoginSavePopup(page);
    console.log('  私信页面已加载');

    // ── 第 4 步：按名称匹配好友 ──
    console.log('[4/6] 按名称匹配好友...');

    const matchedFriends = await page.evaluate((friendNames) => {
      const results = [];
      const candidates = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent.trim();
        if (!text || text.length > 20) continue;
        const parent = node.parentElement;
        if (!parent) continue;
        const rect = parent.getBoundingClientRect();
        if (rect.left < 50 || rect.top < 60 || rect.width < 20) continue;
        const excludes = ['互动消息', '全部消息', '私信', '去设置', '下载', '下载客户端',
          '消息', '通知', '赞了你的作品', '赞了你的评论', '关注了你', '等', '回关',
          '推荐了你的视频', '直播中', '重燃中', '在线', '分钟前在线', '小时前在线',
          '开启读屏标签', '读屏标签已关闭', '是否保存登录信息'];
        if (excludes.some((e) => text === e || text.startsWith(e))) continue;
        let row = parent;
        for (let i = 0; i < 5; i++) {
          if (!row) break;
          const r = row.getBoundingClientRect();
          if (r.width > 150 && r.height > 40) {
            candidates.push({
              text,
              x: r.left + r.width / 2,
              y: r.top + r.height / 2,
              left: r.left, top: r.top,
              width: r.width, height: r.height
            });
            break;
          }
          row = row.parentElement;
        }
      }

      candidates.sort((a, b) => a.y - b.y);
      const deduped = [];
      let lastY = 0;
      for (const c of candidates) {
        if (Math.abs(c.y - lastY) > 30) {
          deduped.push(c);
          lastY = c.y;
        }
      }

      for (let i = 0; i < friendNames.length; i++) {
        const name = friendNames[i];
        for (const c of deduped) {
          if (c.text === name) {
            results.push({ name, x: Math.round(c.x), y: Math.round(c.y), index: i });
            break;
          }
        }
      }
      results.sort((a, b) => a.index - b.index);
      return results;
    }, FRIEND_NAMES);

    console.log(`  匹配到 ${matchedFriends.length} 位好友:`);
    for (const f of matchedFriends) {
      console.log(`    ✓ ${f.name} (${Math.round(f.x)}, ${Math.round(f.y)})`);
    }
    const matchedNames = new Set(matchedFriends.map((f) => f.name));
    const unfoundNames = FRIEND_NAMES.filter((n) => !matchedNames.has(n));
    if (unfoundNames.length > 0) {
      console.log(`  搜索未找到的好友: ${unfoundNames.join(', ')}`);
      const searchBoxPos = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        for (const inp of inputs) {
          const r = inp.getBoundingClientRect();
          if (r.width > 100 && r.left < 400 && r.top < 100) {
            return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
          }
        }
        return null;
      });

      if (searchBoxPos) {
        for (const name of unfoundNames) {
          await page.mouse.click(searchBoxPos.x, searchBoxPos.y);
          await sleep(500);
          await page.keyboard.press('Control+a');
          await page.keyboard.press('Backspace');
          await sleep(300);
          await page.keyboard.type(name, { delay: 80 });
          await sleep(2000);

          const found = await page.evaluate((targetName) => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while ((node = walker.nextNode())) {
              const text = node.textContent.trim();
              if (text !== targetName) continue;
              const parent = node.parentElement;
              if (!parent) continue;
              const rect = parent.getBoundingClientRect();
              if (rect.top < 60 || rect.width === 0) continue;
              let row = parent;
              for (let i = 0; i < 6; i++) {
                if (!row) break;
                const r = row.getBoundingClientRect();
                if (r.width > 200 && r.height > 40) {
                  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
                }
                row = row.parentElement;
              }
              return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
            }
            return null;
          }, name);

          if (found) {
            matchedFriends.push({ name, x: found.x, y: found.y, index: matchedFriends.length });
            matchedNames.add(name);
            console.log(`    🔍 通过搜索找到 ${name} (${found.x}, ${found.y})`);
          } else {
            console.log(`    ✗ ${name} — 搜索也未找到`);
            results.push({ name, message: MESSAGE_TEXT, verified: false, duration: '0s', status: '❌ 搜索未找到' });
          }
        }

        try {
          await page.mouse.click(searchBoxPos.x, searchBoxPos.y);
          await sleep(500);
          await page.keyboard.press('Control+a');
          await page.keyboard.press('Backspace');
          await sleep(1000);
        } catch (_) {}
      }
    }

    // ── 第 5 步：逐个发送消息 ──
    console.log('[5/6] 逐个发送消息...');

    async function findFriendCoord(page, targetName) {
      return await page.evaluate((name) => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent.trim();
          if (text !== name) continue;
          const parent = node.parentElement;
          if (!parent) continue;
          const rect = parent.getBoundingClientRect();
          if (rect.left < 50 || rect.top < 60 || rect.width < 20) continue;
          let row = parent;
          for (let i = 0; i < 5; i++) {
            if (!row) break;
            const r = row.getBoundingClientRect();
            if (r.width > 150 && r.height > 40) {
              return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
            }
            row = row.parentElement;
          }
        }
        return null;
      }, targetName);
    }

    for (const friend of matchedFriends) {
      const friendStart = Date.now();
      console.log(`  → 处理好友: ${friend.name}`);

      try {
        // 每次都用最新坐标点击好友（上一轮结束时已重新加载页面）
        let freshCoord = await findFriendCoord(page, friend.name);
        if (!freshCoord) {
          for (let retry = 1; retry <= 3; retry++) {
            console.log(`    等待好友加载，重试找坐标 (${retry}/3)...`);
            await sleep(2000);
            freshCoord = await findFriendCoord(page, friend.name);
            if (freshCoord) break;
          }
        }
        if (!freshCoord) {
          console.log(`    ✗ ${friend.name} — 重新查找坐标失败`);
          await takeScreenshot(page, 'failure', `${fmtLogTime()}-${friend.name}-坐标失败`);
          results.push({ name: friend.name, message: MESSAGE_TEXT, verified: false, duration: '0s', status: '❌ 坐标查找失败' });
          continue;
        }

        // 点击好友（最新坐标）
        await page.mouse.click(freshCoord.x, freshCoord.y);
        await sleep(config.FRIEND_CLICK_WAIT);

        // 验证聊天头部是否已切换到目标好友
        let chatOpened = await page.evaluate((targetName) => {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
          let node;
          while ((node = walker.nextNode())) {
            const parent = node.parentElement;
            if (!parent) continue;
            const rect = parent.getBoundingClientRect();
            if (rect.top >= 0 && rect.top <= 60 && rect.left >= 300 && rect.width > 10) {
              const text = (node.textContent || '').trim();
              if (text === targetName || text.startsWith(targetName + ' ')) return true;
            }
          }
          return false;
        }, friend.name);

        if (!chatOpened) {
          console.log('    聊天头部未切换，重试点击...');
          await page.mouse.click(freshCoord.x, freshCoord.y);
          await sleep(config.FRIEND_CLICK_WAIT);
          chatOpened = await page.evaluate((targetName) => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while ((node = walker.nextNode())) {
              const parent = node.parentElement;
              if (!parent) continue;
              const rect = parent.getBoundingClientRect();
              if (rect.top >= 0 && rect.top <= 60 && rect.left >= 300 && rect.width > 10) {
                const text = (node.textContent || '').trim();
                if (text === targetName || text.startsWith(targetName + ' ')) return true;
              }
            }
            return false;
          }, friend.name);
        }

        if (!chatOpened) {
          console.log(`    ✗ ${friend.name} — 聊天未打开`);
          await takeScreenshot(page, 'failure', `${fmtLogTime()}-${friend.name}-聊天未打开`);
          results.push({ name: friend.name, message: MESSAGE_TEXT, verified: false, duration: '0s', status: '❌ 聊天未打开' });
          continue;
        }

        await dismissLoginSavePopup(page);

        let inputBox = page.locator('[contenteditable="true"]').first();
        try {
          const box = await inputBox.boundingBox({ timeout: 3000 });
          if (!(box && box.width > config.INPUT_MIN_WIDTH)) inputBox = null;
        } catch (_) { inputBox = null; }

        if (!inputBox) {
          inputBox = page.locator('div[placeholder="发送消息"]').first();
          try { await inputBox.waitFor({ state: 'visible', timeout: 3000 }); } catch (_) { inputBox = null; }
        }

        if (!inputBox) {
          console.log(`    ✗ ${friend.name} — 未找到输入框`);
          await takeScreenshot(page, 'failure', `${fmtLogTime()}-${friend.name}-输入框未找到`);
          results.push({ name: friend.name, message: MESSAGE_TEXT, verified: false, duration: `${((Date.now() - friendStart) / 1000).toFixed(0)}s`, status: '❌ 输入框未找到' });
          continue;
        }

        const inpBox = await inputBox.boundingBox();
        if (inpBox) {
          await page.mouse.click(inpBox.x + inpBox.width / 2, inpBox.y + inpBox.height / 2);
        } else {
          await safeClick(page, inputBox, '输入框');
        }
        await sleep(config.INPUT_FOCUS_WAIT);

        let sendOk = false;
        for (let attempt = 0; attempt < config.SEND_MAX_RETRIES; attempt++) {
          if (attempt > 0) console.log(`    重试发送 (${attempt + 1}/${config.SEND_MAX_RETRIES})...`);
          try {
            const box = await inputBox.boundingBox();
            if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          } catch (_) {}
          await sleep(300);
          await page.keyboard.press('Control+a');
          await page.keyboard.press('Backspace');
          await sleep(200);
          await page.keyboard.type(MESSAGE_TEXT, { delay: config.TYPE_DELAY });
          await sleep(config.POST_TYPE_WAIT);

          let sent = false;
          try {
            await page.keyboard.press('Enter');
            await sleep(2000);
            const stillHasText = await page.evaluate(() => {
              const el = document.querySelector('[contenteditable="true"]');
              return el && el.textContent.trim().length > 0;
            });
            if (!stillHasText) { sent = true; console.log('    [send] Enter 已发送'); }
          } catch (_) {}

          if (!sent) {
            try {
              const sendBtn = page.locator('[class*="send-msg"], [class*="sendMsg"], [class*="Send"], [data-e2e*="send"]').first();
              const sbBox = await sendBtn.boundingBox().catch(() => null);
              if (sbBox) {
                await page.mouse.move(sbBox.x + sbBox.width / 2, sbBox.y + sbBox.height / 2);
                await sleep(400);
                await page.mouse.click(sbBox.x + sbBox.width / 2, sbBox.y + sbBox.height / 2);
                await sleep(2500);
                sent = true;
                console.log('    [send] 已点击发送按钮');
              }
            } catch (_) {}
          }

          await sleep(config.POST_SEND_WAIT);

          const afterText = await getLastMessageText(page);
          if (afterText === MESSAGE_TEXT || afterText.includes(MESSAGE_TEXT)) { sendOk = true; break; }
          const chatHasMsg = await chatPanelContains(page, MESSAGE_TEXT);
          if (chatHasMsg) { sendOk = true; break; }
          console.log(`    验证失败: 预期"${MESSAGE_TEXT}", 实际"${afterText}"`);
        }

        const duration = ((Date.now() - friendStart) / 1000).toFixed(0) + 's';
        const logTime = fmtLogTime();
        if (sendOk) {
          console.log(`    ✓ ${friend.name} — 发送成功 (${duration})`);
          await takeScreenshot(page, 'success', `${logTime}-${friend.name}`);
          results.push({ name: friend.name, message: MESSAGE_TEXT, verified: true, duration, status: '✅' });
        } else {
          console.log(`    ✗ ${friend.name} — 发送验证失败`);
          await takeScreenshot(page, 'failure', `${logTime}-${friend.name}-验证失败`);
          results.push({ name: friend.name, message: MESSAGE_TEXT, verified: false, duration, status: '❌ 验证失败' });
        }

        // 好友间：重���导航到私信页，完全重置页面状态
        if (matchedFriends.indexOf(friend) < matchedFriends.length - 1) {
          await page.goto(config.CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(4000);
          await dismissLoginSavePopup(page);
        }
      } catch (err) {
        const duration = ((Date.now() - friendStart) / 1000).toFixed(0) + 's';
        console.log(`    ✗ ${friend.name} — 异常: ${err.message}`);
        await takeScreenshot(page, 'failure', `${fmtLogTime()}-${friend.name}-异常`).catch(() => {});
        results.push({ name: friend.name, message: MESSAGE_TEXT, verified: false, duration, status: `❌ ${err.message.substring(0, 20)}` });
        await sleep(2000);
        try { await page.keyboard.press('Escape'); await sleep(1500); } catch (_) {}
      }
    }

    console.log('[6/6] 生成报告...');
    await browser.close();

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(0) + 's';
    const successCount = results.filter((r) => r.status === '✅').length;
    const failCount = results.filter((r) => r.status !== '✅').length;

    const logTime = fmtLogTime();
    const reportLines = [
      `### 抖音续火花报告 | ${logTime}`,
      '',
      `| 好友 | 消息 | 验证 | 耗时 | 结果 |`,
      `|------|------|------|------|------|`,
    ];
    for (const r of results) {
      const v = r.verified ? '✅ 已确认' : '❌ 未确认';
      reportLines.push(`| ${r.name} | ${r.message} | ${v} | ${r.duration} | ${r.status} |`);
    }
    reportLines.push('');
    reportLines.push(`**汇总**：好友 ${FRIEND_NAMES.length} 个 | ✅ 发送成功 ${successCount} | ❌ 失败 ${failCount}`);
    reportLines.push(`**总耗时**：${totalDuration}`);
    reportLines.push('');

    const report = reportLines.join('\n');
    console.log('\n' + report);

    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const reportFile = path.join(reportDir, `${logTime}-续火花报告.md`);
    fs.writeFileSync(reportFile, report, 'utf-8');
    console.log(`报告已保存: ${reportFile}`);

    if (failCount > 0) process.exit(1);
  } catch (err) {
    console.error('执行异常:', err.message);
    await browser.close();
    process.exit(1);
  }
}

main().catch((e) => { console.error('执行失败:', e.message); process.exit(1); });
