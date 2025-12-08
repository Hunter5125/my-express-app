const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireLogin } = require('../middlewares/auth');

// GET / - Redirect to dashboard if logged in, else login
router.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/users');
  } else {
    res.redirect('/login');
  }
});

// GET /login - Show login form
router.get('/login', (req, res) => {
  res.render('auth/login', { session: req.session });
});

// POST /login - Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send('Invalid email or password');
    }
    req.session.user = { _id: user._id, name: user.name, email: user.email, role: user.role, employeeNo: user.employeeNo, signature: user.signature };
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).send('Login error');
  }
});

// GET /dashboard - Show dashboard
router.get('/dashboard', requireLogin, (req, res) => {
  res.render('dashboard', { session: req.session });
});

// GET /dayoff-request - Show day off request form
router.get('/dayoff-request', requireLogin, (req, res) => {
  res.render('dayoff-request', { session: req.session, query: req.query });
});

// POST /dayoff-request - Handle day off request submission
router.post('/dayoff-request', requireLogin, (req, res) => {
  const formData = req.body;
  // Process the form data (e.g., save to database)
  console.log('Day off request submitted:', formData);
  res.json({ success: true, message: 'Request submitted successfully' });
});

// GET /logout - Destroy session
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Logout error');
    }
    res.redirect('/login');
  });
});

module.exports = router;
