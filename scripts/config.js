// ============================================
// 抖音自动续火花 — 常量配置
// 不含任何 Cookie 值，可安全提交到公开仓库
// ============================================

// ── Prompt 参数（由用户输入传入，通过 parsePromptArgs 解析）──

/**
 * Cookie 字符串（必传，无默认值）
 * 格式：sessionid=xxx; passport_csrf_token=xxx; odin_tt=xxx; uid_tt=xxx;
 *       sid_tt=xxx; sid_guard=xxx; ttwid=xxx; s_v_web_id=xxx
 */
const COOKIE = null;

/**
 * 目标好友名称列表（必传，无默认值）
 * Prompt 参数名：好友名称
 * 格式：名称1、名称2、名称3（中文顿号或逗号分隔）
 */
const DEFAULT_FRIEND_NAMES = undefined;

/**
 * 续火消息内容（可选，默认值如下）
 * Prompt 参数名：发送内容
 */
const DEFAULT_MESSAGE_TEXT = '🔥';

// ── 业务常量 ──────────────────────────────────

/** 抖音网页版域名 */
const DOUYIN_URL = 'https://www.douyin.com';

/** 抖音精选页（登录后默认跳转） */
const DOUYIN_JINGXUAN_URL = 'https://www.douyin.com/jingxuan';

/** Cookie 注入域 */
const COOKIE_DOMAIN = '.douyin.com';

// ── Cookie 字段名（只记 key，不记 value）─────

const COOKIE_KEYS = [
  'sessionid',
  'passport_csrf_token',
  'odin_tt',
  'uid_tt',
  'sid_tt',
  'sid_guard',
  'ttwid',
  's_v_web_id',
];

// ── URL 地址 ───────────────────────────────────

const DOUYIN_URL = 'https://www.douyin.com/';
const CHAT_URL = 'https://www.douyin.com/chat?isPopup=1';
const PAGE_TITLE_CHECK = '抖音';

// ── DOM 选择器 ────────────────────────────────

const IM_ENTRY_SELECTOR = '[data-e2e="im-entry"]';
const FRIEND_TITLE_CLASS = 'conversationConversationItemtitle';
const CONVERSATION_CLASS = 'conversation';
const CHAT_INPUT_PRIMARY = '[contenteditable="true"]';
const CHAT_INPUT_FALLBACK = 'div[placeholder="发送消息"]';

// ── 坐标（1536×864 viewport 下）───────────────

const IM_ENTRY_X = 1414;
const IM_ENTRY_Y = 28;
const CHAT_INPUT_X = 1194;
const CHAT_INPUT_Y = 622;
const CLOSE_BUTTON_X_MIN = 1280;

// ── 浏览器参数 ─────────────────────────────────

const VIEWPORT = { width: 1536, height: 864 };

const BROWSER_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-sandbox',
  '--disable-dev-shm-usage',
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

// ── 时序常量（毫秒）────────────────────────────

const PAGE_LOAD_WAIT = 6000;
const HOVER_DELAY = 1500;
const PANEL_OPEN_WAIT = 5000;
const FRIEND_CLICK_WAIT = 4000;
const INPUT_FOCUS_WAIT = 500;
const TYPE_DELAY = 80;
const POST_TYPE_WAIT = 300;
const POST_SEND_WAIT = 3000;
const FRIEND_INTERVAL = 5000;
const CHAT_CLOSE_WAIT = 2000;
const CAPTCHA_RETRY_WAIT = 10000;

// ── 阈值────────────────────────────────────────

const DOM_EXPAND_THRESHOLD = 15;
const INPUT_MIN_WIDTH = 30;
const DOM_TRAVERSE_MAX_DEPTH = 6;

// ── 重试次数────────────────────────────────────

const CAPTCHA_MAX_RETRIES = 3;
const SEND_MAX_RETRIES = 2;
const DOM_MAX_RETRIES = 2;
const POPUP_MAX_RETRIES = 3;

// ── 页面检测────────────────────────────────────

const PAGE_TITLE_CHECK = '抖音';
const CAPTCHA_KEYWORDS = ['请完成下列验证', '滑块验证', '验证码'];

// ── Prompt 参数解析 ───────────────────────────

/**
 * 从用户 prompt 文本中解析参数。
 *
 * 输入格式（每行一个参数）：
 *   Cookie：sessionid=xxx; passport_csrf_token=xxx; ...
 *   好友名称：瑞士、江川、老张、赵坤
 *   发送内容：🔥
 *
 * @param {string} promptText - 用户输入的完整 prompt 文本
 * @returns {{ cookie: string|null, friendNames: string[]|null, messageText: string }}
 *   - cookie: 必传，未提供则返回 null
 *   - friendNames: 必传，未提供则返回 null
 *   - messageText: 可选，未提供使用 DEFAULT_MESSAGE_TEXT
 */
function parsePromptArgs(promptText) {
  const result = {
    cookie: null,
    friendNames: null,
    messageText: DEFAULT_MESSAGE_TEXT,
  };

  if (!promptText) return result;

  // 按行拆分
  const lines = promptText.split(/[\r\n]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 匹配「参数名：值」格式（支持中英文冒号）
    const match = trimmed.match(/^(Cookie|好友名称|发送内容)[：:]\s*(.+)$/);
    if (!match) continue;

    const [, key, value] = match;
    const val = value.trim();

    switch (key) {
      case 'Cookie':
        if (val) result.cookie = val;
        break;
      case '好友名称':
        if (val) {
          // 支持中文顿号、逗号、空格分隔
          result.friendNames = val
            .split(/[、,，\s]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        }
        break;
      case '发送内容':
        if (val) result.messageText = val;
        break;
    }
  }

  return result;
}

// ============================================
module.exports = {
  COOKIE,
  DEFAULT_FRIEND_NAMES,
  DEFAULT_MESSAGE_TEXT,
  DOUYIN_URL,
  DOUYIN_JINGXUAN_URL,
  COOKIE_DOMAIN,
  COOKIE_KEYS,
  IM_ENTRY_SELECTOR,
  FRIEND_TITLE_CLASS,
  CONVERSATION_CLASS,
  CHAT_INPUT_PRIMARY,
  CHAT_INPUT_FALLBACK,
  IM_ENTRY_X,
  IM_ENTRY_Y,
  CHAT_INPUT_X,
  CHAT_INPUT_Y,
  CLOSE_BUTTON_X_MIN,
  VIEWPORT,
  BROWSER_ARGS,
  USER_AGENT,
  PAGE_LOAD_WAIT,
  HOVER_DELAY,
  PANEL_OPEN_WAIT,
  FRIEND_CLICK_WAIT,
  INPUT_FOCUS_WAIT,
  TYPE_DELAY,
  POST_TYPE_WAIT,
  POST_SEND_WAIT,
  FRIEND_INTERVAL,
  CHAT_CLOSE_WAIT,
  CAPTCHA_RETRY_WAIT,
  DOM_EXPAND_THRESHOLD,
  INPUT_MIN_WIDTH,
  DOM_TRAVERSE_MAX_DEPTH,
  CAPTCHA_MAX_RETRIES,
  SEND_MAX_RETRIES,
  DOM_MAX_RETRIES,
  POPUP_MAX_RETRIES,
  PAGE_TITLE_CHECK,
  CAPTCHA_KEYWORDS,
  parsePromptArgs,
};
