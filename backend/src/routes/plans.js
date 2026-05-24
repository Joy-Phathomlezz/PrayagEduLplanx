const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

// All routes require school JWT
router.use(verifyJWT);

// POST /api/plans — create a new plan instance (queued as pending)
router.post('/', async (req, res) => {
  try {
    const {
      textbookUrl,
      syllabusUrl,
      routineUrl,
      holidayCalendarUrl,
      sessionStart,
      sessionEnd,
    } = req.body;

    if (!textbookUrl || !syllabusUrl || !routineUrl || !holidayCalendarUrl || !sessionStart || !sessionEnd) {
      return res.status(400).json({ error: 'All fields are required: textbookUrl, syllabusUrl, routineUrl, holidayCalendarUrl, sessionStart, sessionEnd' });
    }

    const id = uuidv4();

    await pool.execute(
      `INSERT INTO plan_instances
        (id, school_id, textbook_url, syllabus_url, routine_url, holiday_calendar_url, session_start, session_end, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, req.school.id, textbookUrl, syllabusUrl, routineUrl, holidayCalendarUrl, sessionStart, sessionEnd]
    );

    res.status(201).json({
      id,
      status: 'pending',
      message: 'Plan instance created and queued for processing',
    });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plans — list all plan instances for the logged-in school
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, textbook_url, syllabus_url, routine_url, holiday_calendar_url,
              session_start, session_end, status, error_message, created_at, updated_at
       FROM plan_instances
       WHERE school_id = ?
       ORDER BY created_at DESC`,
      [req.school.id]
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
      `SELECT * FROM plan_instances WHERE id = ? AND school_id = ?`,
      [req.params.id, req.school.id]
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
      `DELETE FROM plan_instances WHERE id = ? AND school_id = ?`,
      [req.params.id, req.school.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan instance not found or unauthorized' });
    }

    res.json({ message: 'Plan instance deleted successfully' });
  } catch (err) {
    console.error('Delete plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
