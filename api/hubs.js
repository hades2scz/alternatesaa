export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const apiKey = process.env.LUAPROT_API_KEY;
  const hubId = process.env.LUAPROT_HUB_ID;

  if (!apiKey) {
    return res.status(200).json({
      success: true,
      isDemo: true,
      hubs: [
        {
          id: hubId || '40511091490620200512',
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

  try {
    const response = await fetch('https://luaprot.net/api/v1/hubs/get', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      }
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching hubs', error: err.message });
  }
}
