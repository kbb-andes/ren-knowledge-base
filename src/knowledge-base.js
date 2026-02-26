/**
 * REN - Robot Economy Network
 * Phase 1: 共享知识库 MVP
 * 
 * 核心功能：
 * 1. 数据存储（KV格式）
 * 2. 数据读取
 * 3. 数据过期管理
 * 
 * 安全机制：
 * - 输入验证
 * - 大小限制
 * - 异常处理
 */

// 内存存储（MVP阶段，后续可替换为持久化存储）
const knowledgeBase = new Map();

// 配置
const CONFIG = {
  MAX_KEY_LENGTH: 256,
  MAX_VALUE_SIZE: 1024 * 10, // 10KB
  DEFAULT_TTL: 3600 * 1000, // 1小时
  MAX_TTL: 24 * 3600 * 1000, // 24小时
};

/**
 * 验证键名
 * @param {string} key - 键名
 * @returns {boolean}
 */
function isValidKey(key) {
  if (typeof key !== 'string') return false;
  if (key.length === 0 || key.length > CONFIG.MAX_KEY_LENGTH) return false;
  // 只允许字母、数字、下划线、冒号、斜杠
  return /^[a-zA-Z0-9_:\/]+$/.test(key);
}

/**
 * 验证数据
 * @param {any} value - 数据
 * @returns {boolean}
 */
function isValidValue(value) {
  const size = JSON.stringify(value).length;
  return size <= CONFIG.MAX_VALUE_SIZE;
}

/**
 * 存储数据
 * @param {string} key - 键名（格式：类型/位置/时间，如 weather/beijing/20250225）
 * @param {any} value - 数据
 * @param {number} ttl - 过期时间（毫秒）
 * @returns {object} - 结果
 */
function store(key, value, ttl = CONFIG.DEFAULT_TTL) {
  try {
    // 验证
    if (!isValidKey(key)) {
      return { success: false, error: 'INVALID_KEY', message: '键名格式错误' };
    }
    if (!isValidValue(value)) {
      return { success: false, error: 'VALUE_TOO_LARGE', message: '数据超过大小限制' };
    }
    if (ttl > CONFIG.MAX_TTL) {
      ttl = CONFIG.MAX_TTL;
    }
    
    // 存储
    const record = {
      value: value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0,
    };
    
    knowledgeBase.set(key, record);
    
    return {
      success: true,
      key: key,
      expiresAt: record.expiresAt,
    };
    
  } catch (error) {
    return { success: false, error: 'STORE_ERROR', message: error.message };
  }
}

/**
 * 读取数据
 * @param {string} key - 键名
 * @returns {object} - 结果
 */
function retrieve(key) {
  try {
    if (!isValidKey(key)) {
      return { success: false, error: 'INVALID_KEY', message: '键名格式错误' };
    }
    
    const record = knowledgeBase.get(key);
    
    if (!record) {
      return { success: false, error: 'NOT_FOUND', message: '数据不存在' };
    }
    
    // 检查过期
    if (Date.now() > record.expiresAt) {
      knowledgeBase.delete(key);
      return { success: false, error: 'EXPIRED', message: '数据已过期' };
    }
    
    // 更新访问计数
    record.accessCount++;
    
    return {
      success: true,
      key: key,
      value: record.value,
      createdAt: record.createdAt,
      accessCount: record.accessCount,
    };
    
  } catch (error) {
    return { success: false, error: 'RETRIEVE_ERROR', message: error.message };
  }
}

/**
 * 清理过期数据
 */
function cleanup() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of knowledgeBase) {
    if (now > record.expiresAt) {
      knowledgeBase.delete(key);
      cleaned++;
    }
  }
  
  return { cleaned, remaining: knowledgeBase.size };
}

/**
 * 获取统计信息
 */
function getStats() {
  return {
    totalRecords: knowledgeBase.size,
    memoryUsage: JSON.stringify([...knowledgeBase]).length,
    config: CONFIG,
  };
}

// 导出模块
module.exports = {
  store,
  retrieve,
  cleanup,
  getStats,
  CONFIG,
};

// 测试代码
if (require.main === module) {
  console.log('=== REN 共享知识库测试 ===\n');
  
  // 测试存储
  const storeResult = store('weather/beijing/20250225', {
    temp: 12,
    condition: '多云',
    humidity: 45,
    source: 'kbb',
  });
  console.log('存储结果:', storeResult);
  
  // 测试读取
  const retrieveResult = retrieve('weather/beijing/20250225');
  console.log('读取结果:', retrieveResult);
  
  // 测试不存在的数据
  const notFoundResult = retrieve('weather/shanghai/20250225');
  console.log('不存在数据:', notFoundResult);
  
  // 统计
  console.log('\n统计:', getStats());
}
