// ============================================
// 抖音自动续火花 — 常量配置
// 不含任何 Cookie 值，可安全提交到公开仓库
// ============================================

// ── 业务常量 ──────────────────────────────────

/** 目标好友名称列表（按遍历顺序） */
const FRIEND_NAMES = ['瑞士', '江川', '老张', '赵坤'];

/** 续火消息内容 */
const MESSAGE_TEXT = '🔥';

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
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

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

// ============================================
module.exports = {
  FRIEND_NAMES,
  MESSAGE_TEXT,
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
};
