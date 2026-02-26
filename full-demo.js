const fetch = require('node-fetch');
const { RENClient } = require('./src/client.js');

// 配置
const QWEATHER_HOST = 'nq5u9whmgf.re.qweatherapi.com';
const QWEATHER_JWT = 'eyJhbGciOiJFZERTQSIsImtpZCI6IlRNNThHSkpDSzgifQ.eyJzdWIiOiIyQ0UyWU0zQjM5IiwiaWF0IjoxNzcyMTA0Mzc0LCJleHAiOjE3NzIxMDUyNzR9.RGq9xudNETx4INaFTZ4INCqYkuDsr1JLmO3_4FqIHvxyeWXkVwowdRqyPb4jOTZckC5qtY4JSbYv6qaTGWWKAA';

const CITY_IDS = {
  'beijing': '101010100',
  'shanghai': '101020100',
  'guangzhou': '101280101',
};

// 和风天气 API 调用
async function fetchQWeather(city) {
  const locationId = CITY_IDS[city.toLowerCase()];
  const url = `https://${QWEATHER_HOST}/v7/weather/now?location=${locationId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${QWEATHER_JWT}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== '200') throw new Error(`API ${data.code}`);
  
  return {
    city: city,
    temp: parseInt(data.now.temp),
    feelsLike: parseInt(data.now.feelsLike),
    condition: data.now.text,
    windDir: data.now.windDir,
    windScale: data.now.windScale,
    humidity: parseInt(data.now.humidity),
    updateTime: data.updateTime,
  };
}

// 带 REN 缓存的天气获取
async function getWeather(client, city) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const renKey = `weather/${city.toLowerCase()}/${today}`;

  // 1. 查 REN 缓存
  const cached = await client.retrieve(renKey);
  if (cached.success) {
    console.log(`  ✅ REN缓存命中: ${cached.value.temp}°C ${cached.value.condition}`);
    return { ...cached.value, fromCache: true };
  }

  // 2. 缓存未命中，调用和风天气
  console.log(`  🌐 调用和风天气API...`);
  const weather = await fetchQWeather(city);

  // 3. 存入 REN（30分钟过期）
  await client.store(renKey, weather, { type: 'weather', ttl: 1800 });
  console.log(`  💾 已存入REN缓存`);
  
  return { ...weather, fromCache: false };
}

async function demo() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     🌤️ 和风天气 + REN 缓存 联合测试             ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const client = new RENClient('http://localhost:8787');
  
  // 检查 REN 服务
  const health = await client.health();
  if (!health.status === 'ok') {
    console.error('❌ REN服务未启动');
    process.exit(1);
  }
  console.log('✅ REN服务连接正常\n');

  const cities = ['beijing', 'shanghai', 'guangzhou', 'beijing', 'shanghai'];
  let apiCalls = 0;
  let cacheHits = 0;
  
  console.log('开始获取天气数据...\n');
  
  for (const city of cities) {
    console.log(`📍 ${city.toUpperCase()}:`);
    const result = await getWeather(client, city);
    console.log(`   ${result.condition} ${result.temp}°C | ${result.windDir} ${result.windScale}级 | 湿度${result.humidity}%`);
    
    if (result.fromCache) cacheHits++;
    else apiCalls++;
    console.log('');
  }

  console.log('╔════════════════════════════════════════════════╗');
  console.log('║                   📊 统计报告                   ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║  总请求数: ${cities.length} 个城市                              ║`);
  console.log(`║  API调用:  ${apiCalls} 次 (和风天气)                      ║`);
  console.log(`║  缓存命中: ${cacheHits} 次 (REN共享缓存)                   ║`);
  console.log(`║  节省率:   ${Math.round(cacheHits/cities.length*100)}%                              ║`);
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║  💡 REN价值: 多机器人共享数据，减少API调用       ║');
  console.log('╚════════════════════════════════════════════════╝');
}

demo().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
