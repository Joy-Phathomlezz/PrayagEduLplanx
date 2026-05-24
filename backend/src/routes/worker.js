const express = require('express');
const pool = require('../db');
const { verifyWorkerKey } = require('../middleware/auth');

const router = express.Router();

// All routes require worker key
router.use(verifyWorkerKey);

/**
 * GET /api/worker/next-task
 * Atomically fetch the oldest pending task and mark it as processing.
 * Uses SELECT ... FOR UPDATE to prevent race conditions between multiple workers.
 */
router.get('/next-task', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the oldest pending row
    const [rows] = await conn.execute(
      `SELECT id, school_id, textbook_url, syllabus_url, routine_url,
              holiday_calendar_url, session_start, session_end
       FROM plan_instances
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE`,
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.json({ task: null, message: 'No pending tasks' });
    }

    const task = rows[0];

    // Atomically set to processing
    await conn.execute(
      `UPDATE plan_instances SET status = 'processing' WHERE id = ?`,
      [task.id]
    );

    await conn.commit();

    res.json({ task });
  } catch (err) {
    await conn.rollback();
    console.error('next-task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

/**
 * POST /api/worker/complete-task
 * Worker submits the generated JSON result.
 */
router.post('/complete-task', async (req, res) => {
  try {
    const { taskId, resultJson } = req.body;
    if (!taskId || resultJson === undefined) {
      return res.status(400).json({ error: 'taskId and resultJson are required' });
    }

    const jsonStr = typeof resultJson === 'string' ? resultJson : JSON.stringify(resultJson);

    const [result] = await pool.execute(
      `UPDATE plan_instances SET status = 'completed', result_json = ? WHERE id = ? AND status = 'processing'`,
      [jsonStr, taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found or not in processing state' });
    }

    res.json({ message: 'Task completed successfully' });
  } catch (err) {
    console.error('complete-task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/worker/fail-task
 * Worker reports a task failure.
 */
router.post('/fail-task', async (req, res) => {
  try {
    const { taskId, errorMessage } = req.body;
    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

    const [result] = await pool.execute(
      `UPDATE plan_instances SET status = 'failed', error_message = ? WHERE id = ? AND status = 'processing'`,
      [errorMessage || 'Unknown error', taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found or not in processing state' });
    }

    res.json({ message: 'Task marked as failed' });
  } catch (err) {
    console.error('fail-task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
