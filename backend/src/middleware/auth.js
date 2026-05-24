const jwt = require('jsonwebtoken');

/**
 * Verify JWT Bearer token — protects school-facing routes.
 */
function verifyJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.school = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Verify X-Worker-Key header — protects worker-facing routes.
 */
function verifyWorkerKey(req, res, next) {
  const key = req.headers['x-worker-key'];
  if (!key || key !== process.env.WORKER_SECRET_KEY) {
    return res.status(403).json({ error: 'Invalid worker key' });
  }
  next();
}

module.exports = { verifyJWT, verifyWorkerKey };
