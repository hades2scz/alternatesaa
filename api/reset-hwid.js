export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { key, hubId } = req.body || {};
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ success: false, message: 'Key is required.' });
  }

  const cleanKey = key.trim();
  const apiKey = process.env.LUAPROT_API_KEY;
  const targetHub = hubId || process.env.LUAPROT_HUB_ID;

  if (!apiKey) {
    return res.status(200).json({
      success: true,
      isDemo: true,
      message: 'HWID reset successfully (Demo Mode).',
      resets: [cleanKey]
    });
  }

  if (!targetHub) {
    return res.status(400).json({
      success: false,
      message: 'Hub ID is required to reset HWID.'
    });
  }

  try {
    const endpoint = `https://luaprot.net/api/v1/hubs/${encodeURIComponent(targetHub)}/hwid/reset?key=${encodeURIComponent(cleanKey)}`;
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'HWID reset failed', error: err.message });
  }
}
