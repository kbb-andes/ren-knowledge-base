const fetch = require('node-fetch');

const QWEATHER_HOST = 'nq5u9whmgf.re.qweatherapi.com';
const QWEATHER_JWT = 'eyJhbGciOiJFZERTQSIsImtpZCI6IlRNNThHSkpDSzgifQ.eyJzdWIiOiIyQ0UyWU0zQjM5IiwiaWF0IjoxNzcyMTA0Mzc0LCJleHAiOjE3NzIxMDUyNzR9.RGq9xudNETx4INaFTZ4INCqYkuDsr1JLmO3_4FqIHvxyeWXkVwowdRqyPb4jOTZckC5qtY4JSbYv6qaTGWWKAA';

// 模拟 REN 缓存
const localCache = new Map();

async function fetchQWeather(locationId) {
  const url = `https://${QWEATHER_HOST}/v7/weather/now?location=${locationId}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${QWEATHER_JWT}`,
      'Accept': 'application/json',
    },
  });
  return response.json();
}

async function getWeather(city, locationId) {
  const key = `weather/${city}/${new Date().toISOString().slice(0,10)}`;
  
  // 检查缓存
  if (localCache.has(key)) {
    console.log(`[REN缓存] ${city}: ${localCache.get(key).temp}°C`);
    return { ...localCache.get(key), fromCache: true };
  }
  
  // 调用 API
  console.log(`[API调用] 获取 ${city}...`);
  const data = await fetchQWeather(locationId);
  const weather = {
    city,
    temp: parseInt(data.now.temp),
    condition: data.now.text,
    updateTime: data.updateTime,
  };
  
  // 存入缓存
  localCache.set(key, weather);
  return { ...weather, fromCache: false };
}

async function demo() {
  console.log('=== REN 本地缓存演示 ===\n');
  
  const cities = [
    ['北京', '101010100'],
    ['上海', '101020100'],
    ['广州', '101280101'],
    ['北京', '101010100'], // 重复，应该命中缓存
  ];
  
  let apiCalls = 0;
  let cacheHits = 0;
  
  for (const [name, id] of cities) {
    const result = await getWeather(name, id);
    if (result.fromCache) cacheHits++;
    else apiCalls++;
  }
  
  console.log('\n=== 统计 ===');
  console.log(`API调用: ${apiCalls} 次`);
  console.log(`缓存命中: ${cacheHits} 次`);
  console.log(`节省率: ${cacheHits}/${cities.length} (${Math.round(cacheHits/cities.length*100)}%)`);
}

demo().catch(console.error);
