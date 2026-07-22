// ============================================
// 抖音续火花 — 通用工具函数
// 不依赖项目业务常量，可跨模块复用
// ============================================

/**
 * 等待指定毫秒
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 解析 Cookie 字符串为 Playwright Cookie 对象数组
 * @param {string} str — 完整 Cookie 字符串
 * @param {string} domain — Cookie 所属域名（如 '.douyin.com'）
 * @returns {Array<{name:string, value:string, domain:string, path:string}>}
 */
function parseCookies(str, domain) {
  return str.split(/;\s*/).map((item) => {
    const idx = item.indexOf('=');
    if (idx === -1) return null;
    return {
      name: item.substring(0, idx).trim(),
      value: item.substring(idx + 1),
      domain,
      path: '/',
    };
  }).filter(Boolean);
}

/**
 * 三级点击兜底
 * Playwright force click → JS native el.click() → dispatchEvent
 */
async function safeClick(page, locator, label = 'element') {
  try {
    await locator.click({ force: true, timeout: 5000 });
    return;
  } catch (_) { /* try next */ }

  try {
    await locator.evaluate((el) => el.click());
    return;
  } catch (_) { /* try next */ }

  try {
    await locator.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
  } catch (e) {
    console.log(`  [click] 三级点击全部失败 (${label}): ${e.message}`);
  }
}

/**
 * 强制隐藏 semi-modal 遮罩层
 */
async function hideSemiModal(page) {
  try {
    await page.evaluate(() => {
      const modals = document.querySelectorAll('[class*="semi-modal-wrap"]');
      modals.forEach((m) => { m.style.display = 'none'; });
    });
  } catch (_) { /* ignore */ }
}

// ============================================
// 日志时间格式工具
// 格式：YYYY-MM-DD-HHmm
// 示例：2026-07-23-1430
// ============================================

/** 正则：YYYY-MM-DD-HHmm（HH 24小时制，mm 两位分钟） */
const LOG_TIME_RE = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])-(?:[01]\d|2[0-3])[0-5]\d$/;

/**
 * 将 Date 对象转为日志时间格式
 * @param {Date} [date=new Date()]
 * @returns {string} 格式 YYYY-MM-DD-HHmm
 */
function fmtLogTime(date) {
  const d = date || new Date();
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${Y}-${M}-${D}-${h}${m}`;
}

/**
 * 校验日志时间字符串格式
 * @param {string} str
 * @returns {{ valid: boolean, reason?: string }}
 */
function validLogTime(str) {
  if (typeof str !== 'string') {
    return { valid: false, reason: '输入不是字符串' };
  }
  if (!LOG_TIME_RE.test(str)) {
    // 尝试定位问题
    const parts = str.split('-');
    if (parts.length !== 4) {
      return { valid: false, reason: `格式应为 YYYY-MM-DD-HHmm，当前分段数 ${parts.length}（示例：2026-07-23-1430）` };
    }
    const [Y, M, D, HM] = parts;
    if (Y.length !== 4 || isNaN(+Y)) {
      return { valid: false, reason: `年份应为 4 位数字，收到 "${Y}"` };
    }
    if (M.length !== 2 || +M < 1 || +M > 12) {
      return { valid: false, reason: `月份应为 01-12，收到 "${M}"` };
    }
    if (D.length !== 2 || +D < 1 || +D > 31) {
      return { valid: false, reason: `日期应为 01-31，收到 "${D}"` };
    }
    if (HM.length !== 4 || isNaN(+HM)) {
      return { valid: false, reason: `小时分钟应为 4 位数字，收到 "${HM}"（示例：1430）` };
    }
    const hh = HM.substring(0, 2);
    const mm = HM.substring(2, 4);
    if (+hh > 23) {
      return { valid: false, reason: `小时应为 00-23，收到 "${hh}"` };
    }
    if (+mm > 59) {
      return { valid: false, reason: `分钟应为 00-59，收到 "${mm}"` };
    }
    return { valid: false, reason: `格式不匹配 YYYY-MM-DD-HHmm，收到 "${str}"` };
  }
  return { valid: true };
}

module.exports = { sleep, parseCookies, safeClick, hideSemiModal, fmtLogTime, validLogTime };
