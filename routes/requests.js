const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const DayOffRequest = require('../models/DayOffRequest');
const WorkingDay = require('../models/WorkingDay');
const User = require('../models/User');
const Section = require('../models/Section');
const { requireLogin } = require('../middlewares/auth');

// GET /requests - List user's working days
router.get('/', requireLogin, async (req, res) => {
  try {
    let query = { used: false };
    if (req.session.user.role !== 'manager') {
      query.employee = req.session.user._id;
    }
    const workingDays = await WorkingDay.find(query).populate('employee', 'name').sort({ date: 1 });
    const balance = workingDays.reduce((sum, day) => sum + day.balance, 0);
    console.log(`\n📋 GET /requests - User: ${req.session.user.name}`);
    console.log(`   Query:`, query);
    console.log(`   Found ${workingDays.length} working days, Total balance: ${balance}`);
    workingDays.slice(0, 5).forEach((wd, idx) => {
      console.log(`   [${idx}] day="${wd.day}" | date=${wd.date ? wd.date.toISOString().split('T')[0] : 'MISSING'} | remark="${wd.remark}" | balance=${wd.balance}`);
    });
    console.log(`   Template will render ${workingDays.length} rows with columns: id, day, date, remark, balance\n`);
    // Fetch user's day-off requests
    let pendingRequests;
    try {
      pendingRequests = await DayOffRequest.find({ employee: req.session.user._id, status: { $in: ['pending', 'team_leader_approved', 'approved'] } }).populate('teamLeader', 'name').populate('manager', 'name').populate('employee', 'name employeeNo').populate({
        path: 'workingDayIds',
        populate: {
          path: 'employee',
          select: 'name'
        }
      }).populate('teamLeaderApprovedBy', 'name').populate('approvedBy', 'name');
      console.log('Populate successful for pending requests');
    } catch (populateError) {
      console.error('Populate error for pending requests:', populateError);
      // Fallback without nested populate
      pendingRequests = await DayOffRequest.find({ employee: req.session.user._id, status: { $in: ['pending', 'team_leader_approved', 'approved'] } }).populate('teamLeader', 'name').populate('manager', 'name').populate('employee', 'name employeeNo').populate('workingDayIds').populate('teamLeaderApprovedBy', 'name').populate('approvedBy', 'name');
    }

    // Add team leader and manager approval status
    pendingRequests.forEach(req => {
      if (req.status === 'pending') {
        req.teamLeaderApprovalStatus = 'Pending';
        req.managerApprovalStatus = 'Pending';
  } else if (req.status === 'team_leader_approved') {
    req.teamLeaderApprovalStatus = req.teamLeaderApprovedBy && req.teamLeaderApprovedAt ? `${req.teamLeaderApprovedBy.name} on ${req.teamLeaderApprovedAt.toDateString()}` : 'Approved';
    req.managerApprovalStatus = 'Pending';
  } else if (req.status === 'approved') {
    req.teamLeaderApprovalStatus = req.teamLeaderApprovedBy && req.teamLeaderApprovedAt ? `${req.teamLeaderApprovedBy.name} on ${req.teamLeaderApprovedAt.toDateString()}` : 'Approved';
    req.managerApprovalStatus = req.approvedBy && req.approvedAt ? `${req.approvedBy.name} on ${req.approvedAt.toDateString()}` : 'Approved';
  } else {
        req.teamLeaderApprovalStatus = 'Rejected';
        req.managerApprovalStatus = 'Rejected';
      }
    });

    // Fetch requests for approval
    let approvableRequests = [];
    try {
    if (req.session.user.role === 'team_leader') {
      approvableRequests = await DayOffRequest.find({ teamLeader: req.session.user._id, status: 'pending' }).populate('teamLeader', 'name').populate('manager', 'name').populate('employee', 'name employeeNo').populate('workingDayIds').populate('teamLeaderApprovedBy', 'name').populate('approvedBy', 'name');
    } else if (req.session.user.role === 'manager') {
      approvableRequests = await DayOffRequest.find({ manager: req.session.user._id, status: 'team_leader_approved' }).populate('teamLeader', 'name').populate('manager', 'name').populate('employee', 'name employeeNo').populate('workingDayIds').populate('teamLeaderApprovedBy', 'name').populate('approvedBy', 'name');
      }
      console.log('Populate successful for approvable requests');
    } catch (populateError) {
      console.error('Populate error for approvable requests:', populateError);
      // Fallback without populate
      if (req.session.user.role === 'team_leader') {
        approvableRequests = await DayOffRequest.find({ teamLeader: req.session.user._id, status: 'pending' }).populate('teamLeader', 'name').populate('manager', 'name').populate('employee', 'name employeeNo').populate('teamLeaderApprovedBy', 'name').populate('approvedBy', 'name');
      } else if (req.session.user.role === 'manager') {
        approvableRequests = await DayOffRequest.find({ manager: req.session.user._id, status: 'team_leader_approved' }).populate('teamLeader', 'name').populate('manager', 'name').populate('employee', 'name employeeNo').populate('teamLeaderApprovedBy', 'name').populate('approvedBy', 'name');
      }
    }
    // Add approval status
    approvableRequests.forEach(req => {
      if (req.status === 'pending') {
        req.teamLeaderApprovalStatus = 'Pending';
        req.managerApprovalStatus = 'Pending';
      } else if (req.status === 'team_leader_approved') {
        req.teamLeaderApprovalStatus = 'Approved';
        req.managerApprovalStatus = 'Pending';
      } else if (req.status === 'approved') {
        req.teamLeaderApprovalStatus = 'Approved';
        req.managerApprovalStatus = 'Approved';
      } else {
        req.teamLeaderApprovalStatus = 'Rejected';
        req.managerApprovalStatus = 'Rejected';
      }
    });
    res.render('requests', { workingDays, balance, pendingRequests, approvableRequests, session: req.session });
  } catch (error) {
    res.status(500).send('Error fetching working days');
  }
});


// POST /requests - Create new working day
router.post('/', requireLogin, async (req, res) => {
  try {
    const { day, date, remark, balance } = req.body;
    if (!day || !date || !remark || balance === undefined) {
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
    if (isNaN(parseFloat(balance)) || parseFloat(balance) < 0) {
      return res.status(400).json({ error: 'Valid balance is required' });
    }
    const newWorkingDay = new WorkingDay({
      employee: req.session.user._id,
      day: day.trim(),
      date: new Date(date),
      remark: remark.trim(),
      balance: parseFloat(balance),
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
    const { day, date, remark, balance } = req.body;
    if (!day || !date || !remark || balance == null || balance === '') {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (isNaN(parseFloat(balance)) || parseFloat(balance) < 0) {
      return res.status(400).json({ error: 'Valid balance is required' });
    }
    await WorkingDay.findByIdAndUpdate(req.params.id, { day, date, remark, balance: parseFloat(balance) });
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
// GET /requests/manager-approve - List requests for approval (manager)
router.get('/manager-approve', requireLogin, async (req, res) => {
  try {
    if (req.session.user.role !== 'manager') {
      return res.status(403).send('Access denied');
    }
    const requests = await DayOffRequest.find({ manager: req.session.user._id, status: 'team_leader_approved' }).populate('employee', 'name email');
    res.render('manager-approve-requests', { requests, session: req.session });
  } catch (error) {
    res.status(500).send('Error fetching requests for approval');
  }
});

// GET /requests/archive - List all approved requests (team leader, manager, and admin)
router.get('/archive', requireLogin, async (req, res) => {
  try {
    // Only team leaders, managers, and admin can access archive
    if (req.session.user.role !== 'team_leader' && req.session.user.role !== 'manager' && req.session.user.role !== 'admin') {
      return res.status(403).send('Access denied');
    }

    // Build filter based on user role
    let filter = { status: 'approved' };
    
    if (req.session.user.role === 'team_leader') {
      // Team leaders see only approved requests for their employees (by section)
      const supervisor = await User.findById(req.session.user._id).populate('section');
      if (supervisor && supervisor.section) {
        const employeesInSection = await User.find({ section: supervisor.section._id });
        const employeeIds = employeesInSection.map(emp => emp._id);
        filter.employee = { $in: employeeIds };
      }
    } else if (req.session.user.role === 'manager') {
      // Managers see all approved requests for their department
      const manager = await User.findById(req.session.user._id).populate('department');
      if (manager && manager.department) {
        // Find all sections in this department, then all employees in those sections
        const sectionsInDept = await Section.find({ department: manager.department._id });
        const sectionIds = sectionsInDept.map(sec => sec._id);
        const employeesInDept = await User.find({ section: { $in: sectionIds } });
        const employeeIds = employeesInDept.map(emp => emp._id);
        filter.employee = { $in: employeeIds };
      }
    }
    // Admin sees all approved requests (no filter applied)

    // Fetch approved requests with full details based on filter
    const approvedRequests = await DayOffRequest.find(filter)
      .populate({
        path: 'employee',
        select: 'name email employeeNo section supervisor',
        populate: [
          { path: 'section', select: 'name department', populate: { path: 'department', select: 'name' } },
          { path: 'supervisor', select: 'name' }
        ]
      })
      .populate('teamLeader', 'name')
      .populate('manager', 'name')
      .populate('teamLeaderApprovedBy', 'name')
      .populate('approvedBy', 'name')
      .populate({
        path: 'workingDayIds',
        populate: {
          path: 'employee',
          select: 'name'
        }
      })
      .sort({ approvedAt: -1 }); // Most recent first

    // Get unique sections for filter dropdown based on requests shown
    const sections = [];
    const sectionMap = {};
    approvedRequests.forEach(req => {
      if (req.employee && req.employee.section && req.employee.section.name) {
        const sectionName = req.employee.section.name;
        if (!sectionMap[sectionName]) {
          sectionMap[sectionName] = true;
          sections.push(sectionName);
        }
      }
    });
    sections.sort();

    // Add approval status for display
    approvedRequests.forEach(req => {
      req.teamLeaderApprovalStatus = req.teamLeaderApprovedBy && req.teamLeaderApprovedAt ? `${req.teamLeaderApprovedBy.name} on ${req.teamLeaderApprovedAt.toDateString()}` : 'Approved';
      req.managerApprovalStatus = req.approvedBy && req.approvedAt ? `${req.approvedBy.name} on ${req.approvedAt.toDateString()}` : 'Approved';
    });

    res.render('archive', { approvedRequests, sections, session: req.session });
  } catch (error) {
    console.error('Error fetching archive:', error);
    res.status(500).send('Error fetching archive');
  }
});
// POST /requests/:id/approve - Approve request
router.post('/:id/approve', requireLogin, async (req, res) => {
  try {
    const request = await DayOffRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (req.session.user.role === 'team_leader' && request.teamLeader.toString() === req.session.user._id.toString()) {
      // Team leader approving
      await DayOffRequest.findByIdAndUpdate(req.params.id, {
        status: 'team_leader_approved',
        teamLeaderApprovedBy: req.session.user._id,
        teamLeaderApprovedAt: new Date()
      });
      res.json({ message: 'Request approved by team leader successfully' });
    } else if (req.session.user.role === 'manager') {
      // Manager approving - only the assigned manager can approve
      if (request.manager.toString() !== req.session.user._id.toString()) {
        return res.status(403).json({ error: 'You are not authorized to approve this request. It is assigned to another manager.' });
      }
      if (request.status !== 'team_leader_approved') {
        return res.status(400).json({ error: 'Request must be approved by team leader first' });
      }
      await DayOffRequest.findByIdAndUpdate(req.params.id, {
        status: 'approved',
        approvedBy: req.session.user._id,
        approvedAt: new Date()
      });
      // Store working day info in the request before deleting
      if (request.workingDayIds && request.workingDayIds.length > 0) {
        const firstWorkingDay = await WorkingDay.findById(request.workingDayIds[0]);
        if (firstWorkingDay) {
          await DayOffRequest.findByIdAndUpdate(request._id, {
            working_day: firstWorkingDay.day,
            working_day_date: firstWorkingDay.date
          });
        }
        // Delete all associated working days from available pool
        for (const workingDayId of request.workingDayIds) {
          await WorkingDay.findByIdAndDelete(workingDayId);
        }
        console.log(`Deleted ${request.workingDayIds.length} working days from available pool`);
      }
      res.json({ message: 'Request approved by manager successfully' });
    } else if (req.session.user.role === 'admin') {
      // Admin can approve as team leader (for pending requests)
      if (request.status === 'pending') {
        await DayOffRequest.findByIdAndUpdate(req.params.id, {
          status: 'team_leader_approved',
          teamLeaderApprovedBy: req.session.user._id,
          teamLeaderApprovedAt: new Date()
        });
        res.json({ message: 'Request approved by team leader (admin) successfully' });
      } else {
        return res.status(400).json({ error: 'Request must be in pending status' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error approving request' });
  }
});

// POST /requests/:id/approve-manager - Manager approval by admin
router.post('/:id/approve-manager', requireLogin, async (req, res) => {
  try {
    const request = await DayOffRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can use this endpoint' });
    }
    if (request.status !== 'team_leader_approved') {
      return res.status(400).json({ error: 'Request must be approved by team leader first' });
    }
    await DayOffRequest.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      approvedBy: req.session.user._id,
      approvedAt: new Date()
    });
    // Store working day info in the request before deleting
    if (request.workingDayIds && request.workingDayIds.length > 0) {
      const firstWorkingDay = await WorkingDay.findById(request.workingDayIds[0]);
      if (firstWorkingDay) {
        await DayOffRequest.findByIdAndUpdate(request._id, {
          working_day: firstWorkingDay.day,
          working_day_date: firstWorkingDay.date
        });
      }
      // Delete all associated working days from available pool
      for (const workingDayId of request.workingDayIds) {
        await WorkingDay.findByIdAndDelete(workingDayId);
      }
      console.log(`Deleted ${request.workingDayIds.length} working days from available pool`);
    }
    res.json({ message: 'Request approved by manager (admin) successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error approving request' });
  }
});
// POST /requests/:id/reject - Reject request
router.post('/:id/reject', requireLogin, async (req, res) => {
  try {
    const request = await DayOffRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if ((req.session.user.role === 'team_leader' && request.teamLeader.toString() === req.session.user._id.toString()) ||
        (req.session.user.role === 'manager' && request.manager.toString() === req.session.user._id.toString()) ||
        (req.session.user.role === 'admin')) {
      await DayOffRequest.findByIdAndUpdate(req.params.id, {
        status: 'rejected',
        approvedBy: req.session.user._id,
        approvedAt: new Date()
      });
      res.json({ message: 'Request rejected successfully' });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error rejecting request' });
  }
});
// HEAD /requests/dayoff-request - Handle HEAD requests
router.head('/dayoff-request', requireLogin, async (req, res) => {
  res.status(200).end();
});

// GET /requests/dayoff-request - Render day off request form
router.get('/dayoff-request', async (req, res) => {
  let existingRequest = null;
  try {
    // For testing without authentication, create a mock session if none exists
    if (!req.session) {
      req.session = {};
    }
    if (!req.session.user) {
      req.session.user = { _id: 'test-user-id', name: 'Test User', role: 'employee' };
    }
    console.log('DayOff request accessed by user:', req.session.user.name);
    let selected = [];
    if (req.query.selected) {
      selected = JSON.parse(decodeURIComponent(req.query.selected));
    }
    let balance = req.query.balance;

    // If requestData is provided, use it directly (from table row)
    if (req.query.requestData) {
      console.log('Using request data from table row');
      try {
        const requestData = JSON.parse(decodeURIComponent(req.query.requestData));
        console.log('Parsed request data:', JSON.stringify(requestData, null, 2));
        console.log('Specific validation:');
        console.log('  dayToBeTaken:', requestData.dayToBeTaken, typeof requestData.dayToBeTaken);
        console.log('  workingDay:', requestData.workingDay, typeof requestData.workingDay);
        console.log('  remark:', requestData.remark, typeof requestData.remark);
        console.log('  remainingBalance:', requestData.remainingBalance, typeof requestData.remainingBalance);

        // Helper function to format date to YYYY-MM-DD
        const formatDateString = (dateStr) => {
          if (!dateStr) return '';
          try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr; // Return original if invalid
            return date.toISOString().split('T')[0];
          } catch (e) {
            return dateStr;
          }
        };

        // Fetch the actual request from database to get full employee data including signature
        let actualRequest = null;
        try {
          if (mongoose.isValidObjectId(requestData._id)) {
            actualRequest = await DayOffRequest.findById(requestData._id)
              .populate('employee', 'name email employeeNo signature')
              .populate('teamLeaderApprovedBy', 'name signature')
              .populate('approvedBy', 'name signature')
              .populate('workingDayIds', 'day balance date remark');
          }
        } catch (err) {
          console.error('Error fetching request:', err);
        }

        // Helper function to parse and format date properly
        const parseAndFormatDate = (dateStr) => {
          if (!dateStr) {
            console.log('  ❌ parseAndFormatDate: No date string provided');
            return '';
          }
          
          console.log(`  📅 Parsing date: "${dateStr}" (type: ${typeof dateStr})`);
          
          try {
            // Try to parse the date string
            let dateObj = new Date(dateStr);
            
            // Check if valid date
            if (isNaN(dateObj.getTime())) {
              console.warn('  ❌ Invalid date after parsing:', dateStr);
              return '';
            }
            
            const result = dateObj.toISOString().split('T')[0]; // Returns YYYY-MM-DD
            console.log(`  ✅ Successfully parsed to: ${result}`);
            return result;
          } catch (e) {
            console.warn('  ❌ Error parsing date:', dateStr, e.message);
            return '';
          }
        };

        // Create a mock existing request object from the table data
        const compensationDate = requestData.dateToBeTaken || requestData.workingDayDate; // Default to working date if empty
        let formattedCompensationDate = parseAndFormatDate(compensationDate);
        
        console.log('Date parsing for compensation:', {
          input: compensationDate,
          formatted: formattedCompensationDate
        });
        
        // Ensure dayToBeTaken is properly set - log for debugging
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let dayToBeTaken = requestData.dayToBeTaken || requestData.workingDay || '';
        
        // If dayToBeTaken is not a valid day name, use workingDay instead
        if (dayToBeTaken && !validDays.includes(dayToBeTaken)) {
          console.warn(`Invalid dayToBeTaken value: "${dayToBeTaken}" (not a valid day name), using workingDay instead`);
          dayToBeTaken = requestData.workingDay || '';
        }
        
        console.log('Loading requestData - dayToBeTaken mapping:', {
          provided: requestData.dayToBeTaken,
          fallback: requestData.workingDay,
          final: dayToBeTaken,
          isValid: validDays.includes(dayToBeTaken)
        });
        
        existingRequest = {
          _id: requestData._id,
          employee: actualRequest && actualRequest.employee ? actualRequest.employee : req.session.user,
          day_to_be_taken: dayToBeTaken, // Default to working day if empty
          date_to_be_taken: new Date(compensationDate),
          formattedDate_to_be_taken: formattedCompensationDate,
          working_day: requestData.workingDay,
          working_day_date: requestData.workingDayDate,
          remark: requestData.remark,
          balance: parseFloat(requestData.remainingBalance) || 0,
          status: actualRequest ? actualRequest.status : 'viewed',
          teamLeaderApprovalStatus: requestData.teamLeaderStatus || 'Pending',
          teamLeaderApprovedBy: actualRequest ? actualRequest.teamLeaderApprovedBy : null,
          teamLeaderApprovedAt: actualRequest ? actualRequest.teamLeaderApprovedAt : null,
          approvedBy: actualRequest ? actualRequest.approvedBy : null,
          approvedAt: actualRequest ? actualRequest.approvedAt : null
        };
        
        console.log('✅ Created existingRequest from requestData:', {
          formattedDate_to_be_taken: existingRequest.formattedDate_to_be_taken,
          compensationDate: compensationDate,
          dayToBeTaken: dayToBeTaken
        });

        // Create selected data from the table data (working day info)
        // First, try to use actual working days from database if available
        if (actualRequest && actualRequest.workingDayIds && Array.isArray(actualRequest.workingDayIds) && actualRequest.workingDayIds.length > 0) {
          console.log(`Using ${actualRequest.workingDayIds.length} working days from database`);
          selected = actualRequest.workingDayIds.map(wd => ({
            id: wd._id.toString(),
            day: wd.day,
            date: wd.date ? wd.date.toISOString().split('T')[0] : '',
            remark: wd.remark,
            balance: wd.balance
          }));
        } else {
          // Fallback to single row from requestData if database lookup failed
          console.log('Using single row from requestData (database lookup failed or no working days found)');
          selected = [{
            id: requestData._id,
            day: requestData.workingDay,
            date: formatDateString(requestData.workingDayDate),
            remark: requestData.remark,
            balance: parseFloat(requestData.remainingBalance) || 0
          }];
        }

        console.log('Created mock data from table row');
      } catch (error) {
        console.error('Error parsing request data:', error);
        return res.status(400).send('Invalid request data');
      }
    }


    // If requestId is provided, fetch the existing request
    else if (req.query.requestId) {
      console.log('Loading existing request with ID:', req.query.requestId);
      // Validate requestId as a valid MongoDB ObjectId
      if (!mongoose.isValidObjectId(req.query.requestId)) {
        return res.status(400).send('Invalid request ID');
      }
      try {
        existingRequest = await DayOffRequest.findById(req.query.requestId)
          .populate('employee', 'name email employeeNo signature')
          .populate('teamLeader', 'name')
          .populate('manager', 'name')
          .populate('teamLeaderApprovedBy', 'name signature')
          .populate('approvedBy', 'name signature')
          .populate('workingDayIds', 'day balance date remark');
        console.log('Found existing request:', existingRequest ? 'YES' : 'NO');
        if (!existingRequest) {
          console.log('Request not found for ID:', req.query.requestId);
        }
        if (existingRequest) {
          // Handle backward compatibility for old field names
          if (!existingRequest.day_to_be_taken && existingRequest.day) {
            existingRequest.day_to_be_taken = existingRequest.day;
          }
          if (!existingRequest.date_to_be_taken && existingRequest.date) {
            existingRequest.date_to_be_taken = existingRequest.date;
          }
          
          // ALWAYS ensure formattedDate_to_be_taken is set with proper format (YYYY-MM-DD)
          if (!existingRequest.formattedDate_to_be_taken) {
            if (existingRequest.date_to_be_taken) {
              try {
                const dateObj = new Date(existingRequest.date_to_be_taken);
                if (!isNaN(dateObj.getTime())) {
                  existingRequest.formattedDate_to_be_taken = dateObj.toISOString().split('T')[0];
                } else {
                  existingRequest.formattedDate_to_be_taken = '';
                }
              } catch (e) {
                console.error('Error formatting date_to_be_taken:', e);
                existingRequest.formattedDate_to_be_taken = '';
              }
            } else {
              existingRequest.formattedDate_to_be_taken = '';
            }
          }
          
          // Log what we have
          console.log('✅ formattedDate_to_be_taken set to:', existingRequest.formattedDate_to_be_taken);

          // Add team leader and manager approval status
          if (existingRequest.status === 'pending') {
            existingRequest.teamLeaderApprovalStatus = 'Pending';
            existingRequest.managerApprovalStatus = 'Pending';
          } else if (existingRequest.status === 'team_leader_approved') {
            existingRequest.teamLeaderApprovalStatus = existingRequest.teamLeaderApprovedBy && existingRequest.teamLeaderApprovedAt ? `${existingRequest.teamLeaderApprovedBy.name} on ${existingRequest.teamLeaderApprovedAt.toDateString()}` : 'Approved';
            existingRequest.managerApprovalStatus = 'Pending';
          } else if (existingRequest.status === 'approved') {
            existingRequest.teamLeaderApprovalStatus = existingRequest.teamLeaderApprovedBy && existingRequest.teamLeaderApprovedAt ? `${existingRequest.teamLeaderApprovedBy.name} on ${existingRequest.teamLeaderApprovedAt.toDateString()}` : 'Approved';
            existingRequest.managerApprovalStatus = existingRequest.approvedBy && existingRequest.approvedAt ? `${existingRequest.approvedBy.name} on ${existingRequest.approvedAt.toDateString()}` : 'Approved';
          } else {
            existingRequest.teamLeaderApprovalStatus = 'Rejected';
            existingRequest.managerApprovalStatus = 'Rejected';
          }

          // Log detailed request data
          console.log('=== LOADED REQUEST DATA ===');
          console.log('day_to_be_taken:', existingRequest.day_to_be_taken);
          console.log('date_to_be_taken:', existingRequest.date_to_be_taken);
          console.log('formattedDate_to_be_taken:', existingRequest.formattedDate_to_be_taken);
          console.log('working_day:', existingRequest.working_day);
          console.log('working_day_date:', existingRequest.working_day_date);
          console.log('remark:', existingRequest.remark);
          console.log('usedBalance:', existingRequest.usedBalance);
          console.log('=== END REQUEST DATA ===');
        }
        if (!existingRequest) {
          return res.status(404).send('Request not found');
        }
        // Check if user has permission to view this request (skip for testing)
        // if (req.session && req.session.user && req.session.user.role === 'employee' && existingRequest.employee._id.toString() !== req.session.user._id.toString()) {
        //   return res.status(403).send('Access denied');
        // }

        // Fetch workingDayIds separately with fallback
        if (existingRequest.workingDayIds && Array.isArray(existingRequest.workingDayIds) && existingRequest.workingDayIds.length > 0) {
          try {
            // Check if workingDayIds are already populated (objects) or just IDs
            const isPopulated = existingRequest.workingDayIds[0] && typeof existingRequest.workingDayIds[0] === 'object' && existingRequest.workingDayIds[0]._id;
            
            let workingDays;
            if (isPopulated) {
              // Already populated from the query, use as-is
              console.log('Working days already populated from query:', existingRequest.workingDayIds.length);
              workingDays = existingRequest.workingDayIds;
            } else {
              // Not populated, fetch them from database
              console.log('Fetching working days from database...');
              workingDays = await WorkingDay.find({ _id: { $in: existingRequest.workingDayIds } });
              console.log('Fetched working days:', workingDays.length);
            }
            
            selected = workingDays.map(wd => ({
              id: wd._id.toString(),
              day: wd.day,
              date: wd.date ? wd.date.toISOString().split('T')[0] : '',
              remark: wd.remark,
              balance: wd.balance
            }));
            console.log('Selected data created:', selected);
            
            // If we have working days, populate the existingRequest with the first one's details if missing
            if (selected.length > 0) {
              if (!existingRequest.working_day) {
                existingRequest.working_day = selected[0].day;
              }
              if (!existingRequest.working_day_date) {
                existingRequest.working_day_date = selected[0].date;
              }
            }
          } catch (fetchError) {
            console.error('Error fetching working days:', fetchError);
          }
        }
        // Set balance from the request - use the balance field (remaining balance for this request)
        // The balance field stores the amount of balance for this specific request
        if (existingRequest && existingRequest.balance !== undefined && existingRequest.balance !== null) {
          balance = existingRequest.balance;
        } else if (existingRequest && existingRequest.usedBalance) {
          // Fallback to usedBalance if balance is not available
          balance = existingRequest.usedBalance;
        } else {
          balance = 0;
        }
        // Balance is already set on existingRequest from the database
        
        console.log('Balance set to:', balance);

      } catch (populateError) {
        console.error('Error loading request data:', populateError);
        return res.status(500).send('Error loading request data');
      }
    }

    console.log('Rendering template with:', {
      selected: selected,
      balance: balance,
      existingRequest: existingRequest ? {
        _id: existingRequest._id,
        day: existingRequest.day,
        date: existingRequest.date,
        formattedDate: existingRequest.formattedDate,
        remark: existingRequest.remark,
        balance: existingRequest.balance
      } : null,
      requestId: req.query.requestId
    });
    
    try {
      // Determine mode: 'create' for new requests, 'view' for existing requests
      const mode = existingRequest ? 'view' : 'create';
      
      // Log what we're passing to the template
      console.log('\n📋 RENDERING TEMPLATE WITH DATA:');
      console.log('  Mode:', mode);
      console.log('  Has existingRequest:', !!existingRequest);
      if (existingRequest) {
        console.log('  existingRequest._id:', existingRequest._id);
        console.log('  existingRequest.day_to_be_taken:', existingRequest.day_to_be_taken);
        console.log('  existingRequest.date_to_be_taken:', existingRequest.date_to_be_taken);
        console.log('  existingRequest.formattedDate_to_be_taken:', existingRequest.formattedDate_to_be_taken);
        console.log('  existingRequest.working_day:', existingRequest.working_day);
        console.log('  existingRequest.working_day_date (before):', existingRequest.working_day_date);
        console.log('  existingRequest.balance:', existingRequest.balance);
        console.log('  existingRequest.remark:', existingRequest.remark);
        
        // Ensure working_day_date is formatted as YYYY-MM-DD string for the template
        if (existingRequest.working_day_date) {
          let dateValue = existingRequest.working_day_date;
          console.log('  Processing dateValue:', JSON.stringify(dateValue), 'Type:', typeof dateValue);
          
          // Convert to ISO string if it's a Date object
          if (typeof dateValue === 'object' && dateValue.toISOString) {
            dateValue = dateValue.toISOString();
            console.log('    Converted to ISO:', dateValue);
          }
          
          // Convert to string if it isn't already
          if (typeof dateValue !== 'string') {
            dateValue = String(dateValue);
            console.log('    Converted to string:', dateValue);
          }
          
          // Now extract just the date part (YYYY-MM-DD)
          if (dateValue.indexOf('T') > -1) {
            dateValue = dateValue.substring(0, dateValue.indexOf('T'));
            console.log('    Extracted date part:', dateValue);
          }
          
          // Use toObject() to get a plain object, then assign
          const reqObj = existingRequest.toObject ? existingRequest.toObject() : existingRequest;
          reqObj.working_day_date = dateValue;
          existingRequest = reqObj;
          console.log('  🔄 Final working_day_date:', existingRequest.working_day_date);
        }
      }
      console.log('  Selected:', selected);
      console.log('  Balance:', balance);
      
      res.render('dayoff-request', {
        session: req.session || {},
        selected,
        balance,
        totalDaysRequested: req.query.totalDaysRequested,
        existingRequest,
        requestId: req.query.requestId,
        mode: mode
      });
    } catch (renderError) {
      console.error('Template rendering error:', renderError);
      console.error('Template error stack:', renderError.stack);
      res.status(500).send('Error rendering template: ' + renderError.message);
    }
  } catch (error) {
    console.error('Error in dayoff-request route:', error);
    console.error('Error stack:', error.stack);
    res.status(500).send('Error loading day off request form: ' + error.message);
  }
});

// POST /requests/dayoff-request (new) - Create day off request with smart allocation
router.post('/dayoff-request', requireLogin, async (req, res) => {
  try {
    const { workingDayIds, totalDaysRequested, remainingBalance } = req.body;

    // Check if this is the new format (smart allocation)
    if (Array.isArray(workingDayIds) && workingDayIds.length > 0 && typeof workingDayIds[0] === 'object' && workingDayIds[0]._id) {
      console.log('\n========== POST /requests/dayoff-request (SMART ALLOCATION) ==========');
      console.log('User:', req.session.user.name);
      console.log('Total days requested:', totalDaysRequested);
      console.log('Working day entries:', workingDayIds.length);

      try {
        // Get user section and team leader/manager
        const currentUser = await User.findById(req.session.user._id).populate('section');
        if (!currentUser || !currentUser.section) {
          return res.status(400).json({ error: 'User section not found' });
        }

        const section = await Section.findById(currentUser.section._id)
          .populate('supervisor', 'name email role _id')
          .populate('manager', 'name email role _id');
        
        if (!section || !section.supervisor || !section.manager) {
          return res.status(400).json({ error: 'Team leader or manager not found for your section' });
        }

        // Update working day balances and mark as used if necessary
        const updatedWorkingDayIds = [];
        for (const dayEntry of workingDayIds) {
          const wd = await WorkingDay.findById(dayEntry._id);
          if (!wd) {
            return res.status(404).json({ error: `Working day not found: ${dayEntry._id}` });
          }

          // Update the balance
          wd.balance = dayEntry.newBalance;
          if (dayEntry.newBalance === 0) {
            wd.used = true;
          }
          await wd.save();

          updatedWorkingDayIds.push({
            _id: wd._id,
            day: wd.day,
            date: wd.date,
            daysUsed: dayEntry.daysUsed,
            balance: dayEntry.newBalance
          });

          console.log(`Updated working day ${wd.day}: balance ${dayEntry.daysUsed} used, new balance: ${dayEntry.newBalance}`);
        }

        // Create the day off request
        const request = new DayOffRequest({
          employee: req.session.user._id,
          teamLeader: section.supervisor._id,
          manager: section.manager._id,
          section: section._id,
          day_to_be_taken: 'Multiple Days',
          date_to_be_taken: new Date(),
          formattedDate_to_be_taken: new Date().toISOString().split('T')[0],
          balance: (remainingBalance || 0) - totalDaysRequested,
          usedBalance: totalDaysRequested,
          remark: `Requested ${totalDaysRequested} days off`,
          workingDayIds: updatedWorkingDayIds,
          status: 'pending',
          submittedAt: new Date()
        });

        const savedRequest = await request.save();
        console.log('✓ Day off request created successfully, ID:', savedRequest._id);

        return res.status(201).json({
          success: true,
          message: `Day off request for ${totalDaysRequested} days created successfully`,
          requestId: savedRequest._id
        });
      } catch (error) {
        console.error('Error in smart allocation:', error);
        return res.status(500).json({ error: 'Error creating day off request: ' + error.message });
      }
    }

    // Old format handling
    const { workingDays } = req.body;

    console.log('\n========== POST /requests/dayoff-request ==========');
    console.log('User:', req.session.user.name);
    console.log('Received workingDayIds:', workingDayIds);
    console.log('workingDayIds type:', Array.isArray(workingDayIds) ? 'Array' : typeof workingDayIds);
    console.log('workingDayIds length:', workingDayIds ? workingDayIds.length : 'undefined');
    console.log('Received workingDays:', workingDays);
    console.log('Received remainingBalance:', remainingBalance);

    // Validation: Ensure at least one working day is selected
    if (!workingDayIds || workingDayIds.length === 0) {
      console.log('❌ Validation failed: workingDayIds is empty or undefined');
      return res.status(400).json({ error: 'At least one working day must be selected' });
    }

    // Validation: Ensure workingDays array matches workingDayIds length
    if (!workingDays || workingDays.length !== workingDayIds.length) {
      console.log('❌ Validation failed: workingDays length does not match workingDayIds');
      console.log('  workingDays.length:', workingDays ? workingDays.length : 'undefined');
      console.log('  workingDayIds.length:', workingDayIds ? workingDayIds.length : 'undefined');
      return res.status(400).json({ error: 'Working days data does not match selected working days' });
    }

    // Validate all working days
    let totalUsedBalance = 0;
    const validWorkingDays = [];

    for (let i = 0; i < workingDayIds.length; i++) {
      const workingDayId = workingDayIds[i];
      const wd = workingDays[i];

      console.log(`\nProcessing working day ${i + 1}:`);
      console.log(`  ID: ${workingDayId}`);
      console.log(`  CompensationDate: ${wd.compensationDate}`);
      console.log(`  CompensationDay: ${wd.compensationDay}`);
      console.log(`  Remarks: ${wd.remarks}`);
      console.log(`  DaysUsed (from form): ${wd.daysUsed}`);

    // Validation: Required fields
    if (!wd.compensationDate || !wd.compensationDay || !wd.remarks) {
        console.log('  ❌ Missing required fields');
        return res.status(400).json({ error: `Compensation date, compensation day, and remarks are required for working day ${i + 1}` });
    }

    // Check if working day exists and is available
    const workingDay = await WorkingDay.findById(workingDayId);
    console.log(`  WorkingDay found: ${workingDay ? 'YES' : 'NO'}`);
    if (!workingDay) {
        console.log(`  ❌ Working day not found with ID: ${workingDayId}`);
        return res.status(404).json({ error: `Working day not found: ${workingDayId}` });
    }
    console.log(`  Working Day: ${workingDay.day} ${workingDay.date.toDateString()}, balance: ${workingDay.balance}, used: ${workingDay.used}`);
    // Check if working day has available balance (> 0)
    if (!workingDay.balance || workingDay.balance <= 0) {
        console.log(`  ❌ Working day has no available balance`);
        return res.status(400).json({ error: `Working day has no available balance: ${workingDay.day} ${workingDay.date.toDateString()}` });
    }
    if (workingDay.employee.toString() !== req.session.user._id.toString()) {
      console.log(`  ❌ Access denied - working day belongs to different user`);
      return res.status(403).json({ error: 'Access denied' });
      }

      validWorkingDays.push(workingDay);
      totalUsedBalance += 1; // Always deduct 1 day per request
      console.log(`  ✓ Valid - added to validWorkingDays (current balance: ${workingDay.balance}, will deduct 1 day)`);
    }

    console.log(`\nTotal valid working days: ${validWorkingDays.length}`);
    console.log(`Total used balance: ${totalUsedBalance}`);

    // Check balance: user must have at least 1 day available to request
    if (totalUsedBalance < 1) {
      console.log(`❌ Insufficient balance: need at least 1 day`);
      return res.status(400).json({ error: `Insufficient balance: need at least 1 day` });
    }

    // **UPDATE WORKING DAY BALANCES** - reduce balance for used days
    // For new smart allocation format, workingDays includes daysUsed field
    for (let i = 0; i < validWorkingDays.length; i++) {
      const wd = validWorkingDays[i];
      const dayData = workingDays[i];
      
      // Get the amount used - from daysUsed field if available (new format), otherwise 1 (old format)
      const amountUsed = (dayData && dayData.daysUsed) ? parseFloat(dayData.daysUsed) : 1;
      const originalBalance = wd.balance;
      
      wd.balance = parseFloat((wd.balance - amountUsed).toFixed(2)); // Round to 2 decimals to avoid floating point errors
      
      console.log(`Working day ${i}: ${wd.day}`);
      console.log(`  Original balance: ${originalBalance}`);
      console.log(`  Amount used (daysUsed): ${amountUsed}`);
      console.log(`  New balance: ${wd.balance}`);
      
      if (wd.balance <= 0) {
        wd.used = true;
        wd.balance = 0;
        console.log(`  → Marked as used (balance <= 0)`);
      } else {
        console.log(`  → Still available (balance > 0)`);
      }
      
      await wd.save();
      console.log(`  ✓ Saved to database\n`);
    }

    // Get the current user with section populated to find their team leader
    const currentUser = await User.findById(req.session.user._id).populate('section');
    console.log('Current user:', currentUser.name, 'Section:', currentUser.section ? currentUser.section.name : 'No section');
    
    if (!currentUser || !currentUser.section) {
      console.log('❌ User section not found');
      return res.status(400).json({ error: 'User section not found' });
    }

    // Find the team leader (supervisor) of the user's section
    const section = await Section.findById(currentUser.section._id)
      .populate('supervisor', 'name email role _id')
      .populate('manager', 'name email role _id');
    console.log('Section found:', section ? section.name : 'No section', 'Supervisor:', section && section.supervisor ? section.supervisor.name : 'No supervisor', 'Manager:', section && section.manager ? section.manager.name : 'No manager');
    
    if (!section || !section.supervisor) {
      console.log('❌ Team leader not found for section');
      return res.status(400).json({ error: 'Team leader not found for your section' });
    }
    
    if (!section.manager) {
      console.log('❌ Manager not found for section');
      return res.status(400).json({ error: 'Manager not found for your section' });
    }
    
    const teamLeader = section.supervisor;
    const manager = section.manager;
    console.log('Team leader assigned:', teamLeader.name, 'Manager assigned:', manager.name);

    // Use the first working day's compensation details for the main request fields
    const firstWd = workingDays[0];

    // Calculate the actual remaining balance: initial balance - days used
    // remainingBalance from frontend is the INITIAL balance, we need to subtract days used
    const actualRemainingBalance = remainingBalance - totalUsedBalance;
    console.log(`Calculating remaining balance: ${remainingBalance} (initial) - ${totalUsedBalance} (days used) = ${actualRemainingBalance}`);

    // Create the day off request
    const request = new DayOffRequest({
      employee: req.session.user._id,
      teamLeader: teamLeader._id,
      manager: manager._id,
      section: section._id,
      day_to_be_taken: firstWd.compensationDay,
      date_to_be_taken: new Date(firstWd.compensationDate),
      formattedDate_to_be_taken: new Date(firstWd.compensationDate).toISOString().split('T')[0],
      working_day: '', // Will be populated if needed
      working_day_date: '', // Will be populated if needed
      balance: actualRemainingBalance,
      remark: firstWd.remarks,
      workingDayIds: workingDayIds,
      status: 'pending',
      usedBalance: totalUsedBalance
    });

    await request.save();
    console.log('✓ Request saved with ID:', request._id);

    console.log('========== Request completed successfully ==========\n');
    res.json({ message: 'Day Off Request Submitted Successfully' });
  } catch (error) {
    console.error('Error creating day off request:', error);
    res.status(500).json({ error: 'Request failed. Try again.' });
  }
});

// GET /requests/:id - View request details
router.get('/:id', requireLogin, async (req, res) => {
  try {
    const request = await DayOffRequest.findById(req.params.id)
      .populate('employee', 'name email')
      .populate('teamLeader', 'name')
      .populate('manager', 'name')
      .populate('teamLeaderApprovedBy', 'name signature')
      .populate('approvedBy', 'name signature')
      .populate('workingDayIds', 'day balance date remark');
    if (!request) {
      return res.status(404).send('Request not found');
    }
    // Check if user has permission to view this request
    if (req.session.user.role === 'employee' && request.employee._id.toString() !== req.session.user._id.toString()) {
      return res.status(403).send('Access denied');
    }
    if (req.session.user.role === 'team_leader' && (request.status !== 'pending' || request.teamLeader._id.toString() !== req.session.user._id.toString())) {
      return res.status(403).send('Access denied');
    }
    if (req.session.user.role === 'manager' && request.status === 'pending') {
      return res.status(403).send('Access denied');
    }
    res.render('request-detail', { request, session: req.session });
  } catch (error) {
    res.status(500).send('Error fetching request details');
  }
});

// DELETE /requests/request/:id - Delete request
router.delete('/request/:id', requireLogin, async (req, res) => {
  try {
    const request = await DayOffRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    // Allow delete if user is the employee, manager, or team leader
    if (req.session.user.role !== 'manager' && req.session.user.role !== 'team_leader' && request.employee.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await DayOffRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting request' });
  }
});

module.exports = router;
