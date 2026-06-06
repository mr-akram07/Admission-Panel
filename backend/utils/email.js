const nodemailer = require('nodemailer');

const sendAdmissionEmail = async (toEmail, subject, messageText) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Simulation mode if credentials are empty/missing
  if (!emailUser || !emailPass || emailUser === '' || emailPass === '') {
    console.log('\n==================================================');
    console.log('📬  EMAIL NOTIFICATION SIMULATION');
    console.log(`To:      ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${messageText}`);
    console.log('==================================================\n');
    console.log('ℹ️  Tip: Set EMAIL_USER & EMAIL_PASS in your backend/.env to send actual emails.\n');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Can be replaced by custom SMTP services
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    await transporter.sendMail({
      from: `"MAHAMAYA POLYTECHNIC OF INFORMATION TECHNOLOGY, SIDDHARTHNAGAR" <${emailUser}>`,
      to: toEmail,
      subject: subject,
      text: messageText
    });
    console.log(`✉️  Admission email sent successfully to: ${toEmail}`);
  } catch (error) {
    console.error('❌  Email notification failed to send:', error.message || error);
  }
};

module.exports = { sendAdmissionEmail };
