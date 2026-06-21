const express = require('express');
const router = express.Router();
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Application = require('../models/Application');
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendAdmissionEmail } = require('../utils/email');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// Create/Submit Admission Application (Applicant only)
router.post('/submit', auth, checkRole(['applicant']), upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'marksheet10', maxCount: 1 },
  { name: 'marksheet12', maxCount: 1 },
  { name: 'incomeCert', maxCount: 1 },
  { name: 'domicileCert', maxCount: 1 },
  { name: 'casteCert', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, dob, gender, phone, address, branch, fathersName, jeecupAppNo } = req.body;

    // Check if user already has a pending or approved application
    let existingApp = await Application.findOne({ applicantId: req.user.id });
    if (existingApp && (existingApp.status === 'pending' || existingApp.status === 'approved')) {
      return res.status(400).json({ message: 'You already have a pending or approved application.' });
    }

    // Check if phone number is already registered with another applicant's application
    let duplicatePhone = await Application.findOne({ phone, applicantId: { $ne: req.user.id } });
    if (duplicatePhone) {
      return res.status(400).json({ message: 'Phone number already registered with another application.' });
    }

    // Check if JEECUP Application Number is already registered with another applicant's application
    let duplicateJeecup = await Application.findOne({ jeecupAppNo, applicantId: { $ne: req.user.id } });
    if (duplicateJeecup) {
      return res.status(400).json({ message: 'JEECUP Application Number already registered with another application.' });
    }

    // Check files on local disk
    const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : null;
    const marksheet10File = req.files && req.files['marksheet10'] ? req.files['marksheet10'][0] : null;
    const marksheet12File = req.files && req.files['marksheet12'] ? req.files['marksheet12'][0] : null;
    const incomeCertFile = req.files && req.files['incomeCert'] ? req.files['incomeCert'][0] : null;
    const domicileCertFile = req.files && req.files['domicileCert'] ? req.files['domicileCert'][0] : null;
    const casteCertFile = req.files && req.files['casteCert'] ? req.files['casteCert'][0] : null;

    // Helper to delete local files on validation error
    const cleanupLocalFiles = () => {
      const files = [photoFile, marksheet10File, marksheet12File, incomeCertFile, domicileCertFile, casteCertFile];
      files.forEach(f => {
        if (f && f.path && fs.existsSync(f.path)) {
          try { fs.unlinkSync(f.path); } catch (e) { console.error('Error cleaning up local file:', e); }
        }
      });
    };

    // Validate inputs
    if (!name || !email || !dob || !gender || !phone || !address || !branch || !fathersName || !jeecupAppNo) {
      cleanupLocalFiles();
      return res.status(400).json({ message: 'All text fields are required.' });
    }
    if (!/^\+91\d{10,}$/.test(phone)) {
      cleanupLocalFiles();
      return res.status(400).json({ message: 'Phone number must be +91 followed by at least 10 digits.' });
    }
    if (!photoFile) {
      cleanupLocalFiles();
      return res.status(400).json({ message: 'Applicant photo is required.' });
    }
    if (!marksheet10File) {
      cleanupLocalFiles();
      return res.status(400).json({ message: '10th Marksheet is required.' });
    }
    if (!incomeCertFile) {
      cleanupLocalFiles();
      return res.status(400).json({ message: 'Income Certificate is required.' });
    }
    if (!domicileCertFile) {
      cleanupLocalFiles();
      return res.status(400).json({ message: 'Domicile Certificate is required.' });
    }

    // Upload to Cloudinary after all validations pass
    let photoPath = '';
    let marksheet10Path = '';
    let marksheet12Path = '';
    let incomeCertPath = '';
    let domicileCertPath = '';
    let casteCertPath = '';

    try {
      photoPath = await uploadToCloudinary(photoFile.path);
      marksheet10Path = await uploadToCloudinary(marksheet10File.path);
      if (marksheet12File) {
        marksheet12Path = await uploadToCloudinary(marksheet12File.path);
      }
      incomeCertPath = await uploadToCloudinary(incomeCertFile.path);
      domicileCertPath = await uploadToCloudinary(domicileCertFile.path);
      if (casteCertFile) {
        casteCertPath = await uploadToCloudinary(casteCertFile.path);
      }
    } catch (uploadError) {
      cleanupLocalFiles();
      throw uploadError;
    }

    // If there is an existing rejected application, we delete it to start fresh.
    if (existingApp && existingApp.status === 'rejected') {
      await Application.deleteOne({ _id: existingApp._id });
    }

    const application = new Application({
      applicantId: req.user.id,
      name,
      email,
      dob: new Date(dob),
      gender,
      phone,
      address,
      branch,
      fathersName,
      jeecupAppNo,
      photo: photoPath,
      marksheet10: marksheet10Path,
      marksheet12: marksheet12Path,
      incomeCert: incomeCertPath,
      domicileCert: domicileCertPath,
      casteCert: casteCertPath,
      status: 'pending'
    });

    await application.save();

    // Retrieve applicant credentials for the email
    const applicantUser = await User.findById(req.user.id);
    const appUsername = applicantUser ? applicantUser.username : 'N/A';
    const appPassword = (applicantUser && applicantUser.plainPassword) ? applicantUser.plainPassword : 'Stored Securely';

    // Send application submission email notification
    const emailSubject = 'Admission Application Submitted Successfully';
    const emailMessage = `Dear ${application.name},

Thank you for submitting your admission application to MAHAMAYA POLYTECHNIC OF INFORMATION TECHNOLOGY, SIDDHARTHNAGAR.

Your Applicant Portal login credentials are:
- Username: ${appUsername}
- Password: ${appPassword}

Your application details are as follows:
- Branch: ${application.branch}
- Father's Name: ${application.fathersName}
- JEECUP Application Number: ${application.jeecupAppNo}
- Status: Pending Review

We are currently reviewing your application. You will receive another email notification once the administrator reviews and approves/rejects your application.

Best Regards,
MAHAMAYA POLYTECHNIC OF INFORMATION TECHNOLOGY, SIDDHARTHNAGAR`;

    sendAdmissionEmail(application.email, emailSubject, emailMessage);

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Get current user's application (Applicant only)
router.get('/my-application', auth, checkRole(['applicant']), async (req, res) => {
  try {
    const application = await Application.findOne({ applicantId: req.user.id });
    if (!application) {
      return res.status(404).json({ message: 'No application found' });
    }
    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all applications (Admin or Teacher)
router.get('/all', auth, checkRole(['admin']), async (req, res) => {
  try {
    const applications = await Application.find().sort({ submittedAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Approve Application
router.post('/:id/approve', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { studentUsername, studentPassword } = req.body;
    if (!studentUsername || !studentPassword) {
      return res.status(400).json({ message: 'Student username and password are required' });
    }

    // Validate student username (no spaces or special characters)
    if (!/^[a-zA-Z0-9]+$/.test(studentUsername)) {
      return res.status(400).json({ message: 'Student username cannot contain special characters or spaces' });
    }

    // Validate student password complexity
    if (studentPassword.length < 8 || studentPassword.length > 16) {
      return res.status(400).json({ message: 'Student password must be between 8 and 16 characters long' });
    }
    const hasLetter = /[a-zA-Z]/.test(studentPassword);
    const hasNumber = /[0-9]/.test(studentPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]{};':"\\|#`~]/.test(studentPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return res.status(400).json({ message: 'Student password must contain a mix of letters, numbers, and special symbols' });
    }

    // Verify application exists
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status === 'approved') {
      return res.status(400).json({ message: 'Application is already approved' });
    }

    // Check if student username already exists
    let existingUser = await User.findOne({ username: studentUsername });
    if (existingUser) {
      return res.status(400).json({ message: 'Student username already exists' });
    }

    // Create student user account
    const studentUser = new User({
      username: studentUsername,
      email: `${studentUsername}@college.edu`,
      password: studentPassword,
      plainPassword: studentPassword,
      role: 'student'
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    studentUser.password = await bcrypt.hash(studentPassword, salt);
    await studentUser.save();

    // Update application
    application.status = 'approved';
    application.studentUsername = studentUsername;
    application.studentPasswordText = studentPassword;
    application.studentUserId = studentUser._id;
    application.rejectionReason = undefined;
    application.updatedAt = Date.now();
    await application.save();

    // Send email notification to applicant with their student credentials
    const emailSubject = 'Congratulations! Your Admission has been Approved';
    const emailMessage = `Dear ${application.name},

We are pleased to inform you that your admission application has been APPROVED!

Here are your credentials to log in to the Student Portal:
- Username: ${studentUsername}
- Password: ${studentPassword}

Portal Link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login

Please log in using the 'Student' role tab.

Best Regards,
MAHAMAYA POLYTECHNIC OF INFORMATION TECHNOLOGY, SIDDHARTHNAGAR`;

    sendAdmissionEmail(application.email, emailSubject, emailMessage);

    res.json({ message: 'Application approved and student user created successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Admin Reject Application
router.post('/:id/reject', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = 'rejected';
    application.rejectionReason = rejectionReason;
    application.updatedAt = Date.now();
    
    // If it was approved before, clean up student user account
    if (application.studentUserId) {
      await User.deleteOne({ _id: application.studentUserId });
      application.studentUserId = undefined;
      application.studentUsername = undefined;
      application.studentPasswordText = undefined;
    }

    await application.save();

    // Send email notification of rejection to applicant
    const emailSubject = 'Admission Application Status Update';
    const emailMessage = `Dear ${application.name},

Thank you for your interest in our college. 

We regret to inform you that your admission application has been rejected due to the following reason:
"${rejectionReason}"

You can log back into the Applicant Portal to modify your details or submit a new form.

Best Regards,
MAHAMAYA POLYTECHNIC OF INFORMATION TECHNOLOGY, SIDDHARTHNAGAR`;

    sendAdmissionEmail(application.email, emailSubject, emailMessage);

    res.json({ message: 'Application rejected successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Admin Edit Application/Student Details
router.put('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const updates = req.body;
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check for duplicate phone/JEECUP when updating details
    if (updates.phone !== undefined) {
      const duplicatePhone = await Application.findOne({ phone: updates.phone, _id: { $ne: req.params.id } });
      if (duplicatePhone) {
        return res.status(400).json({ message: 'Phone number already registered with another application.' });
      }
    }

    if (updates.jeecupAppNo !== undefined) {
      const duplicateJeecup = await Application.findOne({ jeecupAppNo: updates.jeecupAppNo, _id: { $ne: req.params.id } });
      if (duplicateJeecup) {
        return res.status(400).json({ message: 'JEECUP Application Number already registered with another application.' });
      }
    }

    const allowedFields = ['name', 'email', 'dob', 'gender', 'phone', 'address', 'branch', 'fathersName', 'jeecupAppNo'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'dob') {
          application.dob = new Date(updates.dob);
        } else {
          application[field] = updates[field];
        }
      }
    });

    application.updatedAt = Date.now();
    await application.save();
    res.json({ message: 'Application details updated successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Delete Application and associated accounts
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Delete associated documents from Cloudinary
    const filesToDelete = [
      application.photo,
      application.marksheet10,
      application.marksheet12,
      application.incomeCert,
      application.domicileCert,
      application.casteCert
    ];

    if (application.documents && application.documents.length > 0) {
      application.documents.forEach(doc => {
        if (doc && doc.path) {
          filesToDelete.push(doc.path);
        }
      });
    }

    for (const url of filesToDelete) {
      if (url) {
        await deleteFromCloudinary(url);
      }
    }

    // Delete student user account if it was created
    if (application.studentUserId) {
      await User.deleteOne({ _id: application.studentUserId });
    }

    // Delete the applicant user account
    if (application.applicantId) {
      await User.deleteOne({ _id: application.applicantId });
    }

    // Delete the application itself
    await Application.deleteOne({ _id: application._id });

    res.json({ message: 'Application and associated user accounts deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
