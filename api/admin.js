
import crypto from 'node:crypto';

function verifyToken(token, password) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return false;

    const [payload, signature] = parts;

    const expected = crypto
      .createHmac('sha256', password + '|desi-sahet-admin')
      .update(payload)
      .digest('base64url');

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length ||
        !crypto.timingSafeEqual(a, b)) {
      return false;
    }

    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString()
    );

    return Number(data.expires) > Date.now();
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_API_SECRET;
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

  if (!password || !secret || !scriptUrl) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration missing'
    });
  }

  const token = String(
    req.headers.authorization || ''
  ).replace(/^Bearer\s+/i, '');

  if (!verifyToken(token, password)) {
    return res.status(401).json({
      success: false,
      error: 'Session expired. Please login again.'
    });
  }

  const allowedActions = [
    'adminGetData',
    'adminUpdateOrder',
    'adminUpdateQuestion',
    'adminSaveKnowledge'
  ];

  const action = String(req.body?.action || '');

  if (!allowedActions.includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid action'
    });
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...req.body,
        action,
        adminSecret: secret
      })
    });

    const result = await response.json();

    return res.status(200).json(result);

  } catch (error) {
    return res.status(502).json({
      success: false,
      error: 'Database connection failed'
    });
  }
}
