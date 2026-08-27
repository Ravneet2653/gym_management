const express = require('express');
const router = express.Router();
const db = require('../config/db');

function authCheck(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Get all trainers with mobile, timeslots and workout count
router.get('/', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.trainer_id, t.trainer_first_name, t.trainer_last_name, t.pay_id,
             GROUP_CONCAT(DISTINCT tm.mobile_no SEPARATOR ', ') AS mobile_numbers,
             GROUP_CONCAT(DISTINCT tt.time SEPARATOR ', ') AS timeslots,
             get_trainer_workouts(t.trainer_id) AS workout_count
      FROM trainer t
      LEFT JOIN trainer_mobile_no tm ON t.trainer_id = tm.trainer_id
      LEFT JOIN trainer_time tt ON t.trainer_id = tt.trainer_id
      GROUP BY t.trainer_id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single trainer
router.get('/:id', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*,
             GROUP_CONCAT(DISTINCT tm.mobile_no SEPARATOR ', ') AS mobile_numbers,
             GROUP_CONCAT(DISTINCT tt.time SEPARATOR ', ') AS timeslots
      FROM trainer t
      LEFT JOIN trainer_mobile_no tm ON t.trainer_id = tm.trainer_id
      LEFT JOIN trainer_time tt ON t.trainer_id = tt.trainer_id
      WHERE t.trainer_id=? GROUP BY t.trainer_id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Trainer not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add trainer
router.post('/', authCheck, async (req, res) => {
  const { trainer_id, pay_id, trainer_first_name, trainer_last_name, mobile_numbers, timeslots } = req.body;
  try {
    await db.query('INSERT INTO trainer VALUES(?,?,?,?)',
      [trainer_id, pay_id || null, trainer_first_name, trainer_last_name]);
    // Trigger auto-inserts default time; add more if provided
    if (timeslots && timeslots.length) {
      await db.query('DELETE FROM trainer_time WHERE trainer_id=?', [trainer_id]);
      for (const ts of timeslots) {
        if (ts.trim()) await db.query('INSERT INTO trainer_time VALUES(?,?)', [trainer_id, ts.trim()]);
      }
    }
    if (mobile_numbers && mobile_numbers.length) {
      for (const mob of mobile_numbers) {
        if (mob.trim()) await db.query('INSERT INTO trainer_mobile_no VALUES(?,?)', [mob.trim(), trainer_id]);
      }
    }
    res.json({ success: true, message: 'Trainer added successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update trainer
router.put('/:id', authCheck, async (req, res) => {
  const { pay_id, trainer_first_name, trainer_last_name } = req.body;
  try {
    await db.query('UPDATE trainer SET pay_id=?,trainer_first_name=?,trainer_last_name=? WHERE trainer_id=?',
      [pay_id || null, trainer_first_name, trainer_last_name, req.params.id]);
    res.json({ success: true, message: 'Trainer updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete trainer
router.delete('/:id', authCheck, async (req, res) => {
  try {
    await db.query('DELETE FROM trainer WHERE trainer_id=?', [req.params.id]);
    res.json({ success: true, message: 'Trainer deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Assign trainer to workout (uses procedure)
router.post('/assign-workout', authCheck, async (req, res) => {
  const { trainer_id, workout_id } = req.body;
  try {
    await db.query('CALL add_instructs(?,?)', [trainer_id, workout_id]);
    res.json({ success: true, message: 'Trainer assigned to workout' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Trainer workouts
router.get('/:id/workouts', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT w.workout_id, w.workout_name, w.description
      FROM instructs i JOIN workout w ON i.workout_id = w.workout_id
      WHERE i.trainer_id=?`, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
