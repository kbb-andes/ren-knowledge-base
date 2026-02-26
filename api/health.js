// Vercel Serverless Function - Health Check
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.json({
    status: 'ok',
    service: 'REN',
    version: process.env.REN_VERSION || '0.1.0',
    timestamp: Date.now(),
    platform: 'vercel'
  });
};
