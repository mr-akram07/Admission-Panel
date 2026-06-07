const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Application = require('../models/Application');
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Get student profile (for logged-in student)
router.get('/profile', auth, checkRole(['student']), async (req, res) => {
  try {
    const student = await Application.findOne({ studentUserId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student profile (for logged-in student)
router.put('/profile', auth, checkRole(['student']), upload.single('photo'), async (req, res) => {
  try {
    const { phone, address } = req.body;
    const student = await Application.findOne({ studentUserId: req.user.id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (phone) {
      const duplicatePhone = await Application.findOne({ phone, studentUserId: { $ne: req.user.id } });
      if (duplicatePhone) {
        return res.status(400).json({ message: 'This phone number is already registered with another student.' });
      }
      student.phone = phone;
    }
    if (address) student.address = address;

    if (req.file) {
      const cloudinaryUrl = await uploadToCloudinary(req.file.path);
      student.photo = cloudinaryUrl;
    }

    student.updatedAt = Date.now();
    await student.save();
    
    res.json({ message: 'Profile updated successfully', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all approved students (Admin/Teacher only)
router.get('/all', auth, checkRole(['admin']), async (req, res) => {
  try {
    const students = await Application.find({ status: 'approved' }).sort({ updatedAt: -1 });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload extra document (for logged-in student)
router.post('/upload-document', auth, checkRole(['student']), upload.single('document'), async (req, res) => {
  try {
    const { documentName } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const student = await Application.findOne({ studentUserId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const cloudinaryUrl = await uploadToCloudinary(req.file.path);
    student.documents.push({
      name: documentName || req.file.originalname,
      path: cloudinaryUrl
    });

    student.updatedAt = Date.now();
    await student.save();

    res.json({ message: 'Document uploaded successfully', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change student password
router.put('/change-password', auth, checkRole(['student']), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    // Validate new password complexity
    if (newPassword.length < 8 || newPassword.length > 16) {
      return res.status(400).json({ message: 'New password must be between 8 and 16 characters long' });
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]{};':"\\|#`~]/.test(newPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return res.status(400).json({ message: 'New password must contain a mix of letters, numbers, and special symbols' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.plainPassword = newPassword;
    await user.save();

    // Update studentPasswordText in Application model
    const studentApplication = await Application.findOne({ studentUserId: req.user.id });
    if (studentApplication) {
      studentApplication.studentPasswordText = newPassword;
      await studentApplication.save();
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Upload remaining optional document (marksheet12 or casteCert)
router.post('/upload-optional', auth, checkRole(['student']), upload.single('file'), async (req, res) => {
  try {
    const { docType } = req.body; // 'marksheet12' or 'casteCert'
    if (!docType || !['marksheet12', 'casteCert'].includes(docType)) {
      return res.status(400).json({ message: 'Invalid document type. Only marksheet12 and casteCert are allowed.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const student = await Application.findOne({ studentUserId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Check if the document was already uploaded
    if (student[docType]) {
      return res.status(400).json({ message: 'This document has already been uploaded.' });
    }

    const cloudinaryUrl = await uploadToCloudinary(req.file.path);
    student[docType] = cloudinaryUrl;
    student.updatedAt = Date.now();
    await student.save();

    res.json({ message: `${docType === 'marksheet12' ? '12th Marksheet' : 'Caste Certificate'} uploaded successfully`, student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
