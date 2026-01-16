const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DayOffRequest = require('../models/DayOffRequest');
const Department = require('../models/Department');
const Section = require('../models/Section');
const { requireLogin, requireManager } = require('../middlewares/auth');

// GET /users - List all users
router.get('/', requireLogin, async (req, res, next) => {
  try {
    // Block employees from accessing users page
    if (req.session.user.role === 'employee') {
      return res.status(403).send('Access denied. Employees cannot access this page.');
    }
    const users = await User.find().populate('department', 'name').populate('section', 'name').populate('supervisor', 'name').select('name email role department section supervisor employeeNo createdAt');
    res.render('users/list', { users, session: req.session });
  } catch (error) {
    console.error('Error fetching users:', error);
    next(error);
  }
});

// GET /users/create - Show create user form
router.get('/create', requireLogin, requireManager, async (req, res, next) => {
  try {
    // Block employees (extra safety check)
    if (req.session.user.role === 'employee') {
      return res.status(403).send('Access denied. Employees cannot access this page.');
    }
    // Fetch departments and sections
    const departments = await Department.find().select('name');
    const sections = await Section.find().populate('department', 'name').select('name department');
    // Fetch supervisors
    const supervisors = await User.find({ role: { $in: ['team_leader', 'manager'] } }).populate('section', 'name').select('name section');
    const supervisorsBySection = {};
    supervisors.forEach(sup => {
      if (sup.section) {
        const sectionId = sup.section._id.toString();
        if (!supervisorsBySection[sectionId]) {
          supervisorsBySection[sectionId] = [];
        }
        // Add section ID to supervisor object for frontend filtering
        sup._sectionId = sectionId;
        supervisorsBySection[sectionId].push(sup);
      }
    });
    // Fetch all users with populated fields
    const allUsers = await User.find().populate('department', 'name').populate('section', 'name').populate('supervisor', 'name').select('name email role department section supervisor employeeNo');
    res.render('users/create', { session: req.session, errors: null, old: {}, departments, sections, supervisorsBySection, allUsers });
  } catch (error) {
    console.error('Error fetching data:', error);
    next(error);
  }
});

// POST /users/create - Create new user
router.post('/create', requireLogin, requireManager, async (req, res, next) => {
  try {
    // Handle both field names: "section" (for employee) and "sectionTeamLeader" (for team_leader)
    let { name, email, password, role, department, section, sectionTeamLeader, supervisor, employeeNo, signature } = req.body;
    
    // Use sectionTeamLeader if section is empty but sectionTeamLeader has value
    if (!section && sectionTeamLeader) {
      section = sectionTeamLeader;
    }
    
    const errors = [];

    // Basic validation
    if (!name || !name.trim()) errors.push({ field: 'name', msg: 'Name is required' });
    if (!email || !email.trim()) errors.push({ field: 'email', msg: 'Email is required' });
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.push({ field: 'email', msg: 'Email is invalid' });
    if (!password || password.length < 6) errors.push({ field: 'password', msg: 'Password must be at least 6 characters' });
    if (!role || !role.trim()) errors.push({ field: 'role', msg: 'Role is required' });
    if (!employeeNo || !employeeNo.trim()) errors.push({ field: 'employeeNo', msg: 'Employee Number is required' });
    if (!signature || !signature.trim()) errors.push({ field: 'signature', msg: 'Signature is required' });

    // Role-based validation
    if (!department || !department.trim()) {
      errors.push({ field: 'department', msg: 'Department is required for all roles' });
    }

    if (role === 'employee') {
      // Employee: requires Department, Section, and Supervisor
      if (!section || !section.trim()) errors.push({ field: 'section', msg: 'Section is required for employees' });
      if (!supervisor || !supervisor.trim()) errors.push({ field: 'supervisor', msg: 'Supervisor is required for employees' });
    } else if (role === 'team_leader') {
      // Team Leader: requires Department only, Section is OPTIONAL
      // This allows creating team leader first, then adding to a section later
      // supervisor field should be ignored/empty for team_leader
    } else if (role === 'manager') {
      // Manager: requires Department only, NO Section, NO Supervisor
      // section and supervisor fields should be ignored/empty for manager
    }

    if (errors.length) {
      // Re-fetch data for re-render
      const departments = await Department.find().select('name');
      const sections = await Section.find().populate('department', 'name').select('name department');
      const supervisors = await User.find({ role: { $in: ['team_leader', 'manager'] } }).populate('section', 'name').select('name section');
      const supervisorsBySection = {};
      supervisors.forEach(sup => {
        if (sup.section) {
          const sectionId = sup.section._id.toString();
          if (!supervisorsBySection[sectionId]) {
            supervisorsBySection[sectionId] = [];
          }
          supervisorsBySection[sectionId].push(sup);
        }
      });
      const allUsers = await User.find().populate('department', 'name').populate('section', 'name').populate('supervisor', 'name').select('name email role department section supervisor employeeNo');
      res.status(400).render('users/create', { session: req.session, errors, old: { name, email, role, department, section, supervisor, employeeNo, signature }, departments, sections, supervisorsBySection, allUsers });
      return;
    }

    // Prepare user data based on role
    let userData = {
      name,
      email,
      passwordHash: password,
      role,
      department,
      employeeNo,
      signature
    };

    if (role === 'employee') {
      userData.section = section;
      userData.supervisor = supervisor;
    } else if (role === 'team_leader') {
      userData.section = section;
      // No supervisor for team_leader
    } else if (role === 'manager') {
      // No section or supervisor for manager
    }

    const newUser = new User(userData);
    await newUser.save();
    res.redirect('/users');
  } catch (error) {
    console.error('Error creating user:', error);

    // Duplicate key (e.g. email already exists)
    if (error.code === 11000) {
      const errors = [{ field: 'email', msg: 'Email already in use' }];
      const departments = await Department.find().select('name');
      const sections = await Section.find().populate('department', 'name').select('name department');
      const supervisors = await User.find({ role: { $in: ['team_leader', 'manager'] } }).populate('section', 'name').select('name section');
      const supervisorsBySection = {};
      supervisors.forEach(sup => {
        if (sup.section) {
          const sectionId = sup.section._id.toString();
          if (!supervisorsBySection[sectionId]) {
            supervisorsBySection[sectionId] = [];
          }
          supervisorsBySection[sectionId].push(sup);
        }
      });
      const allUsers = await User.find().populate('department', 'name').populate('section', 'name').populate('supervisor', 'name').select('name email role department section supervisor employeeNo');
      res.status(409).render('users/create', { session: req.session, errors, old: { name: req.body.name, email: req.body.email, role: req.body.role, department: req.body.department, section: req.body.section, supervisor: req.body.supervisor, employeeNo: req.body.employeeNo, signature: req.body.signature }, departments, sections, supervisorsBySection, allUsers });
      return;
    }

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({ field: key, msg: error.errors[key].message }));
      const departments = await Department.find().select('name');
      const sections = await Section.find().populate('department', 'name').select('name department');
      const supervisors = await User.find({ role: { $in: ['team_leader', 'manager'] } }).populate('section', 'name').select('name section');
      const supervisorsBySection = {};
      supervisors.forEach(sup => {
        if (sup.section) {
          const sectionId = sup.section._id.toString();
          if (!supervisorsBySection[sectionId]) {
            supervisorsBySection[sectionId] = [];
          }
          supervisorsBySection[sectionId].push(sup);
        }
      });
      const allUsers = await User.find().populate('department', 'name').populate('section', 'name').populate('supervisor', 'name').select('name email role department section supervisor employeeNo');
      res.status(400).render('users/create', { session: req.session, errors, old: { name: req.body.name, email: req.body.email, role: req.body.role, department: req.body.department, section: req.body.section, supervisor: req.body.supervisor, employeeNo: req.body.employeeNo, signature: req.body.signature }, departments, sections, supervisorsBySection, allUsers });
      return;
    }

    next(error);
  }
});

// GET /users/:id/edit - Show edit user form
router.get('/:id/edit', requireLogin, requireManager, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('department', 'name').populate('section', 'name').populate('supervisor', 'name');
    if (!user) {
      return res.status(404).render('error', { message: 'User not found' });
    }

    const departments = await Department.find().select('name');
    const sections = await Section.find().populate('department', 'name').select('name department');
    const supervisors = await User.find({ role: { $in: ['team_leader', 'manager'] } }).populate('section', 'name').select('name section');
    const supervisorsBySection = {};
    supervisors.forEach(sup => {
      if (sup.section) {
        const sectionId = sup.section._id.toString();
        if (!supervisorsBySection[sectionId]) {
          supervisorsBySection[sectionId] = [];
        }
        supervisorsBySection[sectionId].push(sup);
      }
    });

    res.render('users/edit', {
      session: req.session,
      errors: null,
      old: user,
      departments,
      sections,
      supervisorsBySection
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    next(error);
  }
});

// POST /users/:id/edit - Update user
router.post('/:id/edit', requireLogin, requireManager, async (req, res, next) => {
  try {
    const { name, email, password, role, department, section, supervisor, employeeNo, signature } = req.body;
    const errors = [];

    // Basic validation
    if (!name || !name.trim()) errors.push({ field: 'name', msg: 'Name is required' });
    if (!email || !email.trim()) errors.push({ field: 'email', msg: 'Email is required' });
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.push({ field: 'email', msg: 'Email is invalid' });
    if (!role || !role.trim()) errors.push({ field: 'role', msg: 'Role is required' });
    if (!employeeNo || !employeeNo.trim()) errors.push({ field: 'employeeNo', msg: 'Employee Number is required' });
    if (!signature || !signature.trim()) errors.push({ field: 'signature', msg: 'Signature is required' });

    // Role-based validation
    if (!department || !department.trim()) {
      errors.push({ field: 'department', msg: 'Department is required for all roles' });
    }

    if (role === 'employee') {
      if (!section || !section.trim()) errors.push({ field: 'section', msg: 'Section is required for employees' });
      if (!supervisor || !supervisor.trim()) errors.push({ field: 'supervisor', msg: 'Supervisor is required for employees' });
    } else if (role === 'team_leader') {
      if (!section || !section.trim()) errors.push({ field: 'section', msg: 'Section is required for team leaders' });
    }

    if (errors.length) {
      const user = await User.findById(req.params.id);
      const departments = await Department.find().select('name');
      const sections = await Section.find().populate('department', 'name').select('name department');
      const supervisors = await User.find({ role: { $in: ['team_leader', 'manager'] } }).populate('section', 'name').select('name section');
      const supervisorsBySection = {};
      supervisors.forEach(sup => {
        if (sup.section) {
          const sectionId = sup.section._id.toString();
          if (!supervisorsBySection[sectionId]) {
            supervisorsBySection[sectionId] = [];
          }
          supervisorsBySection[sectionId].push(sup);
        }
      });
      res.status(400).render('users/edit', {
        session: req.session,
        errors,
        old: { _id: req.params.id, name, email, role, department, section, supervisor, employeeNo, signature },
        departments,
        sections,
        supervisorsBySection
      });
      return;
    }

    // Find and update user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).render('error', { message: 'User not found' });
    }

    user.name = name;
    user.email = email;
    if (password && password.trim()) {
      user.passwordHash = password;
    }
    user.role = role;
    user.department = department;
    user.employeeNo = employeeNo;
    user.signature = signature;

    if (role === 'employee') {
      user.section = section;
      user.supervisor = supervisor;
    } else if (role === 'team_leader') {
      user.section = section;
      user.supervisor = null;
    } else if (role === 'manager') {
      user.section = null;
      user.supervisor = null;
    }

    await user.save();
    res.redirect('/users');
  } catch (error) {
    console.error('Error updating user:', error);

    // Duplicate key (e.g. email already exists)
    if (error.code === 11000) {
      const errors = [{ field: 'email', msg: 'Email already in use' }];
      const user = await User.findById(req.params.id);
      const departments = await Department.find().select('name');
      const sections = await Section.find().populate('department', 'name').select('name department');
      const supervisors = await User.find({ role: { $in: ['team_leader', 'manager'] } }).populate('section', 'name').select('name section');
      const supervisorsBySection = {};
      supervisors.forEach(sup => {
        if (sup.section) {
          const sectionId = sup.section._id.toString();
          if (!supervisorsBySection[sectionId]) {
            supervisorsBySection[sectionId] = [];
          }
          supervisorsBySection[sectionId].push(sup);
        }
      });
      res.status(409).render('users/edit', {
        session: req.session,
        errors,
        old: { _id: req.params.id, name: req.body.name, email: req.body.email, role: req.body.role, department: req.body.department, section: req.body.section, supervisor: req.body.supervisor, employeeNo: req.body.employeeNo, signature: req.body.signature },
        departments,
        sections,
        supervisorsBySection
      });
      return;
    }

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({ field: key, msg: error.errors[key].message }));
      const user = await User.findById(req.params.id);
      const departments = await Department.find().select('name');
      const sections = await Section.find().populate('department', 'name').select('name department');
      const supervisors = await User.find({ role: { $in: ['team_leader', 'manager'] } }).populate('section', 'name').select('name section');
      const supervisorsBySection = {};
      supervisors.forEach(sup => {
        if (sup.section) {
          const sectionId = sup.section._id.toString();
          if (!supervisorsBySection[sectionId]) {
            supervisorsBySection[sectionId] = [];
          }
          supervisorsBySection[sectionId].push(sup);
        }
      });
      res.status(400).render('users/edit', {
        session: req.session,
        errors,
        old: { _id: req.params.id, name: req.body.name, email: req.body.email, role: req.body.role, department: req.body.department, section: req.body.section, supervisor: req.body.supervisor, employeeNo: req.body.employeeNo, signature: req.body.signature },
        departments,
        sections,
        supervisorsBySection
      });
      return;
    }

    next(error);
  }
});

// DELETE /users/:id - Delete user
router.delete('/:id', requireLogin, requireManager, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the current logged-in user
    if (user._id.toString() === req.session.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot delete your own account' });
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    // Also clean up any references to this user in day off requests
    await DayOffRequest.updateMany(
      { $or: [{ employee: req.params.id }, { teamLeader: req.params.id }, { manager: req.params.id }] },
      { $unset: { employee: 1, teamLeader: 1, manager: 1 } }
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user: ' + error.message });
  }
});

module.exports = router;
