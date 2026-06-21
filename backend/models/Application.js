const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  branch: { type: String, required: true },
  fathersName: { type: String, required: true },
  jeecupAppNo: { type: String, required: true },
  photo: { type: String, required: true },
  marksheet10: { type: String, required: true },
  marksheet12: { type: String },
  incomeCert: { type: String, required: true },
  domicileCert: { type: String, required: true },
  casteCert: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  rejectionReason: { type: String },
  studentUsername: { type: String }, // Set on approval
  studentPasswordText: { type: String }, // Set on approval so the applicant can view their credentials
  studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Linked student user record
  documents: [{ name: String, path: String }],
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', ApplicationSchema);
