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

  // If password is a Brevo API Key, use Brevo HTTP API directly for better reliability on cloud environments (like Render)
  if (emailPass.startsWith('xkeysib-')) {
    try {
      const url = 'https://api.brevo.com/v3/smtp/email';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': emailPass,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: "MAHAMAYA POLYTECHNIC OF INFORMATION TECHNOLOGY, SIDDHARTHNAGAR",
            email: emailUser
          },
          to: [
            {
              email: toEmail
            }
          ],
          subject: subject,
          textContent: messageText
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log(`✉️  Admission email sent successfully via Brevo API to: ${toEmail}`);
        return;
      } else {
        console.warn(`⚠️  Brevo API failed with status ${response.status}:`, responseData.message || responseData);
        console.log('🔄  Attempting fallback to Nodemailer SMTP...');
      }
    } catch (apiError) {
      console.warn('⚠️  Brevo API request failed:', apiError.message || apiError);
      console.log('🔄  Attempting fallback to Nodemailer SMTP...');
    }
  }

  // Fallback / Default SMTP sending
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
    console.log(`✉️  Admission email sent successfully via SMTP to: ${toEmail}`);
  } catch (error) {
    console.error('❌  Email notification failed to send:', error.message || error);
  }
};

module.exports = { sendAdmissionEmail };
