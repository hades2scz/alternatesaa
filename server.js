const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const LUAPROT_API_KEY = process.env.LUAPROT_API_KEY || '';
const LUAPROT_HUB_ID = process.env.LUAPROT_HUB_ID || '';
const LUAPROT_BASE_URL = 'https://luaprot.net';

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger for Railway deployment logs
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Railway / Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    hasApiKey: Boolean(LUAPROT_API_KEY),
    hasHubId: Boolean(LUAPROT_HUB_ID)
  });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Helper for LuaProt requests
async function callLuaProt(endpoint, options = {}) {
  if (!LUAPROT_API_KEY) {
    return { isDemo: true };
  }

  const url = `${LUAPROT_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': LUAPROT_API_KEY,
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response from LuaProt' }));
  return { status: response.status, data };
}

// 1. API Status Route
app.get('/api/status', async (req, res) => {
  try {
    if (!LUAPROT_API_KEY) {
      return res.json({
        success: true,
        isDemo: true,
        message: 'Running in Demo Mode. Provide LUAPROT_API_KEY for live data.',
        status: 'OK',
        version: 'v1 (Demo)',
        active: true,
        warnings: ['LUAPROT_API_KEY environment variable not set'],
        validToken: false
      });
    }

    const result = await callLuaProt('/api/v1/status/get', { method: 'GET' });
    if (result.isDemo) {
      return res.json({ success: true, isDemo: true, status: 'OK', active: true });
    }

    return res.status(result.status || 200).json(result.data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to LuaProt API',
      error: error.message
    });
  }
});

// 2. Hubs Route
app.get('/api/hubs', async (req, res) => {
  try {
    if (!LUAPROT_API_KEY) {
      return res.json({
        success: true,
        isDemo: true,
        message: 'Hubs fetched (Demo)',
        hubs: [
          {
            id: LUAPROT_HUB_ID || '40511091490620200512',
            name: 'Apex Hub (Demo)',
            enabled: 1,
            hwidResetGap: 86400,
            scripts: [
              {
                id: '45006455740750038081',
                name: 'Main Executive Script',
                enabled: 1,
                version: 4,
                hwidLock: true
              },
              {
                id: '45006455740750038082',
                name: 'Bypass Utility Suite',
                enabled: 1,
                version: 2,
                hwidLock: true
              }
            ]
          }
        ]
      });
    }

    const result = await callLuaProt('/api/v1/hubs/get', { method: 'GET' });
    return res.status(result.status || 200).json(result.data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching hubs',
      error: error.message
    });
  }
});

// 3. Key Verification & Info Route
app.post('/api/verify', async (req, res) => {
  try {
    const { key, hubId } = req.body;
    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Key parameter is required.'
      });
    }

    const cleanKey = key.trim();
    const targetHub = hubId || LUAPROT_HUB_ID;

    if (!LUAPROT_API_KEY) {
      // Demo validation logic
      if (cleanKey.toLowerCase().includes('invalid') || cleanKey.toLowerCase().includes('fail')) {
        return res.status(404).json({
          success: false,
          isDemo: true,
          message: 'Key could not be found or has expired.'
        });
      }

      const isBlacklisted = cleanKey.toLowerCase().includes('black');
      return res.json({
        success: true,
        isDemo: true,
        message: 'Key validated successfully (Demo Mode).',
        key: {
          key: cleanKey,
          hubId: targetHub || '40511091490620200512',
          hubName: 'Apex Hub (Demo)',
          discordId: '789123456789012345',
          expire: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
          created: Math.floor(Date.now() / 1000) - 86400 * 2,
          activated: true,
          hwid: 'HWID-' + cleanKey.slice(-8).toUpperCase() + '-SECURE',
          hwidResetCount: 0,
          lastHwidReset: 0,
          executionCount: 14,
          lastExecution: Math.floor(Date.now() / 1000) - 1200,
          blacklisted: isBlacklisted,
          blacklistReason: isBlacklisted ? 'Violation of terms (Demo)' : null,
          limitedScripts: ['45006455740750038081', '45006455740750038082'],
          discordData: {
            username: 'demo_user',
            global_name: 'Demo Pilot'
          }
        }
      });
    }

    // Call LuaProt API
    // If hubId is available, call /api/v1/hubs/:hubId/keys/info?key=...
    let endpoint = '';
    if (targetHub) {
      endpoint = `/api/v1/hubs/${encodeURIComponent(targetHub)}/keys/info?key=${encodeURIComponent(cleanKey)}`;
    } else {
      // Fallback to fetch keys route
      endpoint = `/api/v1/keys/fetch?key=${encodeURIComponent(cleanKey)}`;
    }

    const result = await callLuaProt(endpoint, { method: 'GET' });
    
    // If keys/fetch was used, extract first matching key
    if (result.data && result.data.keys && Array.isArray(result.data.keys)) {
      if (result.data.keys.length > 0) {
        return res.json({
          success: true,
          message: 'Key found successfully.',
          key: result.data.keys[0]
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Key could not be found.'
        });
      }
    }

    return res.status(result.status || 200).json(result.data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify key with LuaProt',
      error: error.message
    });
  }
});

// 4. HWID Reset Route
app.post('/api/reset-hwid', async (req, res) => {
  try {
    const { key, hubId } = req.body;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ success: false, message: 'Key is required.' });
    }

    const cleanKey = key.trim();
    const targetHub = hubId || LUAPROT_HUB_ID;

    if (!LUAPROT_API_KEY) {
      return res.json({
        success: true,
        isDemo: true,
        message: 'HWID reset successfully (Demo Mode).',
        resets: [cleanKey]
      });
    }

    if (!targetHub) {
      return res.status(400).json({
        success: false,
        message: 'Hub ID is required to reset HWID. Set LUAPROT_HUB_ID in environment or provide hubId.'
      });
    }

    const endpoint = `/api/v1/hubs/${encodeURIComponent(targetHub)}/hwid/reset?key=${encodeURIComponent(cleanKey)}`;
    const result = await callLuaProt(endpoint, { method: 'PATCH' });
    return res.status(result.status || 200).json(result.data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'HWID reset failed',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Mode: ${LUAPROT_API_KEY ? 'Live LuaProt API' : 'Demo Mock Mode (No LUAPROT_API_KEY)'}`);
});
