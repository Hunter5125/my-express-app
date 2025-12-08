const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireLogin, requireManager } = require('../middlewares/auth');

// GET /users - List all users
router.get('/', requireLogin, async (req, res, next) => {
  try {
    const users = await User.find().select('name email role createdAt');
    res.render('users/list', { users, session: req.session });
  } catch (error) {
    console.error('Error fetching users:', error);
    next(error);
  }
});

// GET /users/create - Show create user form
router.get('/create', requireLogin, requireManager, (req, res) => {
  res.render('users/create', { session: req.session, errors: null, old: {} });
});

// POST /users/create - Create new user
router.post('/create', requireLogin, requireManager, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const errors = [];

    if (!name || !name.trim()) errors.push({ field: 'name', msg: 'Name is required' });
    if (!email || !email.trim()) errors.push({ field: 'email', msg: 'Email is required' });
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.push({ field: 'email', msg: 'Email is invalid' });
    if (!password || password.length < 6) errors.push({ field: 'password', msg: 'Password must be at least 6 characters' });
    if (!role || !role.trim()) errors.push({ field: 'role', msg: 'Role is required' });

    if (errors.length) {
      res.status(400).render('users/create', { session: req.session, errors, old: { name, email, role } });
      return;
    }

    const newUser = new User({ name, email, passwordHash: password, role });
    await newUser.save();
    res.redirect('/users');
  } catch (error) {
    console.error('Error creating user:', error);

    // Duplicate key (e.g. email already exists)
    if (error.code === 11000) {
      const errors = [{ field: 'email', msg: 'Email already in use' }];
      res.status(409).render('users/create', { session: req.session, errors, old: { name: req.body.name, email: req.body.email, role: req.body.role } });
      return;
    }

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({ field: key, msg: error.errors[key].message }));
      res.status(400).render('users/create', { session: req.session, errors, old: { name: req.body.name, email: req.body.email, role: req.body.role } });
      return;
    }

    next(error);
  }
});

module.exports = router;
