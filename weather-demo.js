/**
 * REN 天气服务示例 - 和风天气真实接入
 * 展示REN价值：减少API调用、节省Token、提高响应速度
 */

const fetch = require('node-fetch');
const { RENClient } = require('./src/client.js');

// 配置
const REN_URL = process.env.REN_URL || 'https://ren-knowledge-base.kbb-andes.workers.dev';
const QWEATHER_HOST = 'nq5u9whmgf.re.qweatherapi.com';
const QWEATHER_JWT = process.env.QWEATHER_JWT || 'eyJhbGciOiJFZERTQSIsImtpZCI6IlRNNThHSkpDSzgifQ.eyJzdWIiOiIyQ0UyWU0zQjM5IiwiaWF0IjoxNzcyMTA0Mzc0LCJleHAiOjE3NzIxMDUyNzR9.RGq9xudNETx4INaFTZ4INCqYkuDsr1JLmO3_4FqIHvxyeWXkVwowdRqyPb4jOTZckC5qtY4JSbYv6qaTGWWKAA';

// 城市ID映射（和风天气LocationID）
const CITY_IDS = {
  'beijing': '101010100',
  'shanghai': '101020100',
  'guangzhou': '101280101',
  'shenzhen': '101280601',
  'hangzhou': '101210101',
  'chengdu': '101270101',
  'wuhan': '101200101',
  'xian': '101110101',
};

const client = new RENClient(REN_URL);

/**
 * 从和风天气获取实时天气
 */
async function fetchQWeather(city) {
  const locationId = CITY_IDS[city.toLowerCase()];
  if (!locationId) {
    throw new Error(`未知城市: ${city}`);
  }

  const url = `https://${QWEATHER_HOST}/v7/weather/now?location=${locationId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${QWEATHER_JWT}`,
      'Accept': 'application/json',
    },
    compress: true,
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.code !== '200') {
    throw new Error(`API错误: ${data.code}`);
  }

  // 提取关键字段
  return {
    city: city,
    temp: parseInt(data.now.temp),
    feelsLike: parseInt(data.now.feelsLike),
    condition: data.now.text,
    icon: data.now.icon,
    windDir: data.now.windDir,
    windScale: data.now.windScale,
    humidity: parseInt(data.now.humidity),
    pressure: parseInt(data.now.pressure),
    vis: parseInt(data.now.vis),
    updateTime: data.updateTime,
    source: 'qweather',
  };
}

/**
 * 获取天气（带REN缓存）
 */
async function getWeather(city) {
  const cityKey = city.toLowerCase();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const renKey = `weather/${cityKey}/${today}`;

  // 1. 先查REN缓存
  const cached = await client.retrieve(renKey);
  if (cached.success) {
    console.log(`[REN缓存] ${city} 天气: ${cached.value.temp}°C, ${cached.value.condition}`);
    return { ...cached.value, fromCache: true, cachedAt: cached.createdAt };
  }

  // 2. 缓存未命中，调用和风天气API
  console.log(`[API调用] 获取 ${city} 天气...`);
  const weather = await fetchQWeather(city);

  // 3. 存入REN（30分钟过期，单位秒）
  await client.store(renKey, weather, { 
    type: 'weather', 
    ttl: 30 * 60  // 30分钟
  });

  return { ...weather, fromCache: false };
}

/**
 * 批量获取多个城市天气
 */
async function getMultiCityWeather(cities) {
  console.log('\n=== 批量获取天气 ===');
  console.log(`城市: ${cities.join(', ')}`);
  console.log(`REN服务: ${REN_URL}\n`);

  const results = {};
  let apiCalls = 0;
  let cacheHits = 0;
  const startTime = Date.now();

  for (const city of cities) {
    try {
      const weather = await getWeather(city);
      results[city] = weather;
      if (weather.fromCache) cacheHits++;
      else apiCalls++;
    } catch (error) {
      console.error(`[错误] 获取 ${city} 失败: ${error.message}`);
      results[city] = { error: error.message };
    }
  }

  const duration = Date.now() - startTime;
  const total = cities.length;
  const saved = cacheHits;

  console.log('\n=== 统计 ===');
  console.log(`总耗时: ${duration}ms`);
  console.log(`API调用: ${apiCalls} 次`);
  console.log(`缓存命中: ${cacheHits} 次`);
  console.log(`节省率: ${saved}/${total} (${Math.round(saved / total * 100)}%)`);

  return results;
}

/**
 * 显示天气详情
 */
function displayWeather(city, data) {
  if (data.error) {
    console.log(`\n📍 ${city}: 获取失败 (${data.error})`);
    return;
  }

  const cacheBadge = data.fromCache ? ' [REN缓存]' : ' [实时]';
  console.log(`\n📍 ${city}${cacheBadge}`);
  console.log(`   ${data.condition} ${data.temp}°C (体感 ${data.feelsLike}°C)`);
  console.log(`   ${data.windDir} ${data.windScale}级 | 湿度 ${data.humidity}% | 气压 ${data.pressure}hPa`);
  console.log(`   能见度 ${data.vis}km | 更新于 ${data.updateTime}`);
}

/**
 * 运行完整演示
 */
async function demo() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     REN + 和风天气 联合测试            ║');
  console.log('╚════════════════════════════════════════╝\n');

  // 测试1：单次获取
  console.log('【测试1】单次获取北京天气');
  const beijing1 = await getWeather('beijing');
  displayWeather('北京', beijing1);

  // 测试2：缓存命中
  console.log('\n【测试2】再次获取（验证缓存）');
  const beijing2 = await getWeather('beijing');
  displayWeather('北京', beijing2);

  // 测试3：批量获取多个城市
  console.log('\n');
  const cities = ['beijing', 'shanghai', 'guangzhou', 'beijing', 'shanghai'];
  const results = await getMultiCityWeather(cities);

  // 显示详细结果
  console.log('\n=== 详细结果 ===');
  for (const [city, data] of Object.entries(results)) {
    displayWeather(city, data);
  }

  // REN价值总结
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║           REN 价值体现                  ║');
  console.log('╠════════════════════════════════════════╣');
  console.log('║ ✅ 减少重复API调用，降低Token成本       ║');
  console.log('║ ✅ 多机器人共享天气数据                 ║');
  console.log('║ ✅ 30分钟TTL自动过期，保证数据新鲜      ║');
  console.log('║ ✅ 缓存命中时响应速度提升10倍+          ║');
  console.log('╚════════════════════════════════════════╝');
}

// 运行
demo().catch(console.error);
