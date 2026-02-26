/**
 * REN Knowledge Base v2
 * Phase 1 完善版
 * 
 * 新增功能：
 * 1. TTL分级（天气1小时，新闻按需）
 * 2. 数据标记（public/private）
 * 3. 过期数据stale标记
 * 4. 访问统计
 */

const knowledgeBase = new Map();

const CONFIG = {
  MAX_KEY_LENGTH: 256,
  MAX_VALUE_SIZE: 1024 * 10,
  DEFAULT_TTL: 3600 * 1000, // 1小时
  MAX_TTL: 24 * 3600 * 1000, // 24小时
  STALE_THRESHOLD: 5 * 60 * 1000, // 5分钟视为stale
};

// 数据类型预设TTL
const TYPE_TTL = {
  'weather': 3600 * 1000,      // 天气1小时
  'news': 5 * 60 * 1000,       // 新闻5分钟（突发）
  'news_hot': 15 * 60 * 1000,  // 热点15分钟
  'news_daily': 4 * 3600 * 1000, // 日常4小时
  'price': 5 * 60 * 1000,      // 价格5分钟
  'default': 3600 * 1000,
};

function isValidKey(key) {
  if (typeof key !== 'string') return false;
  if (key.length === 0 || key.length > CONFIG.MAX_KEY_LENGTH) return false;
  return /^[a-zA-Z0-9_:\/\-]+$/.test(key);
}

function isValidValue(value) {
  const size = JSON.stringify(value).length;
  return size <= CONFIG.MAX_VALUE_SIZE;
}

/**
 * 存储数据
 * @param {string} key - 键名
 * @param {any} value - 数据
 * @param {object} options - 选项
 *   @param {string} options.type - 数据类型（weather/news/price）
 *   @param {string} options.visibility - public/private
 *   @param {number} options.ttl - 自定义TTL
 *   @param {string} options.source - 数据来源机器人ID
 */
function store(key, value, options = {}) {
  try {
    if (!isValidKey(key)) {
      return { success: false, error: 'INVALID_KEY' };
    }
    if (!isValidValue(value)) {
      return { success: false, error: 'VALUE_TOO_LARGE' };
    }
    
    const { type = 'default', visibility = 'public', ttl, source = 'anonymous' } = options;
    
    // 只接受public数据
    if (visibility !== 'public') {
      return { success: false, error: 'PRIVATE_DATA_REJECTED', message: 'REN只接受public数据' };
    }
    
    // 确定TTL
    const finalTtl = ttl || TYPE_TTL[type] || CONFIG.DEFAULT_TTL;
    const cappedTtl = Math.min(finalTtl, CONFIG.MAX_TTL);
    
    const now = Date.now();
    const record = {
      value,
      type,
      visibility,
      source,
      createdAt: now,
      expiresAt: now + cappedTtl,
      accessCount: 0,
      lastAccessedAt: null,
    };
    
    knowledgeBase.set(key, record);
    
    return {
      success: true,
      key,
      type,
      expiresAt: record.expiresAt,
      ttl: cappedTtl,
    };
    
  } catch (error) {
    return { success: false, error: 'STORE_ERROR', message: error.message };
  }
}

/**
 * 读取数据
 * @param {string} key - 键名
 * @param {object} options - 选项
 *   @param {boolean} options.allowStale - 是否允许读取过期数据
 * @returns {object} - 结果，包含isStale标记
 */
function retrieve(key, options = {}) {
  try {
    if (!isValidKey(key)) {
      return { success: false, error: 'INVALID_KEY' };
    }
    
    const record = knowledgeBase.get(key);
    
    if (!record) {
      return { success: false, error: 'NOT_FOUND' };
    }
    
    const now = Date.now();
    const isExpired = now > record.expiresAt;
    const isStale = isExpired || (now - record.expiresAt > -CONFIG.STALE_THRESHOLD);
    
    // 更新访问统计
    record.accessCount++;
    record.lastAccessedAt = now;
    
    // 如果过期且不允许stale，返回过期错误
    if (isExpired && !options.allowStale) {
      return {
        success: false,
        error: 'EXPIRED',
        key,
        isStale: true,
        staleSince: record.expiresAt,
        message: '数据已过期，请触发更新或允许读取stale数据',
      };
    }
    
    return {
      success: true,
      key,
      value: record.value,
      type: record.type,
      source: record.source,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      accessCount: record.accessCount,
      isStale: isExpired || isStale,
    };
    
  } catch (error) {
    return { success: false, error: 'RETRIEVE_ERROR', message: error.message };
  }
}

/**
 * 检查数据状态（不增加访问计数）
 */
function peek(key) {
  const record = knowledgeBase.get(key);
  if (!record) return { exists: false };
  
  const now = Date.now();
  return {
    exists: true,
    isExpired: now > record.expiresAt,
    expiresAt: record.expiresAt,
    accessCount: record.accessCount,
    type: record.type,
  };
}

function cleanup() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of knowledgeBase) {
    // 清理过期超过1小时的数据
    if (now > record.expiresAt + 3600 * 1000) {
      knowledgeBase.delete(key);
      cleaned++;
    }
  }
  
  return { cleaned, remaining: knowledgeBase.size };
}

function getStats() {
  const now = Date.now();
  let expired = 0;
  let active = 0;
  
  for (const record of knowledgeBase.values()) {
    if (now > record.expiresAt) expired++;
    else active++;
  }
  
  return {
    totalRecords: knowledgeBase.size,
    activeRecords: active,
    expiredRecords: expired,
    memoryUsage: JSON.stringify([...knowledgeBase]).length,
    config: CONFIG,
    typeTtl: TYPE_TTL,
  };
}

module.exports = {
  store,
  retrieve,
  peek,
  cleanup,
  getStats,
  CONFIG,
  TYPE_TTL,
};
