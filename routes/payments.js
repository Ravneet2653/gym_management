const express = require('express');
const router = express.Router();
const db = require('../config/db');

function authCheck(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

router.get('/', authCheck, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, g.gym_name
      FROM payment p LEFT JOIN gym g ON p.gym_id = g.gym_id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authCheck, async (req, res) => {
  const { pay_id, amount, gym_id } = req.body;
  try {
    await db.query('INSERT INTO payment VALUES(?,?,?)', [pay_id, amount, gym_id || null]);
    res.json({ success: true, message: 'Payment added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authCheck, async (req, res) => {
  const { amount, gym_id } = req.body;
  try {
    await db.query('UPDATE payment SET amount=?,gym_id=? WHERE pay_id=?',
      [amount, gym_id || null, req.params.id]);
    res.json({ success: true, message: 'Payment updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authCheck, async (req, res) => {
  try {
    await db.query('DELETE FROM payment WHERE pay_id=?', [req.params.id]);
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
