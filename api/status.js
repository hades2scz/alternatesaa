export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const apiKey = process.env.LUAPROT_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      isDemo: true,
      message: 'Running in Demo Mode. Provide LUAPROT_API_KEY on Vercel/Railway for live status.',
      status: 'OK',
      version: 'v1 (Demo)',
      active: true,
      warnings: ['LUAPROT_API_KEY environment variable not set'],
      validToken: false
    });
  }

  try {
    const response = await fetch('https://luaprot.net/api/v1/status/get', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      }
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to contact LuaProt', error: err.message });
  }
}
