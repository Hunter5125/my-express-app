const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireLogin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for signature uploads
const signatureUploadDir = path.join(__dirname, '../public/uploads/signatures');

// Ensure upload directory exists
if (!fs.existsSync(signatureUploadDir)) {
  fs.mkdirSync(signatureUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, signatureUploadDir);
  },
  filename: function(req, file, cb) {
    // Save as userId_timestamp_originalname
    const userId = req.session.user._id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept image files only
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET / - Redirect based on role
router.get('/', (req, res) => {
  if (req.session.user) {
    // Employees ONLY access /requests
    if (req.session.user.role === 'employee') {
      res.redirect('/requests');
    } else {
      // Team leaders and managers access dashboard
      res.redirect('/dashboard');
    }
  } else {
    res.redirect('/login');
  }
});

// GET /login - Show login form
router.get('/login', (req, res) => {
  res.render('login', { session: req.session });
});

// POST /login - Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { error: 'Invalid email or password', session: req.session });
    }
    req.session.user = { _id: user._id, name: user.name, email: user.email, role: user.role, employeeNo: user.employeeNo, signature: user.signature };
    // Redirect employees to /requests, others to /dashboard
    if (user.role === 'employee') {
      res.redirect('/requests');
    } else {
      res.redirect('/dashboard');
    }
  } catch (error) {
    res.status(500).send('Login error');
  }
});

// GET /dashboard - Show dashboard
router.get('/dashboard', requireLogin, async (req, res) => {
  // Prevent employees from accessing dashboard
  if (req.session.user.role === 'employee') {
    return res.status(403).send('Access denied. Employees cannot access dashboard.');
  }
  
  // HEAD requests don't need the body, just return 200
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }
  try {
    console.log('Dashboard access - User role:', req.session.user.role, 'User name:', req.session.user.name);
    let data = { session: req.session };

    if (req.session.user.role === 'team_leader') {
      const DayOffRequest = require('../models/DayOffRequest');
      const requests = await DayOffRequest.find({ teamLeader: req.session.user._id, status: 'pending' })
        .populate('teamLeader', 'name')
        .populate('manager', 'name')
        .populate('employee', 'name email employeeNo')
        .populate('workingDayIds')
        .populate('teamLeaderApprovedBy', 'name')
        .populate('approvedBy', 'name');
      
      // Add approval status
      requests.forEach(req => {
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
      
      data.requests = requests;
    } else if (req.session.user.role === 'manager') {
      const DayOffRequest = require('../models/DayOffRequest');
      const requests = await DayOffRequest.find({ manager: req.session.user._id, status: 'team_leader_approved' })
        .populate('teamLeader', 'name')
        .populate('manager', 'name')
        .populate('employee', 'name email employeeNo')
        .populate('workingDayIds')
        .populate('teamLeaderApprovedBy', 'name')
        .populate('approvedBy', 'name');
      
      // Add approval status
      requests.forEach(req => {
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
      
      data.requests = requests;
    } else if (req.session.user.role === 'admin') {
      // Admin sees all pending and team_leader_approved requests
      const DayOffRequest = require('../models/DayOffRequest');
      const requests = await DayOffRequest.find({ status: { $in: ['pending', 'team_leader_approved'] } })
        .populate('teamLeader', 'name')
        .populate('manager', 'name')
        .populate('employee', 'name email employeeNo')
        .populate('workingDayIds')
        .populate('teamLeaderApprovedBy', 'name')
        .populate('approvedBy', 'name');
      
      // Add approval status
      requests.forEach(req => {
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
      
      data.requests = requests;
    }

    res.render('dashboard', data);
  } catch (error) {
    res.status(500).send('Error loading dashboard');
  }
});

// GET /dashboard/working-days/:userId - View available working days for a user
router.get('/dashboard/working-days/:userId', requireLogin, async (req, res) => {
  try {
    // Only team leaders, managers, and admins can view other users' working days
    if (req.session.user.role !== 'team_leader' && req.session.user.role !== 'manager' && req.session.user.role !== 'admin') {
      return res.status(403).send('Access denied');
    }

    const WorkingDay = require('../models/WorkingDay');
    const User = require('../models/User');
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const workingDays = await WorkingDay.find({ 
      employee: req.params.userId, 
      used: false 
    }).populate('employee', 'name email employeeNo');
    
    const balance = workingDays.reduce((sum, day) => sum + day.balance, 0);

    res.render('working-days-view', {
      user,
      workingDays,
      balance,
      session: req.session
    });
  } catch (error) {
    console.error('Error loading working days:', error);
    res.status(500).send('Error loading working days');
  }
});

// GET /dayoff-request - Show day off request form
router.get('/dayoff-request', requireLogin, (req, res) => {
  res.render('dayoff-request', { session: req.session, query: req.query });
});

// GET /profile - Show user profile
router.get('/profile', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('profile', { session: req.session, user: user, success: req.query.success, error: req.query.error });
  } catch (error) {
    res.status(500).send('Error loading profile');
  }
});

// POST /profile/update - Update user profile (name, email, signature)
router.post('/profile/update', requireLogin, async (req, res) => {
  try {
    const { name, email, signature } = req.body;
    
    if (!name || !email || !signature) {
      return res.redirect('/profile?error=' + encodeURIComponent('Name, email, and signature are required'));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.redirect('/profile?error=' + encodeURIComponent('Invalid email format'));
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if email is being changed and if new email already exists
    if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingUser && existingUser._id.toString() !== req.session.user._id.toString()) {
        return res.redirect('/profile?error=' + encodeURIComponent('Email address is already in use'));
      }
    }

    // Update user fields
    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    // Don't trim signature as it may be base64 image data
    user.signature = signature;
    
    try {
      await user.save();
    } catch (saveError) {
      // Handle MongoDB unique constraint error
      if (saveError.code === 11000) {
        return res.redirect('/profile?error=' + encodeURIComponent('Email address is already in use'));
      }
      throw saveError;
    }

    // Update session with new data
    req.session.user.name = user.name;
    req.session.user.email = user.email;
    req.session.user.signature = user.signature;

    res.redirect('/profile?success=' + encodeURIComponent('Profile updated successfully'));
  } catch (error) {
    console.error('Profile update error:', error);
    res.redirect('/profile?error=' + encodeURIComponent('Error updating profile'));
  }
});

// POST /profile/change-password - Change user password
router.post('/profile/change-password', requireLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.redirect('/profile?error=' + encodeURIComponent('All password fields are required'));
    }

    if (newPassword !== confirmPassword) {
      return res.redirect('/profile?error=' + encodeURIComponent('New password and confirm password do not match'));
    }

    if (newPassword.length < 6) {
      return res.redirect('/profile?error=' + encodeURIComponent('Password must be at least 6 characters long'));
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.redirect('/profile?error=' + encodeURIComponent('Current password is incorrect'));
    }

    // Update password (will be hashed by pre-save hook)
    user.passwordHash = newPassword;
    await user.save();

    res.redirect('/profile?success=' + encodeURIComponent('Password changed successfully'));
  } catch (error) {
    console.error('Password change error:', error);
    res.redirect('/profile?error=' + encodeURIComponent('Error changing password'));
  }
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

// POST /profile/upload-signature - Upload signature image
router.post('/profile/upload-signature', requireLogin, upload.single('signatureImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Delete old signature file if it exists and is a file path (not base64)
    if (user.signature && user.signature.startsWith('/uploads/signatures/')) {
      const oldFilePath = path.join(__dirname, '../public', user.signature);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save new signature path
    const signaturePath = `/uploads/signatures/${req.file.filename}`;
    user.signature = signaturePath;
    await user.save();

    // Update session
    req.session.user.signature = user.signature;

    res.json({ success: true, path: signaturePath, message: 'Signature uploaded successfully' });
  } catch (error) {
    console.error('Signature upload error:', error);
    res.status(500).json({ success: false, error: 'Error uploading signature' });
  }
});

module.exports = router;
