const express = require('express');
const router = express.Router();
const DayOffRequest = require('../models/DayOffRequest');
const WorkingDay = require('../models/WorkingDay');
const User = require('../models/User');
const { requireLogin } = require('../middlewares/auth');
// GET /requests - List user's working days
router.get('/', requireLogin, async (req, res) => {
  try {
    let query = { used: false };
    if (req.session.user.role !== 'manager') {
      query.employee = req.session.user._id;
    }
    const workingDays = await WorkingDay.find(query).populate('employee', 'name');
    res.render('requests', { workingDays, session: req.session });
  } catch (error) {
    res.status(500).send('Error fetching working days');
  }
});
// POST /requests - Create new working day
router.post('/', requireLogin, async (req, res) => {
  try {
    const { day, date, remark } = req.body;
    if (!day || !date || !remark) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (typeof day !== 'string' || day.trim() === '') {
      return res.status(400).json({ error: 'Day is required' });
    }
    if (typeof remark !== 'string' || remark.trim() === '') {
      return res.status(400).json({ error: 'Remark is required' });
    }
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: 'Valid date is required' });
    }
    const newWorkingDay = new WorkingDay({
      employee: req.session.user._id,
      day: day.trim(),
      date: new Date(date),
      remark: remark.trim(),
      used: false
    });
    await newWorkingDay.save();
    res.status(201).json(newWorkingDay);
  } catch (error) {
    res.status(500).json({ error: 'Error creating working day' });
  }
});
// PUT /requests/:id - Update working day
router.put('/:id', requireLogin, async (req, res) => {
  try {
    const workingDay = await WorkingDay.findById(req.params.id);
    if (!workingDay) {
      return res.status(404).json({ error: 'Working day not found' });
    }
    if (req.session.user.role !== 'manager' && workingDay.employee.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { day, date, remark } = req.body;
    await WorkingDay.findByIdAndUpdate(req.params.id, { day, date, remark });
    res.json({ message: 'Working day updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating working day' });
  }
});
// DELETE /requests/:id - Delete working day
router.delete('/:id', requireLogin, async (req, res) => {
  try {
    const workingDay = await WorkingDay.findById(req.params.id);
    if (!workingDay) {
      return res.status(404).json({ error: 'Working day not found' });
    }
    if (req.session.user.role !== 'manager' && workingDay.employee.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await WorkingDay.findByIdAndDelete(req.params.id);
    res.json({ message: 'Working day deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting working day' });
  }
});
// GET /requests/approve - List requests for approval (team leader)
router.get('/approve', requireLogin, async (req, res) => {
  try {
    if (req.session.user.role !== 'team_leader') {
      return res.status(403).send('Access denied');
    }
    const requests = await DayOffRequest.find({ teamLeader: req.session.user._id, status: 'pending' }).populate('employee', 'name email');
    res.render('approve-requests', { requests, session: req.session });
  } catch (error) {
    res.status(500).send('Error fetching requests for approval');
  }
});
// POST /requests/:id/approve - Approve request
router.post('/:id/approve', requireLogin, async (req, res) => {
  try {
    if (req.session.user.role !== 'team_leader') {
      return res.status(403).json({ error: 'Access denied' });
    }
    await DayOffRequest.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      approvedBy: req.session.user._id,
      approvedAt: new Date()
    });
    res.json({ message: 'Request approved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error approving request' });
  }
});
// POST /requests/:id/reject - Reject request
router.post('/:id/reject', requireLogin, async (req, res) => {
  try {
    if (req.session.user.role !== 'team_leader') {
      return res.status(403).json({ error: 'Access denied' });
    }
    await DayOffRequest.findByIdAndUpdate(req.params.id, {
      status: 'rejected',
      approvedBy: req.session.user._id,
      approvedAt: new Date()
    });
    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error rejecting request' });
  }
});
// POST /requests/dayoff-request - Create day off request
router.post('/dayoff-request', requireLogin, async (req, res) => {
  try {
    const { workingDays, remainingBalance } = req.body;
    // Find a team leader
    const teamLeader = await User.findOne({ role: 'team_leader' });
    if (!teamLeader) {
      return res.status(400).json({ error: 'No team leader found' });
    }
    const requests = [];
    for (const wd of workingDays) {
      const request = new DayOffRequest({
        employee: req.session.user._id,
        teamLeader: teamLeader._id,
        day: wd.compensationDay,
        date: new Date(wd.compensationDate),
        balance: remainingBalance,
        remark: wd.remarks
      });
      requests.push(request);
    }
    await DayOffRequest.insertMany(requests);
    res.json({ message: 'Day off requests submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating day off requests' });
  }
});
module.exports = router;
