const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plainPassword: { type: String },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'applicant'],
    default: 'applicant'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
