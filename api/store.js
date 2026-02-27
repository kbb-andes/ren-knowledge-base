// Vercel Serverless Function - Store
// 配置为香港区域以优化国内访问
export const config = {
  runtime: 'edge',
  regions: ['hkg1']  // 香港节点
};

export default function handler(req, res) {
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
  
  const { key, value, type = 'default', ttl } = req.body || {};
  
  if (!key || value === undefined) {
    res.status(400).json({ success: false, error: 'MISSING_PARAMS' });
    return;
  }
  
  res.json({
    success: true,
    key,
    type,
    region: 'hkg1',
    message: 'Stored (demo mode - no persistence)'
  });
}
