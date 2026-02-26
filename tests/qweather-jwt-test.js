/**
 * 和风天气 JWT 测试
 */

const crypto = require('crypto');

const KEY_ID = 'TM58GJJCK8';
const PROJECT_ID = '2CE2YM3B39';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIF5blWPtzp+KXeGYC5XJjxy4Z4aeYxzZLh6NKnCleuIw
-----END PRIVATE KEY-----`;

// 生成 JWT
function generateJWT() {
  const header = {
    alg: 'EdDSA',
    kid: KEY_ID,
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + 3600, // 1小时过期
    sub: PROJECT_ID,
  };
  
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const message = `${headerB64}.${payloadB64}`;
  
  // 签名
  const signature = crypto.sign(null, Buffer.from(message), PRIVATE_KEY);
  const signatureB64 = signature.toString('base64url');
  
  return `${message}.${signatureB64}`;
}

// 测试请求
async function testWeatherAPI() {
  const jwt = generateJWT();
  
  console.log('Generated JWT:', jwt.substring(0, 50) + '...');
  
  // 测试城市搜索（北京）
  const url = `https://geoapi.qweather.com/v2/city/lookup?location=beijing`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.code === '200') {
      console.log('✅ JWT 认证成功！');
      console.log('城市:', data.location?.[0]?.name);
      console.log('城市ID:', data.location?.[0]?.id);
    } else {
      console.log('❌ 请求失败:', data.code, data.message);
    }
    
  } catch (error) {
    console.error('❌ 请求错误:', error.message);
  }
}

testWeatherAPI();
