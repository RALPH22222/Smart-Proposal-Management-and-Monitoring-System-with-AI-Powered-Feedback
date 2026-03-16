import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailService {
  private senderEmail: string;

  constructor() {
    this.senderEmail = process.env.SMTP_USER || "";
    if (!this.senderEmail) {
      throw new Error("Missing environment variable SMTP_USER");
    }
  }

  async sendVerificationEmail(recipientEmail: string, firstName: string, verificationLink: string) {
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #C8102E; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; }
          .header p { margin: 5px 0 0; font-size: 14px; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background-color: #C8102E;
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Western Mindanao State University</h1>
            <p>Smart Proposal Management and Monitoring System</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for registering with SPMAMS. Please click the button below to verify your email address and activate your account.</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #C8102E;">${verificationLink}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you did not create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Western Mindanao State University. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = [
      "Western Mindanao State University",
      "Smart Proposal Management and Monitoring System",
      "",
      `Hi ${firstName},`,
      "",
      "Thank you for registering with SPMAMS. Please visit the following link to verify your email address:",
      "",
      verificationLink,
      "",
      "This link will expire in 24 hours.",
      "",
      "If you did not create an account, please ignore this email.",
    ].join("\n");

    try {
      const info = await transporter.sendMail({
        from: `"WMSU SPMAMS" <${this.senderEmail}>`,
        to: recipientEmail,
        subject: "Verify Your Email - WMSU SPMAMS",
        text: textBody,
        html: htmlBody,
      });

      console.log("Verification email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error("Failed to send verification email:", err);
      return { success: false };
    }
  }

  /**
   * Send a notification email for key system transitions.
   * Fire-and-forget — failures are logged but never block the main action.
   */
  async sendNotificationEmail(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    message: string,
  ) {
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #C8102E; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; }
          .header p { margin: 5px 0 0; font-size: 14px; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Western Mindanao State University</h1>
            <p>Smart Proposal Management and Monitoring System</p>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            <p>Please log in to SPMAMS to take action.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Western Mindanao State University. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = [
      `Hi ${recipientName},`,
      "",
      message,
      "",
      "Please log in to SPMAMS to take action.",
      "",
      `© ${new Date().getFullYear()} Western Mindanao State University`,
    ].join("\n");

    try {
      const info = await transporter.sendMail({
        from: `"WMSU SPMAMS" <${this.senderEmail}>`,
        to: recipientEmail,
        subject: `${subject} - WMSU SPMAMS`,
        text: textBody,
        html: htmlBody,
      });

      console.log("Notification email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error("Failed to send notification email (non-blocking):", err);
      return { success: false };
    }
  }
}
