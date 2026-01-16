const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Optional - can be added later
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Optional - can be added later
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique section names within a department
sectionSchema.index({ name: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
