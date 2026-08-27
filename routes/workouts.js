const express = require('express');
const router = express.Router();
const db = require('../config/db');

function authCheck(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Get all workouts with plans
router.get('/', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT w.*, wp.workout_schedule, wp.workout_repetition
      FROM workout w LEFT JOIN workout_plan wp ON w.workout_id = wp.workout_id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add workout
router.post('/', authCheck, async (req, res) => {
  const { workout_id, workout_name, description, workout_schedule, workout_repetition } = req.body;
  try {
    await db.query('INSERT INTO workout VALUES(?,?,?)', [workout_id, workout_name, description]);
    if (workout_schedule) {
      await db.query('INSERT INTO workout_plan VALUES(?,?,?)',
        [workout_id, workout_schedule, workout_repetition || null]);
    }
    res.json({ success: true, message: 'Workout added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update workout
router.put('/:id', authCheck, async (req, res) => {
  const { workout_name, description, workout_schedule, workout_repetition } = req.body;
  try {
    await db.query('UPDATE workout SET workout_name=?,description=? WHERE workout_id=?',
      [workout_name, description, req.params.id]);
    const [exist] = await db.query('SELECT 1 FROM workout_plan WHERE workout_id=?', [req.params.id]);
    if (exist.length) {
      await db.query('UPDATE workout_plan SET workout_schedule=?,workout_repetition=? WHERE workout_id=?',
        [workout_schedule, workout_repetition, req.params.id]);
    } else if (workout_schedule) {
      await db.query('INSERT INTO workout_plan VALUES(?,?,?)',
        [req.params.id, workout_schedule, workout_repetition]);
    }
    res.json({ success: true, message: 'Workout updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete workout
router.delete('/:id', authCheck, async (req, res) => {
  try {
    await db.query('DELETE FROM workout WHERE workout_id=?', [req.params.id]);
    res.json({ success: true, message: 'Workout deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Enroll member in workout
router.post('/enroll', authCheck, async (req, res) => {
  const { mem_id, workout_id, date } = req.body;
  try {
    await db.query('INSERT INTO enrolls_to VALUES(?,?,?)', [mem_id, workout_id, date]);
    res.json({ success: true, message: 'Member enrolled in workout' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
