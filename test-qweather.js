const fetch = require('node-fetch');

const QWEATHER_HOST = 'nq5u9whmgf.re.qweatherapi.com';
const QWEATHER_JWT = 'eyJhbGciOiJFZERTQSIsImtpZCI6IlRNNThHSkpDSzgifQ.eyJzdWIiOiIyQ0UyWU0zQjM5IiwiaWF0IjoxNzcyMTA0Mzc0LCJleHAiOjE3NzIxMDUyNzR9.RGq9xudNETx4INaFTZ4INCqYkuDsr1JLmO3_4FqIHvxyeWXkVwowdRqyPb4jOTZckC5qtY4JSbYv6qaTGWWKAA';

async function test() {
  console.log('测试和风天气 API...\n');
  
  const url = `https://${QWEATHER_HOST}/v7/weather/now?location=101010100`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${QWEATHER_JWT}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ 和风天气 API 正常');
    console.log(`北京: ${data.now.text} ${data.now.temp}°C`);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

test();
