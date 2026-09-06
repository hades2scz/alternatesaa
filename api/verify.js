export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { key, hubId } = req.body || {};
  if (!key || typeof key !== 'string' || !key.trim()) {
    return res.status(400).json({ success: false, message: 'Key parameter is required.' });
  }

  const cleanKey = key.trim();
  const apiKey = process.env.LUAPROT_API_KEY;
  const targetHub = hubId || process.env.LUAPROT_HUB_ID;

  if (!apiKey) {
    if (cleanKey.toLowerCase().includes('invalid') || cleanKey.toLowerCase().includes('fail')) {
      return res.status(404).json({
        success: false,
        isDemo: true,
        message: 'Key could not be found or has expired.'
      });
    }

    const isBlacklisted = cleanKey.toLowerCase().includes('black');
    return res.status(200).json({
      success: true,
      isDemo: true,
      message: 'Key validated successfully (Demo Mode).',
      key: {
        key: cleanKey,
        hubId: targetHub || '40511091490620200512',
        hubName: 'Apex Hub (Demo)',
        discordId: '789123456789012345',
        expire: Math.floor(Date.now() / 1000) + 86400 * 30,
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

  try {
    let endpoint = targetHub 
      ? `https://luaprot.net/api/v1/hubs/${encodeURIComponent(targetHub)}/keys/info?key=${encodeURIComponent(cleanKey)}`
      : `https://luaprot.net/api/v1/keys/fetch?key=${encodeURIComponent(cleanKey)}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      }
    });

    const data = await response.json();
    if (data.keys && Array.isArray(data.keys)) {
      if (data.keys.length > 0) {
        return res.status(200).json({ success: true, message: 'Successfully fetched key.', key: data.keys[0] });
      } else {
        return res.status(404).json({ success: false, message: 'Key could not be found.' });
      }
    }

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
}
