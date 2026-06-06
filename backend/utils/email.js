const https = require('https');

const sendAdmissionEmail = async (toEmail, subject, messageText) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  // Simulation mode if API key is missing
  if (!resendApiKey || resendApiKey === '') {
    console.log('\n==================================================');
    console.log('📬  EMAIL NOTIFICATION SIMULATION (NO API KEY)');
    console.log(`To:      ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${messageText}`);
    console.log('==================================================\n');
    console.log('ℹ️  Tip: Set RESEND_API_KEY in your env to send actual emails.\n');
    return;
  }

  try {
    const data = JSON.stringify({
      from: 'Admission System <onboarding@resend.dev>',
      to: toEmail,
      subject: subject,
      text: messageText
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✉️  Admission email sent successfully to: ${toEmail}`);
        } else {
          console.error(`❌  Resend API Error (Status ${res.statusCode}):`, responseBody);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌  Resend request failed:', error.message || error);
    });

    req.write(data);
    req.end();

  } catch (error) {
    console.error('❌  Email notification failed to send:', error.message || error);
  }
};

module.exports = { sendAdmissionEmail };
