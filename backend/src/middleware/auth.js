const pool = require('../db');

function verifyWorkerKey(req, res, next) {
  const key = req.headers['x-worker-key'];
  if (!key || key !== process.env.WORKER_SECRET_KEY) {
    return res.status(403).json({ error: 'Invalid worker key' });
  }
  next();
}

/**
 * Verify X-API-Key header — protects external school integration routes.
 */
async function verifyAPIKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ error: 'Missing X-API-Key header' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, domain, code FROM schools WHERE api_key = ?',
      [key]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.school = rows[0];
    next();
  } catch (err) {
    console.error('API key verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { verifyWorkerKey, verifyAPIKey };
