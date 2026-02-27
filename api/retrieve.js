// Vercel Serverless Function - Retrieve with Redis
import { createClient } from 'redis';

export default async function handler(req, res) {
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
  
  try {
    const client = createClient({
      url: process.env.STORAGE_URL
    });
    await client.connect();
    
    const value = await client.get(key);
    await client.disconnect();
    
    if (value === null) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        region: 'hkg1',
        message: 'Key not found'
      });
      return;
    }
    
    // Try to parse JSON
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
    
    res.json({
      success: true,
      key,
      value: parsedValue,
      region: 'hkg1'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'RETRIEVE_ERROR',
      message: error.message
    });
  }
}
