const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Application = require('../models/Application');
const { auth } = require('../middleware/auth');

// Register Applicant
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate username (no special characters or spaces)
    if (!username || !/^[a-zA-Z0-9]+$/.test(username)) {
      return res.status(400).json({ message: 'Username cannot contain special characters or spaces' });
    }

    // Validate password complexity
    if (!password || password.length < 8 || password.length > 16) {
      return res.status(400).json({ message: 'Password must be between 8 and 16 characters long' });
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]{};':"\\|#`~]/.test(password);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return res.status(400).json({ message: 'Password must contain a mix of letters, numbers, and special symbols' });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'Username or Email already exists' });
    }

    user = new User({
      username,
      email,
      password,
      plainPassword: password,
      role: 'applicant'
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create Token
    const payload = { id: user._id, role: user.role, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecretadmissionkey12345', { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Login User (Applicant, Admin, Student, Teacher)
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password, role } = req.body;

    // Find user
    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check role matches
    if (user.role !== role) {
      return res.status(403).json({ message: `Access denied: User is registered as ${user.role}, not ${role}` });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create Token
    const payload = { id: user._id, role: user.role, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecretadmissionkey12345', { expiresIn: '24h' });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user info
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (for logged-in user: admin, student, etc.)
router.put('/change-password', auth, async (req, res) => {
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

    // If it is a student, also update studentPasswordText in Application model
    if (user.role === 'student') {
      const studentApplication = await Application.findOne({ studentUserId: user._id });
      if (studentApplication) {
        studentApplication.studentPasswordText = newPassword;
        await studentApplication.save();
      }
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change username (for logged-in user)
router.put('/change-username', auth, async (req, res) => {
  try {
    const { newUsername } = req.body;
    if (!newUsername) {
      return res.status(400).json({ message: 'New username is required' });
    }

    // Validate username format (no spaces or special characters, letters and numbers only)
    if (!/^[a-zA-Z0-9]+$/.test(newUsername)) {
      return res.status(400).json({ message: 'Username cannot contain special characters or spaces' });
    }

    // Check if username already taken
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = newUsername;
    await user.save();

    res.json({ message: 'Username updated successfully', username: newUsername });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
