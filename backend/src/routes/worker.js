const express = require('express');
const pool = require('../db');
const { verifyWorkerKey } = require('../middleware/auth');

const router = express.Router();

// All routes require worker key
router.use(verifyWorkerKey);

/**
 * GET /api/tasks/next
 * Atomically fetch the oldest pending task and mark it as processing.
 * Uses SELECT ... FOR UPDATE to prevent race conditions between multiple workers.
 */
router.get('/next', async (req, res) => {
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
 * Callback Dispatcher (The "Secret Sauce")
 * Asynchronously sends the result to the response_url.
 */
async function dispatchCallback(taskId, resultJson, responseUrl) {
  try {
    console.log(` Dispatching callback for task ${taskId} to ${responseUrl}`);
    
    const response = await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        LessonPlanJSON: resultJson
      })
    });

    if (response.ok) {
      await pool.execute(
        "UPDATE plan_instances SET status = 'callback_sent' WHERE id = ?",
        [taskId]
      );
      console.log(`Callback sent successfully for task ${taskId}`);
    } else {
      throw new Error(`Response status ${response.status}`);
    }
  } catch (err) {
    console.error(`Callback failed for task ${taskId}:`, err.message);
    await pool.execute(
      "UPDATE plan_instances SET status = 'callback_failed' WHERE id = ?",
      [taskId]
    );
  }
}

/**
 * POST /api/tasks/:id/complete
 * Mark a task as completed and submit the generated JSON result.
 */
router.post('/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { LessonPlanJSON } = req.body;
    if (!taskId || LessonPlanJSON === undefined) {
      return res.status(400).json({ error: 'taskId and resultJson are required' });
    }

    const jsonStr = typeof LessonPlanJSON === 'string' ? LessonPlanJSON : JSON.stringify(LessonPlanJSON);

    // Get task info first to check for callback
    const [rows] = await pool.execute(
      "SELECT is_callback, response_url FROM plan_instances WHERE id = ?",
      [taskId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = rows[0];

    const [result] = await pool.execute(
      `UPDATE plan_instances SET status = 'completed', result_json = ? WHERE id = ? AND status = 'processing'`,
      [jsonStr, taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found or not in processing state' });
    }

    // Trigger callback if enabled
    if (task.is_callback && task.response_url) {
      // Fire and forget (don't await to keep endpoint atomic)
      dispatchCallback(taskId, LessonPlanJSON, task.response_url);
    }

    res.json({ message: 'Task completed successfully' });
  } catch (err) {
    console.error('complete-task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/fail
 * Mark a task as failed with an error message.
 */
router.post('/:taskId/fail', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { errorMessage } = req.body;
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
