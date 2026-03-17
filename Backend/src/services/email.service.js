const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

/**
 * Send a 6-digit OTP verification email to the registering user.
 * @param {string} toEmail  - recipient address
 * @param {string} otp      - plain-text OTP to include in the email
 */
async function sendOtpEmail(toEmail, otp) {
    await transporter.sendMail({
        from: `"LazyCv" <${process.env.EMAIL_ID}>`,
        to: toEmail,
        subject: 'Your LazyCv verification code',
        html: `
            <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:32px;background:#0f1813;border:1px solid #1c2b23;border-radius:12px;color:#e4ede8;">
                <h2 style="margin:0 0 8px;color:#00ff88;">Verify your email</h2>
                <p style="color:#8aaa98;margin:0 0 24px;font-size:14px;">
                    Use the code below to complete your LazyCv registration.<br/>
                    It expires in <strong style="color:#e4ede8;">10 minutes</strong>.
                </p>
                <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#00ff88;text-align:center;padding:16px 0;">
                    ${otp}
                </div>
                <p style="margin-top:24px;font-size:12px;color:#4e6b5c;">
                    If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `,
    });
}

module.exports = { sendOtpEmail };
