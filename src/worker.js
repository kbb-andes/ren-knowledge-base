/**
 * REN Cloudflare Worker 入口
 * Phase 1 部署版本
 */

// KV 命名空间绑定: REN_KV
const CONFIG = {
  MAX_KEY_LENGTH: 256,
  MAX_VALUE_SIZE: 1024 * 10,
  DEFAULT_TTL: 3600,
  MAX_TTL: 86400,
};

const TYPE_TTL = {
  'weather': 3600,
  'news': 300,
  'news_hot': 900,
  'news_daily': 14400,
  'price': 300,
  'default': 3600,
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

async function handleStore(request, env) {
  try {
    const body = await request.json();
    const { key, value, type = 'default', visibility = 'public', ttl, source = 'anonymous' } = body;
    
    if (!key || value === undefined) {
      return jsonResponse({ success: false, error: 'MISSING_PARAMS' }, 400);
    }
    
    if (!isValidKey(key)) {
      return jsonResponse({ success: false, error: 'INVALID_KEY' }, 400);
    }
    
    if (!isValidValue(value)) {
      return jsonResponse({ success: false, error: 'VALUE_TOO_LARGE' }, 400);
    }
    
    if (visibility !== 'public') {
      return jsonResponse({ success: false, error: 'PRIVATE_DATA_REJECTED' }, 400);
    }
    
    const finalTtl = ttl || TYPE_TTL[type] || CONFIG.DEFAULT_TTL;
    const cappedTtl = Math.min(finalTtl, CONFIG.MAX_TTL);
    
    const record = {
      value,
      type,
      source,
      createdAt: Date.now(),
      expiresAt: Date.now() + cappedTtl * 1000,
    };
    
    await env.REN_KV.put(key, JSON.stringify(record), { expirationTtl: cappedTtl });
    
    return jsonResponse({
      success: true,
      key,
      type,
      expiresAt: record.expiresAt,
      ttl: cappedTtl,
    });
    
  } catch (error) {
    return jsonResponse({ success: false, error: 'STORE_ERROR', message: error.message }, 500);
  }
}

async function handleRetrieve(request, env) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const allowStale = url.searchParams.get('allowStale') === 'true';
    
    if (!key) {
      return jsonResponse({ success: false, error: 'MISSING_KEY' }, 400);
    }
    
    if (!isValidKey(key)) {
      return jsonResponse({ success: false, error: 'INVALID_KEY' }, 400);
    }
    
    const data = await env.REN_KV.get(key);
    
    if (!data) {
      return jsonResponse({ success: false, error: 'NOT_FOUND' }, 404);
    }
    
    const record = JSON.parse(data);
    const now = Date.now();
    const isExpired = now > record.expiresAt;
    
    if (isExpired && !allowStale) {
      return jsonResponse({
        success: false,
        error: 'EXPIRED',
        key,
        isStale: true,
        message: '数据已过期',
      }, 404);
    }
    
    return jsonResponse({
      success: true,
      key,
      value: record.value,
      type: record.type,
      source: record.source,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      isStale: isExpired,
    });
    
  } catch (error) {
    return jsonResponse({ success: false, error: 'RETRIEVE_ERROR', message: error.message }, 500);
  }
}

async function handleHealth() {
  return jsonResponse({
    status: 'ok',
    service: 'REN',
    version: '0.1.0',
    timestamp: Date.now(),
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    try {
      if (path === '/health') {
        return handleHealth();
      }
      
      if (path === '/store' && request.method === 'POST') {
        return handleStore(request, env);
      }
      
      if (path === '/retrieve' && request.method === 'GET') {
        return handleRetrieve(request, env);
      }
      
      return jsonResponse({ success: false, error: 'NOT_FOUND' }, 404);
      
    } catch (error) {
      return jsonResponse({ success: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
    }
  },
};
