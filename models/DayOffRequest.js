const mongoose = require('mongoose');

const dayOffRequestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  // Compensation details (day and date to be taken)
  day_to_be_taken: {
    type: String,
    required: true
  },
  date_to_be_taken: {
    type: Date,
    required: true
  },
  formattedDate_to_be_taken: {
    type: String
  },

  // Original working day details
  working_day: {
    type: String,
    default: ''
  },
  working_day_date: {
    type: Date,
    default: null
  },

  balance: {
    type: Number,
    required: true
  },
  usedBalance: {
    type: Number,
    default: 1
  },
  remark: {
    type: String,
    required: true
  },
  workingDayIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkingDay'
  }],
  status: {
    type: String,
    enum: ['pending', 'team_leader_approved', 'approved', 'rejected'],
    default: 'pending'
  },
  teamLeaderApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teamLeaderApprovedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DayOffRequest', dayOffRequestSchema);
