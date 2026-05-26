const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { verifyAPIKey } = require('../middleware/auth');

const router = express.Router();

/**
 * External Integration: POST /api/plans
 * Create a new plan instance. Authenticates via X-API-Key header.
 */
router.post('/', verifyAPIKey, async (req, res) => {
  try {
    const {
      name,
      textbook_url,
      syllabus_url,
      routine_url,
      holiday_url,
      session_start,
      session_end,
      response_url
    } = req.body;

    // Validate required fields (using snake_case as per request requirement "Accept: api_key, textbook_url...")
    if (!textbook_url || !syllabus_url || !routine_url || !holiday_url || !session_start || !session_end) {
      return res.status(400).json({ error: 'Missing required fields: textbook_url, syllabus_url, routine_url, holiday_url, session_start, session_end' });
    }

    const id = uuidv4();
    const isCallback = response_url ? 1 : 0;

    await pool.execute(
      `INSERT INTO plan_instances
        (id, school_id, name, textbook_url, syllabus_url, routine_url, holiday_calendar_url, session_start, session_end, status, is_callback, response_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [id, req.school.id, name || null, textbook_url, syllabus_url, routine_url, holiday_url, session_start, session_end, isCallback, response_url || null]
    );

    res.status(201).json({
      id,
      status: 'pending',
      message: 'Plan instance created successfully',
      callback_enabled: !!isCallback
    });
  } catch (err) {
    console.error('External generate-plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plans — list all plan instances (admin view)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, textbook_url, syllabus_url, routine_url, holiday_calendar_url,
              session_start, session_end, status, error_message, created_at, updated_at, is_callback
       FROM plan_instances
       ORDER BY created_at DESC`
    );
    res.json({ plans: rows });
  } catch (err) {
    console.error('List plans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plans/:id — get a single plan instance (including result_json)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM plan_instances WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plan instance not found' });
    }

    const plan = rows[0];
    // Parse result_json if present
    if (plan.result_json) {
      try {
        plan.result_json = JSON.parse(plan.result_json);
      } catch { /* leave as string if not valid JSON */ }
    }

    res.json({ plan });
  } catch (err) {
    console.error('Get plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/plans/:id — delete a plan instance
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      `DELETE FROM plan_instances WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan instance not found' });
    }

    res.json({ message: 'Plan instance deleted successfully' });
  } catch (err) {
    console.error('Delete plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
