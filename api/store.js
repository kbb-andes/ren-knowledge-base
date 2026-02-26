// Vercel Serverless Function - Store
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
    message: 'Stored (demo mode - no persistence)'
  });
}
