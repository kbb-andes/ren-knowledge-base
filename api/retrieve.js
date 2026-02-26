// Vercel Serverless Function - Retrieve
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  
  const { key } = req.query || {};
  
  if (!key) {
    res.status(400).json({ success: false, error: 'MISSING_KEY' });
    return;
  }
  
  global.REN_STORE = global.REN_STORE || {};
  const data = global.REN_STORE[key];
  
  if (!data) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' });
    return;
  }
  
  // 检查过期
  if (data.expiresAt && Date.now() > data.expiresAt) {
    res.status(404).json({ success: false, error: 'EXPIRED', isStale: true });
    return;
  }
  
  res.json({
    success: true,
    key,
    value: data.value,
    type: data.type,
    createdAt: data.createdAt
  });
};
