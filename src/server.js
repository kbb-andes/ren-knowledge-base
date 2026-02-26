/**
 * REN API Server
 * 提供HTTP接口供机器人访问共享知识库
 */

const http = require('http');
const url = require('url');
const { store, retrieve, cleanup, getStats } = require('./knowledge-base.js');

const PORT = process.env.REN_PORT || 8787;

// 请求体解析
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// 发送响应
function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// 路由处理
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  try {
    // 健康检查
    if (path === '/health') {
      sendResponse(res, 200, { status: 'ok', service: 'REN', version: '0.1.0' });
      return;
    }
    
    // 存储数据 POST /store
    if (path === '/store' && req.method === 'POST') {
      const body = await parseBody(req);
      const { key, value, ttl } = body;
      
      if (!key || value === undefined) {
        sendResponse(res, 400, { success: false, error: 'MISSING_PARAMS' });
        return;
      }
      
      const result = store(key, value, ttl);
      sendResponse(res, result.success ? 200 : 400, result);
      return;
    }
    
    // 读取数据 GET /retrieve?key=xxx
    if (path === '/retrieve' && req.method === 'GET') {
      const { key } = parsedUrl.query;
      
      if (!key) {
        sendResponse(res, 400, { success: false, error: 'MISSING_KEY' });
        return;
      }
      
      const result = retrieve(key);
      sendResponse(res, result.success ? 200 : 404, result);
      return;
    }
    
    // 统计信息 GET /stats
    if (path === '/stats' && req.method === 'GET') {
      const stats = getStats();
      sendResponse(res, 200, { success: true, ...stats });
      return;
    }
    
    // 清理过期数据 POST /cleanup
    if (path === '/cleanup' && req.method === 'POST') {
      const result = cleanup();
      sendResponse(res, 200, { success: true, ...result });
      return;
    }
    
    // 404
    sendResponse(res, 404, { success: false, error: 'NOT_FOUND' });
    
  } catch (error) {
    console.error('Error:', error);
    sendResponse(res, 500, { success: false, error: 'INTERNAL_ERROR', message: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`REN API Server running on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET  /health          - 健康检查`);
  console.log(`  POST /store           - 存储数据`);
  console.log(`  GET  /retrieve?key=xx - 读取数据`);
  console.log(`  GET  /stats           - 统计信息`);
  console.log(`  POST /cleanup         - 清理过期数据`);
});

module.exports = { server };
