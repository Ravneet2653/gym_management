const express = require('express');
const router = express.Router();
const db = require('../config/db');

function authCheck(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Get all members with trainer info and mobile numbers
router.get('/', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.mem_id, m.mem_first_name, m.mem_last_name, m.dob,
             m.age,
             m.pay_id, m.trainer_id,
             CONCAT(t.trainer_first_name,' ',t.trainer_last_name) AS trainer_name,
             GROUP_CONCAT(mm.mobile_no SEPARATOR ', ') AS mobile_numbers
      FROM member m
      LEFT JOIN trainer t ON m.trainer_id = t.trainer_id
      LEFT JOIN mem_mobile_no mm ON m.mem_id = mm.mem_id
      GROUP BY m.mem_id
    `);
    res.json(rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Get single member
router.get('/:id', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, 
             GROUP_CONCAT(mm.mobile_no SEPARATOR ', ') AS mobile_numbers
      FROM member m
      LEFT JOIN mem_mobile_no mm ON m.mem_id = mm.mem_id
      WHERE m.mem_id=? GROUP BY m.mem_id
    `, [req.params.id]);

    if (!rows.length) 
      return res.status(404).json({ error: 'Member not found' });

    res.json(rows[0]);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Add member using procedure
router.post('/', authCheck, async (req, res) => {
  const { mem_id, dob, pay_id, trainer_id, mem_first_name, mem_last_name, mobile_numbers } = req.body;
  try {
    await db.query('CALL add_member(?,?,?,?,?,?)',
      [mem_id, dob, pay_id, trainer_id || null, mem_first_name, mem_last_name]);

    if (mobile_numbers && mobile_numbers.length) {
      for (const mob of mobile_numbers) {
        if (mob.trim()) {
          await db.query('INSERT INTO mem_mobile_no VALUES(?,?)', [mob.trim(), mem_id]);
        }
      }
    }

    res.json({ success: true, message: 'Member added successfully' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Update member
router.put('/:id', authCheck, async (req, res) => {
  const { dob, pay_id, trainer_id, mem_first_name, mem_last_name } = req.body;
  try {
    await db.query(`
      UPDATE member 
      SET dob=?, pay_id=?, trainer_id=?, mem_first_name=?, mem_last_name=? 
      WHERE mem_id=?
    `, [dob, pay_id, trainer_id || null, mem_first_name, mem_last_name, req.params.id]);

    res.json({ success: true, message: 'Member updated' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Delete member
router.delete('/:id', authCheck, async (req, res) => {
  try {
    await db.query('DELETE FROM member WHERE mem_id=?', [req.params.id]);
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Get workouts enrolled by member (uses function)
router.get('/:id/workouts', authCheck, async (req, res) => {
  try {
    const [count] = await db.query(
      'SELECT get_member_workouts(?) AS total_workouts', 
      [req.params.id]
    );

    const [workouts] = await db.query(`
      SELECT w.workout_id, w.workout_name, w.description, e.date,
             wp.workout_schedule, wp.workout_repetition
      FROM enrolls_to e
      JOIN workout w ON e.workout_id = w.workout_id
      LEFT JOIN workout_plan wp ON w.workout_id = wp.workout_id
      WHERE e.mem_id = ?
    `, [req.params.id]);

    res.json({ total: count[0].total_workouts, workouts });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Members not enrolled in any workout
router.get('/filter/no-workout', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.mem_id, m.mem_first_name, m.mem_last_name
      FROM member m
      LEFT JOIN enrolls_to e ON m.mem_id = e.mem_id
      WHERE e.date IS NULL
    `);
    res.json(rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;