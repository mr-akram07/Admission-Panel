const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const Application = require('../models/Application');
const { auth, checkRole } = require('../middleware/auth');

// Export students to Excel by month
router.get('/students', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { month } = req.query; // format: 'YYYY-MM'
    if (!month) {
      return res.status(400).json({ message: 'Month query parameter (YYYY-MM) is required' });
    }

    const [year, monthVal] = month.split('-').map(Number);
    if (isNaN(year) || isNaN(monthVal) || monthVal < 1 || monthVal > 12) {
      return res.status(400).json({ message: 'Invalid month format. Use YYYY-MM' });
    }

    // Start and end of the month
    const startDate = new Date(year, monthVal - 1, 1);
    const endDate = new Date(year, monthVal, 1); // 1st of next month (exclusive)

    // Find applications approved in this month (using updatedAt)
    const approvedStudents = await Application.find({
      status: 'approved',
      updatedAt: {
        $gte: startDate,
        $lt: endDate
      }
    });

    if (approvedStudents.length === 0) {
      return res.status(404).json({ message: 'No students approved in this month' });
    }

    // Map database structures to clean flat JSON objects for Excel export
    const excelRows = approvedStudents.map((student, index) => ({
      'S.No': index + 1,
      'Student ID': student.studentUserId ? student.studentUserId.toString() : 'N/A',
      'Username': student.studentUsername || 'N/A',
      'Full Name': student.name,
      'Father\'s Name': student.fathersName,
      'JEECUP Application No': student.jeecupAppNo,
      'Email': student.email,
      'Date of Birth': student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A',
      'Gender': student.gender,
      'Phone': student.phone,
      'Address': student.address,
      'Branch Applied': student.branch,
      'Approval Date': student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : 'N/A'
    }));

    // Create a new sheet from data
    const ws = XLSX.utils.json_to_sheet(excelRows);

    // Set column widths for better readability in Excel
    const colWidths = [
      { wch: 6 },  // S.No
      { wch: 26 }, // Student ID
      { wch: 15 }, // Username
      { wch: 20 }, // Full Name
      { wch: 20 }, // Father's Name
      { wch: 25 }, // JEECUP App No
      { wch: 25 }, // Email
      { wch: 15 }, // DOB
      { wch: 10 }, // Gender
      { wch: 15 }, // Phone
      { wch: 30 }, // Address
      { wch: 20 }, // Branch
      { wch: 15 }  // Approval Date
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Students_${month}`);

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Students_${month}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
