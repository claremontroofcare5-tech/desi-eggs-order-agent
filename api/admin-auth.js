
import crypto from 'node:crypto';

function createToken(password) {
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ expires })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', password + '|desi-sahet-admin')
    .update(payload)
    .digest('base64url');

  return payload + '.' + signature;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return res.status(500).json({
      success: false,
      error: 'Admin password is not configured'
    });
  }

  const submitted = String(req.body?.password || '');

  const a = Buffer.from(submitted);
  const b = Buffer.from(password);

  const valid =
    a.length === b.length &&
    crypto.timingSafeEqual(a, b);

  if (!valid) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect password'
    });
  }

  return res.status(200).json({
    success: true,
    token: createToken(password)
  });
}
