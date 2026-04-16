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

  /**
   * Send a notification email for key system transitions.
   * Fire-and-forget — failures are logged but never block the main action.
   *
   * Pass ctaText + ctaUrl to render a branded button in the email body.
   * Visual system matches the Supabase-dashboard Confirm Signup / Invite
   * templates so emails look consistent whether they're sent from Supabase
   * or from this service.
   */
  async sendNotificationEmail(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    message: string,
    ctaText?: string,
    ctaUrl?: string,
  ) {
    const year = new Date().getFullYear();
    const bgUrl = "https://ilutdlvlhjpxsyvedyxf.supabase.co/storage/v1/object/public/proposal_files/image.png";
    const logoUrl = "https://ilutdlvlhjpxsyvedyxf.supabase.co/storage/v1/object/public/proposal_files/LOGO.png";

    const ctaSection = ctaText && ctaUrl
      ? `
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 8px auto 24px auto;">
                  <tr>
                    <td align="center" bgcolor="#C8102E" style="border-radius: 8px;">
                      <a href="${ctaUrl}" target="_blank" class="button" style="display: inline-block; background-color: #C8102E; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-family: sans-serif; font-weight: 600; font-size: 16px; border: 1px solid #C8102E;">
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="color: #9ca3af; font-family: sans-serif; font-size: 13px; margin: 0 0 8px 0;">
                  Button not working? Copy and paste this link:<br>
                  <a href="${ctaUrl}" style="color: #C8102E; text-decoration: underline; word-break: break-all;">${ctaUrl}</a>
                </p>
      `
      : `
                <p style="color: #9ca3af; font-family: sans-serif; font-size: 13px; margin: 0;">
                  Please sign in to SPMAMS to view and take action.
                </p>
      `;

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    @media screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .content-padding { padding: 30px 20px !important; }
      .bg-wrapper { padding: 20px 10px !important; }
      .headline { font-size: 24px !important; }
    }
    .button:hover { background-color: #A00D26 !important; border-color: #A00D26 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #C8102E;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td class="bg-wrapper" align="center" style="background-color: #C8102E; background-image: linear-gradient(rgba(140, 0, 0, 0.4), rgba(140, 0, 0, 0.4)), url('${bgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat; padding: 60px 15px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e5e7eb;">
          <tr>
            <td class="content-padding" align="center" style="padding: 40px 40px 10px 40px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 9999px; padding: 4px 12px;">
                    <span style="color: #b91c1c; font-family: sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      Western Mindanao State University
                    </span>
                  </td>
                </tr>
              </table>
              <img src="${logoUrl}" alt="WMSU Logo" width="80" height="80" style="display: block; margin-bottom: 24px; border-radius: 12px;">
              <h1 class="headline" style="color: #111827; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 28px; font-weight: 800; margin: 0; line-height: 1.2;">
                Smart Proposal<br>
                <span style="color: #C8102E;">Management System</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td class="content-padding" align="center" style="padding: 10px 40px 40px 40px;">
              <h2 style="color: #111827; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
                ${subject}
              </h2>
              <p style="color: #4b5563; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 12px 0; text-align: left;">
                Hi ${recipientName},
              </p>
              <p style="color: #4b5563; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: left;">
                ${message}
              </p>
${ctaSection}
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-family: sans-serif; font-size: 12px; margin: 0; line-height: 1.5;">
                &copy; ${year} Western Mindanao State University<br>
                Research Development &amp; Evaluation Center<br>
                <span style="color: #9ca3af;">Zamboanga City</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textBody = [
      `Hi ${recipientName},`,
      "",
      message,
      "",
      ctaText && ctaUrl ? `${ctaText}: ${ctaUrl}` : "Please sign in to SPMAMS to view and take action.",
      "",
      `© ${year} Western Mindanao State University — Research Development & Evaluation Center`,
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
