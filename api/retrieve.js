// Vercel Serverless Function - Retrieve
export default function handler(req, res) {
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
  
  res.status(404).json({ 
    success: false, 
    error: 'NOT_FOUND',
    message: 'Demo mode - no data persistence'
  });
}
