const nodemailer = require('nodemailer');

const sendAdmissionEmail = async (toEmail, subject, messageText) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');

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
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for port 465, false for 587 and others
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
