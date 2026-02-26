/**
 * REN Token节省效果测试
 * 对比：直接获取天气 vs 从REN读取
 */

const { RENClient } = require('../src/client.js');

const client = new RENClient('http://localhost:8787');

// 模拟天气数据（实际场景中需要调用天气API）
function fetchWeatherFromAPI(city) {
  // 模拟API调用成本：消耗Token，网络请求
  console.log(`[API调用] 获取 ${city} 天气... (消耗Token)`);
  return {
    city: city,
    temp: 12,
    condition: '多云',
    humidity: 45,
    updatedAt: new Date().toISOString(),
  };
}

// 场景1：机器人A获取天气并存储到REN
async function robotAStoreWeather(city) {
  console.log('\n=== 机器人A：获取并存储天气 ===');
  
  // 调用API获取（消耗Token）
  const weather = fetchWeatherFromAPI(city);
  
  // 存储到REN（几乎不消耗Token）
  const key = `weather/${city}/${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;
  const result = await client.store(key, weather, 3600000); // 1小时过期
  
  console.log('存储结果:', result.success ? '成功' : '失败');
  console.log('Key:', key);
  
  return key;
}

// 场景2：机器人B从REN读取天气（节省Token）
async function robotBReadWeather(key) {
  console.log('\n=== 机器人B：从REN读取天气 ===');
  
  // 从REN读取（几乎不消耗Token）
  console.log(`[REN读取] 获取天气... (节省Token)`);
  const result = await client.retrieve(key);
  
  if (result.success) {
    console.log('读取成功:', result.value);
    console.log('访问次数:', result.accessCount);
    console.log('✅ Token节省成功！');
  } else {
    console.log('读取失败:', result.error);
  }
  
  return result;
}

// 场景3：机器人C也读取同样的数据（进一步节省）
async function robotCReadWeather(key) {
  console.log('\n=== 机器人C：再次从REN读取 ===');
  
  const result = await client.retrieve(key);
  
  if (result.success) {
    console.log('读取成功:', result.value.city, result.value.temp + '°C');
    console.log('累计访问次数:', result.accessCount);
    console.log('✅ 多次复用，Token节省效果倍增！');
  }
  
  return result;
}

// 运行测试
async function runTest() {
  console.log('=== REN Token节省效果测试 ===\n');
  
  // 机器人A获取并存储
  const key = await robotAStoreWeather('beijing');
  
  // 机器人B读取（节省）
  await robotBReadWeather(key);
  
  // 机器人C读取（进一步节省）
  await robotCReadWeather(key);
  
  // 统计
  console.log('\n=== 统计信息 ===');
  const stats = await client.stats();
  console.log('总记录数:', stats.totalRecords);
  console.log('内存使用:', stats.memoryUsage, 'bytes');
  
  console.log('\n=== 结论 ===');
  console.log('1次API调用 → 3次数据访问');
  console.log('节省Token: 2次API调用成本');
  console.log('节省比例: 66.7%');
}

runTest().catch(console.error);
