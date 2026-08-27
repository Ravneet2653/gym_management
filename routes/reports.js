const express = require('express');
const router = express.Router();
const db = require('../config/db');

function authCheck(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Q1: Members with trainer info
router.get('/members-trainers', authCheck, async (req, res) => {
  const [rows] = await db.query(`
    SELECT m.mem_id, m.mem_first_name, m.mem_last_name, m.trainer_id,
           t.trainer_first_name, t.trainer_last_name
    FROM member m LEFT JOIN trainer t ON m.trainer_id = t.trainer_id
  `);
  res.json(rows);
});

// Q2: Gym total payments
router.get('/gym-totals', authCheck, async (req, res) => {
  const [rows] = await db.query(`
    SELECT g.gym_id, g.gym_name, SUM(p.amount) AS total_paid
    FROM gym g LEFT JOIN payment p ON g.gym_id = p.gym_id
    GROUP BY g.gym_id, g.gym_name
  `);
  res.json(rows);
});

// Q3: Members with mobile numbers
router.get('/members-mobiles', authCheck, async (req, res) => {
  const [rows] = await db.query(`
    SELECT m.mem_id, m.mem_first_name, m.mem_last_name, mm.mobile_no
    FROM member m LEFT JOIN mem_mobile_no mm ON m.mem_id = mm.mem_id
  `);
  res.json(rows);
});

// Q4: Trainers with workouts they instruct
router.get('/trainer-workouts', authCheck, async (req, res) => {
  const [rows] = await db.query(`
    SELECT t.trainer_id, t.trainer_first_name, t.trainer_last_name, w.workout_name
    FROM trainer t
    LEFT JOIN instructs i ON t.trainer_id = i.trainer_id
    LEFT JOIN workout w ON i.workout_id = w.workout_id
  `);
  res.json(rows);
});

// Q5: Workout plans for all members
router.get('/member-workout-plans', authCheck, async (req, res) => {
  const [rows] = await db.query(`
    SELECT m.mem_id, m.mem_first_name, m.mem_last_name,
           w.workout_name, wp.workout_schedule
    FROM member m
    LEFT JOIN enrolls_to e ON m.mem_id = e.mem_id
    LEFT JOIN workout_plan wp ON e.workout_id = wp.workout_id
    LEFT JOIN workout w ON wp.workout_id = w.workout_id
  `);
  res.json(rows);
});

// Q6: Gym type with trainer count
router.get('/gym-trainers', authCheck, async (req, res) => {
  const [rows] = await db.query(`
    SELECT g.gym_id, g.gym_name,
           GROUP_CONCAT(DISTINCT gt.type SEPARATOR ', ') AS gym_types,
           COUNT(DISTINCT t.trainer_id) AS trainer_count
    FROM gym g
    LEFT JOIN gym_type gt ON g.gym_id = gt.gym_id
    LEFT JOIN payment p ON g.gym_id = p.gym_id
    LEFT JOIN trainer t ON p.pay_id = t.pay_id
    GROUP BY g.gym_id, g.gym_name
  `);
  res.json(rows);
});

// Q7: Members NOT enrolled in any workout
router.get('/unenrolled-members', authCheck, async (req, res) => {
  const [rows] = await db.query(`
    SELECT m.mem_id, m.mem_first_name, m.mem_last_name
    FROM member m
    LEFT JOIN enrolls_to e ON m.mem_id = e.mem_id
    WHERE e.date IS NULL
  `);
  res.json(rows);
});

// Q8: Trainer timeslots
router.get('/trainer-timeslots', authCheck, async (req, res) => {
  const [rows] = await db.query(`
    SELECT t.trainer_id, t.trainer_first_name, t.trainer_last_name,
           GROUP_CONCAT(tt.time SEPARATOR ' | ') AS timeslots
    FROM trainer t
    LEFT JOIN trainer_time tt ON t.trainer_id = tt.trainer_id
    GROUP BY t.trainer_id, t.trainer_first_name, t.trainer_last_name
  `);
  res.json(rows);
});

// Dashboard stats
router.get('/stats', authCheck, async (req, res) => {
  const [[gyms]] = await db.query('SELECT COUNT(*) AS cnt FROM gym');
  const [[members]] = await db.query('SELECT COUNT(*) AS cnt FROM member');
  const [[trainers]] = await db.query('SELECT COUNT(*) AS cnt FROM trainer');
  const [[workouts]] = await db.query('SELECT COUNT(*) AS cnt FROM workout');
  const [[revenue]] = await db.query('SELECT SUM(amount) AS total FROM payment');
  res.json({
    gyms: gyms.cnt, members: members.cnt,
    trainers: trainers.cnt, workouts: workouts.cnt,
    revenue: revenue.total || 0
  });
});

module.exports = router;
