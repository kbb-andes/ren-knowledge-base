// Vercel Serverless Function - Store with Redis
import { createClient } from 'redis';

export default async function handler(req, res) {
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
  
  try {
    const client = createClient({
      url: process.env.REDIS_URL
    });
    await client.connect();
    
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    if (ttl) {
      await client.setEx(key, ttl, stringValue);
    } else {
      await client.set(key, stringValue);
    }
    
    await client.disconnect();
    
    res.json({
      success: true,
      key,
      type,
      region: 'hkg1',
      message: 'Stored successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'STORAGE_ERROR',
      message: error.message
    });
  }
}
