const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/admission_db';
mongoose.connect(mongoURI)
  .then(async () => {
    console.log('MongoDB Connected successfully!');
    // Seed default admin and teacher accounts
    await seedDefaultUsers();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Seed default accounts function
async function seedDefaultUsers() {
  try {
    // Seed Admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('adminpassword', salt);
      const admin = new User({
        username: 'admin',
        email: 'admin@admission.com',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Seeded default admin user: username=admin, password=adminpassword');
    }


  } catch (err) {
    console.error('Error seeding default users:', err);
  }
}

// Bind API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/students', require('./routes/students'));
app.use('/api/export', require('./routes/export'));

// Base Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Admission Management API is running' });
});

// Global Error Handler for Upload Size and General Errors
const multer = require('multer');
const fs = require('fs');
app.use((err, req, res, next) => {
  // Cleanup any partial files uploaded locally on error
  if (req.file && req.file.path && fs.existsSync(req.file.path)) {
    try { fs.unlinkSync(req.file.path); } catch (e) { console.error('Error cleaning up local file:', e); }
  }
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      const filesArr = req.files[key];
      if (Array.isArray(filesArr)) {
        filesArr.forEach(f => {
          if (f && f.path && fs.existsSync(f.path)) {
            try { fs.unlinkSync(f.path); } catch (e) { console.error('Error cleaning up local file:', e); }
          }
        });
      }
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large! Maximum allowed size is 2MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'An error occurred.' });
  }
  next();
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
