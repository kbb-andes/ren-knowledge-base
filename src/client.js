/**
 * REN Client SDK
 * 供机器人调用REN服务的客户端
 */

const http = require('http');
const https = require('https');

class RENClient {
  constructor(baseUrl = 'http://localhost:8787') {
    this.baseUrl = baseUrl;
  }

  // HTTP请求封装（支持http和https）
  request(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ success: false, error: 'PARSE_ERROR', raw: body });
          }
        });
      });

      req.on('error', (err) => {
        reject({ success: false, error: 'REQUEST_ERROR', message: err.message });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // 健康检查
  async health() {
    return this.request('/health');
  }

  // 存储数据（支持type和ttl选项）
  async store(key, value, options = {}) {
    const { type = 'default', ttl } = options;
    return this.request('/store', 'POST', { 
      key, 
      value, 
      type,
      ttl,
      visibility: 'public',
      source: 'weather-demo'
    });
  }

  // 读取数据
  async retrieve(key) {
    return this.request(`/retrieve?key=${encodeURIComponent(key)}`);
  }

  // 获取统计
  async stats() {
    return this.request('/stats');
  }

  // 清理过期数据
  async cleanup() {
    return this.request('/cleanup', 'POST');
  }
}

// 导出
module.exports = { RENClient };

// 测试
if (require.main === module) {
  const client = new RENClient(process.env.REN_URL || 'http://localhost:8787');
  
  async function test() {
    console.log('=== REN Client 测试 ===\n');
    
    // 健康检查
    const health = await client.health();
    console.log('健康检查:', health);
    
    // 存储数据
    const storeResult = await client.store('test/robot1/data', {
      message: 'Hello from robot',
      timestamp: Date.now(),
    }, { type: 'test', ttl: 3600 });
    console.log('存储结果:', storeResult);
    
    // 读取数据
    const retrieveResult = await client.retrieve('test/robot1/data');
    console.log('读取结果:', retrieveResult);
  }
  
  test().catch(console.error);
}
