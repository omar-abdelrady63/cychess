const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
});

async function sendVerificationEmail(email, username, verificationCode) {
    const mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: email,
        subject: 'CyChess - Email Verification',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to CyChess!</h2>
        <p>Hi ${username},</p>
        <p>Thank you for registering. Please use the following verification code to complete your registration:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${verificationCode}
        </div>
        <p>This code will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">CyChess - Online Chess Platform</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

module.exports = {
    sendVerificationEmail
};
