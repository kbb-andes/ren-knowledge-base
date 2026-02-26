// Vercel Serverless Function - Store
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  
  // 简单内存存储（Phase 1）
  const { key, value, type = 'default', ttl } = req.body || {};
  
  if (!key || value === undefined) {
    res.status(400).json({ success: false, error: 'MISSING_PARAMS' });
    return;
  }
  
  // 存储到内存（实际部署后会丢失，Phase 2 改用数据库）
  global.REN_STORE = global.REN_STORE || {};
  global.REN_STORE[key] = {
    value,
    type,
    createdAt: Date.now(),
    expiresAt: ttl ? Date.now() + ttl * 1000 : null
  };
  
  res.json({
    success: true,
    key,
    type,
    message: 'Stored (memory only, will be lost on restart)'
  });
};
