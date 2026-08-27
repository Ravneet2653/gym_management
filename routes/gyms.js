const express = require('express');
const router = express.Router();
const db = require('../config/db');

function authCheck(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Get all gyms with types
router.get('/', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, GROUP_CONCAT(gt.type ORDER BY gt.type SEPARATOR ', ') AS types
      FROM gym g
      LEFT JOIN gym_type gt ON g.gym_id = gt.gym_id
      GROUP BY g.gym_id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single gym
router.get('/:id', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, GROUP_CONCAT(gt.type ORDER BY gt.type SEPARATOR ', ') AS types
      FROM gym g LEFT JOIN gym_type gt ON g.gym_id = gt.gym_id
      WHERE g.gym_id = ? GROUP BY g.gym_id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Gym not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add gym
router.post('/', authCheck, async (req, res) => {
  const { gym_id, gym_name, street_no, street_name, pin_code, landmark, types } = req.body;
  try {
    await db.query('INSERT INTO gym VALUES(?,?,?,?,?,?)',
      [gym_id, gym_name, street_no, street_name, pin_code, landmark]);
    if (types && types.length) {
      for (const t of types) {
        await db.query('INSERT INTO gym_type VALUES(?,?)', [gym_id, t]);
      }
    }
    res.json({ success: true, message: 'Gym added successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update gym
router.put('/:id', authCheck, async (req, res) => {
  const { gym_name, street_no, street_name, pin_code, landmark, types } = req.body;
  try {
    await db.query('UPDATE gym SET gym_name=?,street_no=?,street_name=?,pin_code=?,landmark=? WHERE gym_id=?',
      [gym_name, street_no, street_name, pin_code, landmark, req.params.id]);
    if (types) {
      await db.query('DELETE FROM gym_type WHERE gym_id=?', [req.params.id]);
      for (const t of types) {
        await db.query('INSERT INTO gym_type VALUES(?,?)', [req.params.id, t]);
      }
    }
    res.json({ success: true, message: 'Gym updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete gym
router.delete('/:id', authCheck, async (req, res) => {
  try {
    await db.query('DELETE FROM gym WHERE gym_id=?', [req.params.id]);
    res.json({ success: true, message: 'Gym deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
