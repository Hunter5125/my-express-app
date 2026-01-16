const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { requireLogin, requireManager } = require('../middlewares/auth');

// GET /departments - List all departments
router.get('/', requireLogin, async (req, res, next) => {
  try {
    // Block employees
    if (req.session.user.role === 'employee') {
      return res.status(403).send('Access denied. Employees cannot access this page.');
    }
    const departments = await Department.find().sort({ createdAt: -1 });
    res.render('departments/list', { departments, session: req.session });
  } catch (error) {
    console.error('Error fetching departments:', error);
    next(error);
  }
});

// GET /departments/create - Show create department form
router.get('/create', requireLogin, requireManager, (req, res) => {
  res.render('departments/create', { session: req.session, errors: null, old: {} });
});

// POST /departments/create - Create new department
router.post('/create', requireLogin, requireManager, async (req, res, next) => {
  try {
    const { name } = req.body;
    const errors = [];

    if (!name || !name.trim()) errors.push({ field: 'name', msg: 'Name is required' });

    if (errors.length) {
      res.status(400).render('departments/create', { session: req.session, errors, old: { name } });
      return;
    }

    const newDepartment = new Department({ name });
    await newDepartment.save();
    res.redirect('/departments');
  } catch (error) {
    console.error('Error creating department:', error);

    if (error.code === 11000) {
      const errors = [{ field: 'name', msg: 'Department name already exists' }];
      res.status(409).render('departments/create', { session: req.session, errors, old: { name: req.body.name } });
      return;
    }

    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({ field: key, msg: error.errors[key].message }));
      res.status(400).render('departments/create', { session: req.session, errors, old: { name: req.body.name } });
      return;
    }

    next(error);
  }
});

module.exports = router;
