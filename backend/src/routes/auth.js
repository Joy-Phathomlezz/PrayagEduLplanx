const express = require('express');
const crypto = require('crypto');
const pool = require('../db');

const router = express.Router();

// GET /api/auth/schools — list all schools
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, domain, code, api_key FROM schools ORDER BY name');
    res.json({ schools: rows });
  } catch (err) {
    console.error('List schools error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/schools/:id/keys — generate API key for a school
router.post('/:schoolId/keys', async (req, res) => {
  try {
    const { schoolId } = req.params;
    if (!schoolId) {
      return res.status(400).json({ error: 'schoolId is required' });
    }

    const apiKey = crypto.randomBytes(128).toString('hex');
    
    const [result] = await pool.execute(
      'UPDATE schools SET api_key = ? WHERE id = ?',
      [apiKey, schoolId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.status(201).json({ data: { api_key: apiKey, school_id: schoolId }, message: 'API key generated successfully' });
  } catch (err) {
    console.error('Generate key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
