const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'gym_cluster_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/gyms',    require('./routes/gyms'));
app.use('/api/members', require('./routes/members'));
app.use('/api/trainers',require('./routes/trainers'));
app.use('/api/workouts',require('./routes/workouts'));
app.use('/api/payments',require('./routes/payments'));
app.use('/api/reports', require('./routes/reports'));

// Middleware: protect all page routes
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/');
}

// Page routes
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

app.get('/dashboard', requireLogin, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard.html')));

app.get('/gyms', requireLogin, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'pages', 'gyms.html')));

app.get('/members', requireLogin, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'pages', 'members.html')));

app.get('/trainers', requireLogin, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'pages', 'trainers.html')));

app.get('/workouts', requireLogin, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'pages', 'workouts.html')));

app.get('/payments', requireLogin, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'pages', 'payments.html')));

app.get('/reports', requireLogin, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'pages', 'reports.html')));

app.listen(3000, () => console.log('✅ THE CLUSTER running on http://localhost:3000'));
