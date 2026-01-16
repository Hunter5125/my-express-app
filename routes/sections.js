const express = require('express');
const router = express.Router();
const Section = require('../models/Section');
const Department = require('../models/Department');
const User = require('../models/User');
const { requireLogin, requireManager } = require('../middlewares/auth');

// GET /sections - List all sections with complete details
router.get('/', requireLogin, async (req, res, next) => {
  try {
    // Block employees
    if (req.session.user.role === 'employee') {
      return res.status(403).send('Access denied. Employees cannot access this page.');
    }
    const sections = await Section.find()
      .populate('department', 'name')
      .populate('supervisor', 'name email')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });
    res.render('sections/list', { sections, session: req.session });
  } catch (error) {
    console.error('Error fetching sections:', error);
    next(error);
  }
});

// GET /sections/create - Show create section form with list of all sections
router.get('/create', requireLogin, requireManager, async (req, res, next) => {
  try {
    const departments = await Department.find().select('name');
    const supervisors = await User.find({ role: 'team_leader' }).select('name');
    const managers = await User.find({ role: 'manager' }).select('name');
    const sections = await Section.find()
      .populate('department', 'name')
      .populate('supervisor', 'name email')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });
    res.render('sections/create', { session: req.session, errors: null, old: {}, departments, supervisors, managers, sections });
  } catch (error) {
    console.error('Error fetching data:', error);
    next(error);
  }
});

// POST /sections/create - Create new section
router.post('/create', requireLogin, requireManager, async (req, res, next) => {
  try {
    const { name, department, supervisor, manager } = req.body;
    const errors = [];

    if (!name || !name.trim()) errors.push({ field: 'name', msg: 'Name is required' });
    if (!department || !department.trim()) errors.push({ field: 'department', msg: 'Department is required' });
    // Supervisor and Manager are OPTIONAL - can be added later via edit
    // This allows creating section first, then updating with supervisor/manager

    if (errors.length) {
      const departments = await Department.find().select('name');
      const supervisors = await User.find({ role: 'team_leader' }).select('name');
      const managers = await User.find({ role: 'manager' }).select('name');
      const sections = await Section.find()
        .populate('department', 'name')
        .populate('supervisor', 'name email')
        .populate('manager', 'name email')
        .sort({ createdAt: -1 });
      res.status(400).render('sections/create', { session: req.session, errors, old: { name, department, supervisor, manager }, departments, supervisors, managers, sections });
      return;
    }

    // Build section object with optional supervisor/manager
    const sectionData = { name, department };
    if (supervisor && supervisor.trim()) sectionData.supervisor = supervisor;
    if (manager && manager.trim()) sectionData.manager = manager;
    
    const newSection = new Section(sectionData);
    await newSection.save();
    res.redirect('/sections');
  } catch (error) {
    console.error('Error creating section:', error);

    if (error.code === 11000) {
      const errors = [{ field: 'name', msg: 'Section name already exists in this department' }];
      const departments = await Department.find().select('name');
      const supervisors = await User.find({ role: 'team_leader' }).select('name');
      const managers = await User.find({ role: 'manager' }).select('name');
      const sections = await Section.find()
        .populate('department', 'name')
        .populate('supervisor', 'name email')
        .populate('manager', 'name email')
        .sort({ createdAt: -1 });
      res.status(409).render('sections/create', { session: req.session, errors, old: { name: req.body.name, department: req.body.department, supervisor: req.body.supervisor, manager: req.body.manager }, departments, supervisors, managers, sections });
      return;
    }

    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({ field: key, msg: error.errors[key].message }));
      const departments = await Department.find().select('name');
      const supervisors = await User.find({ role: 'team_leader' }).select('name');
      const managers = await User.find({ role: 'manager' }).select('name');
      const sections = await Section.find()
        .populate('department', 'name')
        .populate('supervisor', 'name email')
        .populate('manager', 'name email')
        .sort({ createdAt: -1 });
      res.status(400).render('sections/create', { session: req.session, errors, old: { name: req.body.name, department: req.body.department, supervisor: req.body.supervisor, manager: req.body.manager }, departments, supervisors, managers, sections });
      return;
    }

    next(error);
  }
});

// GET /sections/:id/edit - Show edit section form
router.get('/:id/edit', requireLogin, requireManager, async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('department', '_id name')
      .populate('supervisor', '_id name')
      .populate('manager', '_id name');

    if (!section) {
      return res.status(404).render('error', { message: 'Section not found' });
    }

    const departments = await Department.find().select('_id name');
    const supervisors = await User.find({ role: 'team_leader' }).select('_id name');
    const managers = await User.find({ role: 'manager' }).select('_id name');

    res.render('sections/edit', {
      session: req.session,
      section,
      old: section,
      errors: null,
      departments,
      supervisors,
      managers
    });
  } catch (error) {
    console.error('Error fetching section:', error);
    next(error);
  }
});

// POST /sections/:id/edit - Update section
router.post('/:id/edit', requireLogin, requireManager, async (req, res, next) => {
  try {
    const { name, department, supervisor, manager } = req.body;
    const errors = [];

    // Only name is mandatory
    if (!name || !name.trim()) {
      errors.push({ field: 'name', msg: 'Section name is required' });
    }

    if (errors.length) {
      const section = await Section.findById(req.params.id)
        .populate('department', '_id name')
        .populate('supervisor', '_id name')
        .populate('manager', '_id name');
      const departments = await Department.find().select('_id name');
      const supervisors = await User.find({ role: 'team_leader' }).select('_id name');
      const managers = await User.find({ role: 'manager' }).select('_id name');

      res.status(400).render('sections/edit', {
        session: req.session,
        section,
        old: { name, department, supervisor, manager },
        errors,
        departments,
        supervisors,
        managers
      });
      return;
    }

    // Find and update section
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).render('error', { message: 'Section not found' });
    }

    section.name = name.trim();
    if (department && department.trim()) {
      section.department = department;
    }
    if (supervisor && supervisor.trim()) {
      section.supervisor = supervisor;
    }
    if (manager && manager.trim()) {
      section.manager = manager;
    }

    await section.save();
    res.redirect('/sections');
  } catch (error) {
    console.error('Error updating section:', error);

    // Duplicate key error (section name already exists in department)
    if (error.code === 11000) {
      const errors = [{ field: 'name', msg: 'Section name already exists in this department' }];
      const section = await Section.findById(req.params.id)
        .populate('department', '_id name')
        .populate('supervisor', '_id name')
        .populate('manager', '_id name');
      const departments = await Department.find().select('_id name');
      const supervisors = await User.find({ role: 'team_leader' }).select('_id name');
      const managers = await User.find({ role: 'manager' }).select('_id name');

      res.status(409).render('sections/edit', {
        session: req.session,
        section,
        old: { name: req.body.name, department: req.body.department, supervisor: req.body.supervisor, manager: req.body.manager },
        errors,
        departments,
        supervisors,
        managers
      });
      return;
    }

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({ field: key, msg: error.errors[key].message }));
      const section = await Section.findById(req.params.id)
        .populate('department', '_id name')
        .populate('supervisor', '_id name')
        .populate('manager', '_id name');
      const departments = await Department.find().select('_id name');
      const supervisors = await User.find({ role: 'team_leader' }).select('_id name');
      const managers = await User.find({ role: 'manager' }).select('_id name');

      res.status(400).render('sections/edit', {
        session: req.session,
        section,
        old: { name: req.body.name, department: req.body.department, supervisor: req.body.supervisor, manager: req.body.manager },
        errors,
        departments,
        supervisors,
        managers
      });
      return;
    }

    next(error);
  }
});

// DELETE /sections/:id - Delete section
router.delete('/:id', requireLogin, requireManager, async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Delete section
    await Section.findByIdAndDelete(req.params.id);

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ message: 'Failed to delete section: ' + error.message });
  }
});

module.exports = router;
