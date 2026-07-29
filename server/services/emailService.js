import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: `"ReWear Circular Marketplace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'ReWear Account Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #212121; background-color: #F7F9F6;">
          <h2 style="color: #2E7D32;">ReWear Password Recovery</h2>
          <p>You requested a password reset for your ReWear swap account. Please click the button below to complete the recovery process:</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #2E7D32; color: white; padding: 12px 24px; border-radius: 20px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If you did not request this email, please ignore it or contact our disputes team.</p>
          <hr style="border: none; border-top: 1px solid #E0E4DE; margin-top: 24px;" />
          <p style="font-size: 0.8rem; color: #757575;">ReWear Sustainable Marketplace &copy; 2026</p>
        </div>
      `
    };

    // If SMTP credentials are not configured, mock success response for demo
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[EMAIL MOCK] Password reset link sent to ${email}: ${resetUrl}`);
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Nodemailer Error: ${error.message}`);
    return false;
  }
};
