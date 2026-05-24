const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register — create a new school account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO schools (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    );

    res.status(201).json({ id: result.insertId, name, email });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login — authenticate and return JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM schools WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const school = rows[0];
    const valid = await bcrypt.compare(password, school.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: school.id, email: school.email, name: school.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, school: { id: school.id, name: school.name, email: school.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — get current school profile
router.get('/me', verifyJWT, (req, res) => {
  res.json({ school: req.school });
});

// POST /api/auth/forgot-password - generate reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [rows] = await pool.execute('SELECT id FROM schools WHERE email = ?', [email]);
    if (rows.length === 0) {
      // Don't leak that the account doesn't exist
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    await pool.execute(
      'UPDATE schools SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [token, expires, email]
    );

    // Mock sending email
    console.log(`[Mock Email] Reset link for ${email}: http://localhost:3000/reset-password?token=${token}`);
    
    // In dev, we return it to the frontend for easy testing
    res.json({ 
      message: 'If that email exists, a reset link has been sent',
      dev_reset_link: `http://localhost:3000/reset-password?token=${token}`,
      dev_token: token
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password - execute password reset
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email FROM schools WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const school = rows[0];
    const hash = await bcrypt.hash(new_password, 10);

    await pool.execute(
      'UPDATE schools SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hash, school.id]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
