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

// 从命令行参数或环境变量获取 prompt 文本
// 支持: node auto_streak.js "prompt text"
//       node auto_streak.js --prompt-file path/to/file
//       STREAK_PROMPT="prompt text" node auto_streak.js
let promptText = '';
if (process.argv[2] === '--prompt-file' && process.argv[3]) {
  promptText = fs.readFileSync(process.argv[3], 'utf-8');
} else {
  promptText = process.argv[2] || process.env.STREAK_PROMPT || '';
}

const params = config.parsePromptArgs(promptText);

if (!params.cookie) {
  console.error('❌ Cookie 未提供，请在 Prompt 中传入。');
  console.error('格式：Cookie：sessionid=xxx; passport_csrf_token=xxx; ...');
  process.exit(1);
}
if (!params.friendNames || params.friendNames.length === 0) {
  console.error('❌ 好友名称未提供，请在 Prompt 中传入。');
  console.error('格式：好友名称：火豹v');
  process.exit(1);
}
if (!params.messageText) {
  console.error('❌ 发送内容为空。');
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

// ============================================
// Cookie 注入
// ============================================

const cookies = parseCookies(COOKIE_STR, config.COOKIE_DOMAIN);

// ============================================
// 页面交互辅助函数
// ============================================

/** 关闭"是否保存登录信息"弹窗 */
async function dismissLoginSavePopup(page) {
  try {
    const cancelBtn = page.locator('text=取消').first();
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelBtn.click({ timeout: 3000 });
      console.log('  [弹窗] 已关闭"是否保存登录信息"');
      await sleep(1000);
    }
  } catch (_) { /* ignore */ }
  // 也尝试其他关闭按钮
  try {
    const closeBtn = page.locator('[class*="close"], [class*="Close"]').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click({ timeout: 2000 });
      await sleep(500);
    }
  } catch (_) { /* ignore */ }
}

/** 关闭二维码登录弹窗（未登录时点击消息图标会触发） */
async function closeQrLoginPopup(page) {
  try {
    const qrPopup = page.locator('text=登录后免费畅享高清视频').first();
    if (await qrPopup.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  [弹窗] 检测到二维码登录弹窗，关闭中...');
      const closeX = page.locator('[class*="modal"] [class*="close"], [class*="dialog"] [class*="close"], [class*="Modal"] svg').first();
      try {
        if (await closeX.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeX.click({ timeout: 2000 });
          await sleep(500);
        }
      } catch (_) {}
      try { await page.keyboard.press('Escape'); await sleep(500); } catch (_) {}
    }
  } catch (_) {}
}

/** 检查登录状态 */
async function checkLoginState(page) {
  try {
    return await page.evaluate(() => {
      const text = document.body.innerText;
      const hasQrPopup = text.includes('登录后免费畅享') || text.includes('扫码登录');
      if (hasQrPopup) return false;
      const cookies = document.cookie;
      const hasIsActive = cookies.includes('IsDouyinActive=true') || cookies.includes('enter_pc_once');
      const hasImEntry = !!document.querySelector('[data-e2e="im-entry"]');
      const hasUserNav = text.includes('朋友') && text.includes('我的');
      return hasIsActive || hasImEntry || hasUserNav;
    });
  } catch (_) {
    return false;
  }
}

/** 切换到「私信」tab */
async function switchToPrivateMessageTab(page) {
  try {
    const locators = page.locator('text=私信');
    const count = await locators.count();
    for (let i = 0; i < count; i++) {
      const loc = locators.nth(i);
      const box = await loc.boundingBox().catch(() => null);
      if (box && box.x > 1000 && box.width > 20 && box.height > 10) {
        await loc.click({ timeout: 3000 });
        console.log(`  已点击「私信」tab (${Math.round(box.x)}, ${Math.round(box.y)})`);
        return true;
      }
    }
    const els = await page.evaluate(() => {
      const results = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
          if (node.textContent.trim() === '私信') {
            const rect = node.getBoundingClientRect();
            if (rect.left > 1000 && rect.width > 20) {
              results.push({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            }
          }
        }
      }
      return results;
    });
    if (els.length > 0) {
      await page.mouse.click(els[0].x, els[0].y);
      console.log(`  已点击「私信」tab (${Math.round(els[0].x)}, ${Math.round(els[0].y)}) [method2]`);
      return true;
    }
    console.log('  未找到「私信」tab，可能已在私信页');
    return false;
  } catch (e) {
    console.log(`  切换「私信」tab 失败: ${e.message}`);
    return false;
  }
}

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

  const cookies = parseCookies(COOKIE_STR, config.COOKIE_DOMAIN);
  await context.addCookies(cookies);
  console.log(`  已注入 ${cookies.length} 个 Cookie`);

  const page = await context.newPage();

  try {
    console.log('[2/6] 访问抖音并验证登录状态...');
    await page.goto(config.DOUYIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(config.PAGE_LOAD_WAIT);
    await dismissLoginSavePopup(page);
    await closeQrLoginPopup(page);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(config.PAGE_LOAD_WAIT);
    await dismissLoginSavePopup(page);
    await closeQrLoginPopup(page);

    const pageText = await page.textContent('body').catch(() => '');
    for (const kw of config.CAPTCHA_KEYWORDS) {
      if (pageText.includes(kw)) {
        console.error(`❌ 检测到验证码关键词: "${kw}"`);
        await browser.close();
        process.exit(1);
      }
    }

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
    console.log(`  登录成功，页面标题: "${title}"`);

    console.log('[3/6] 打开消息面板...');
    await dismissLoginSavePopup(page);
    const imEntry = page.locator(config.IM_ENTRY_SELECTOR);
    try {
      await imEntry.waitFor({ state: 'visible', timeout: 10000 });
      const box = await imEntry.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(config.HOVER_DELAY);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      } else {
        await page.mouse.move(config.IM_ENTRY_X, config.IM_ENTRY_Y);
        await sleep(config.HOVER_DELAY);
        await page.mouse.click(config.IM_ENTRY_X, config.IM_ENTRY_Y);
      }
    } catch (e) {
      await page.mouse.move(config.IM_ENTRY_X, config.IM_ENTRY_Y);
      await sleep(config.HOVER_DELAY);
      await page.mouse.click(config.IM_ENTRY_X, config.IM_ENTRY_Y);
    }
    await sleep(config.PANEL_OPEN_WAIT);
    await dismissLoginSavePopup(page);

    const panelVisible = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('互动消息') || text.includes('私信');
    });
    if (!panelVisible) {
      await page.mouse.move(config.IM_ENTRY_X, config.IM_ENTRY_Y);
      await sleep(config.HOVER_DELAY);
      await page.mouse.click(config.IM_ENTRY_X, config.IM_ENTRY_Y);
      await sleep(config.PANEL_OPEN_WAIT);
      await dismissLoginSavePopup(page);
    }

    console.log('  切换到「私信」tab...');
    await switchToPrivateMessageTab(page);
    await sleep(2000);
    console.log('  消息面板已打开');

    console.log('[4/6] 按名称匹配好友...');
    const matchedFriends = await page.evaluate((friendNames) => {
      const results = [];
      const textNodes = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent.trim();
        if (!text || text.length > 30 || text.length < 1) continue;
        const parent = node.parentElement;
        if (!parent) continue;
        const rect = parent.getBoundingClientRect();
        if (rect.left < 1000 || rect.top < 150 || rect.width < 20) continue;
        const excludes = ['互动消息', '全部消息', '私信', '去设置', '下载', '下载客户端', '消息', '通知', '赞了你的作品', '赞了你的评论', '关注了你', '等', '回关', '推荐了你的视频', '直播中', '重燃中', '在线', '分钟前在线', '小时前在线'];
        if (excludes.some((e) => text === e || text.startsWith(e))) continue;
        textNodes.push({ text, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
      textNodes.sort((a, b) => a.y - b.y || a.x - b.x);
      for (let i = 0; i < friendNames.length; i++) {
        const name = friendNames[i];
        for (const tn of textNodes) {
          if (tn.text === name) {
            results.push({ name, x: tn.x - 100, y: tn.y, index: i });
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
    for (const name of FRIEND_NAMES) {
      if (!matchedNames.has(name)) {
        console.log(`    ✗ ${name} — 未找到`);
        results.push({ name, message: MESSAGE_TEXT, verified: false, duration: '0s', status: '❌ 未找到' });
      }
    }

    console.log('[5/6] 逐个发送消息...');
    for (const friend of matchedFriends) {
      const friendStart = Date.now();
      console.log(`  → 处理好友: ${friend.name}`);

      try {
        const friendLocator = page.locator(`text="${friend.name}"`).filter({
          hasNot: page.locator('[class*="header"], [class*="Header"], [class*="profile"], [class*="Profile"]')
        }).first();

        let clicked = false;
        let chatOpened = false;

        try {
          const box = await friendLocator.boundingBox({ timeout: 2000 });
          if (box && box.x > 1000) {
            await friendLocator.click({ force: true, timeout: 3000 });
            console.log(`    点击好友: ${friend.name} (locator)`);
            clicked = true;
          }
        } catch (_) {}

        if (clicked) {
          await sleep(config.FRIEND_CLICK_WAIT);
          chatOpened = await page.evaluate(() => {
            const el = document.querySelector('[contenteditable="true"]');
            return el && el.offsetParent !== null;
          });
        }

        if (!chatOpened) {
          console.log('    locator 点击后聊天未打开，尝试坐标点击...');
          const refound = await page.evaluate((name) => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while ((node = walker.nextNode())) {
              if (node.textContent.trim() === name) {
                const parent = node.parentElement;
                if (!parent) continue;
                const rect = parent.getBoundingClientRect();
                if (rect.left > 1000 && rect.width > 20) {
                  return { x: rect.left - 100, y: rect.top + rect.height / 2 };
                }
              }
            }
            return null;
          }, friend.name);

          if (refound) {
            await page.mouse.click(refound.x, refound.y);
            await sleep(config.FRIEND_CLICK_WAIT);
            chatOpened = await page.evaluate(() => {
              const el = document.querySelector('[contenteditable="true"]');
              return el && el.offsetParent !== null;
            });
          }
        }

        if (!chatOpened) {
          console.log(`    ✗ ${friend.name} — 聊天未打开`);
          await takeScreenshot(page, 'failure', `${fmtLogTime()}-${friend.name}-聊天未打开`);
          results.push({ name: friend.name, message: MESSAGE_TEXT, verified: false, duration: '0s', status: '❌ 聊天未打开' });
          await closeChat(page);
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
          await closeChat(page);
          continue;
        }

        const inpBox = await inputBox.boundingBox();
        if (inpBox) {
          await page.mouse.click(inpBox.x + inpBox.width / 2, inpBox.y + inpBox.height / 2);
        } else {
          await safeClick(page, inputBox, '输入框');
        }
        await sleep(config.INPUT_FOCUS_WAIT);

        const beforeText = await getLastMessageText(page);

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
          const bodyHasMsg = await page.evaluate((msg) => document.body.innerText.includes(msg), MESSAGE_TEXT);
          if (bodyHasMsg) { sendOk = true; break; }
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

        await closeChat(page);
        await sleep(config.FRIEND_INTERVAL);
      } catch (err) {
        const duration = ((Date.now() - friendStart) / 1000).toFixed(0) + 's';
        console.log(`    ✗ ${friend.name} — 异常: ${err.message}`);
        await takeScreenshot(page, 'failure', `${fmtLogTime()}-${friend.name}-异常`).catch(() => {});
        results.push({ name: friend.name, message: MESSAGE_TEXT, verified: false, duration, status: `❌ ${err.message.substring(0, 20)}` });
        await closeChat(page);
        await sleep(2000);
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

/** 获取聊天区最后一条消息文本 */
async function getLastMessageText(page) {
  try {
    return await page.evaluate(() => {
      const selectors = [
        '[class*="DraftEditor"] [data-text="true"] span',
        '[class*="DraftEditor"] span[data-text="true"]',
        '[class*="message"] [class*="text"]',
        '[class*="Message"] [class*="Text"]',
        '[class*="chat"] [class*="msg"] span',
        '[class*="im-chat"] [class*="text"]',
        '[class*="message"] span',
      ];
      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          const last = els[els.length - 1];
          return last.textContent.trim();
        }
      }
      return '';
    });
  } catch (_) { return ''; }
}

main().catch((e) => { console.error('执行失败:', e.message); process.exit(1); });
