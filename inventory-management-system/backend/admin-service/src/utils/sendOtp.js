import nodemailer from 'nodemailer';

/**
 * Generates a 6-digit OTP string.
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Creates a Nodemailer transporter from environment variables.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Builds a professional HTML email for OTP delivery.
 */
const buildOtpEmailHtml = (otp, expiryMinutes = 5) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NovaStock – Edit Approval OTP</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#1a1a24;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#c8963e 0%,#e8b94f 50%,#c8963e 100%);padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="width:44px;height:44px;background:rgba(0,0,0,0.25);border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="font-size:22px;font-weight:900;color:#fff;line-height:44px;">N</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Nova<strong>Stock</strong></span>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">
                Enterprise Inventory Management
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f0f5;">
                Edit Approval — One-Time Password
              </h1>
              <p style="margin:0 0 32px;color:#888;font-size:14px;line-height:1.6;">
                Your administrator has approved your inventory edit request.<br/>
                Use the OTP below to unlock the edit form.
              </p>

              <!-- OTP Box -->
              <div style="background:#111118;border:2px dashed #c8963e;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Your One-Time Password</p>
                <div style="letter-spacing:18px;font-size:42px;font-weight:900;color:#e8b94f;font-family:'Courier New',monospace;">
                  ${otp}
                </div>
                <p style="margin:12px 0 0;font-size:13px;color:#c8963e;">
                  ⏱ Expires in <strong>${expiryMinutes} minutes</strong>
                </p>
              </div>

              <!-- Steps -->
              <div style="background:#111118;border-radius:10px;padding:20px;margin-bottom:32px;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#f0f0f5;">How to use this OTP:</p>
                <ol style="margin:0;padding-left:20px;color:#888;font-size:13px;line-height:1.8;">
                  <li>Open NovaStock and navigate to <strong style="color:#e8b94f;">My Requests</strong></li>
                  <li>Find your approved edit request</li>
                  <li>Enter this OTP when prompted</li>
                  <li>Make your changes and save</li>
                </ol>
              </div>

              <!-- Security Warning -->
              <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#f87171;">
                  🔒 <strong>Security Notice:</strong> Never share this OTP with anyone.
                  NovaStock staff will never ask for your OTP. This code is valid for
                  <strong>${expiryMinutes} minutes</strong> only and can be used once.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:#555;text-align:center;line-height:1.6;">
                This is an automated message from <strong style="color:#888;">NovaStock IMS</strong>.<br/>
                If you did not request an edit, please contact your administrator immediately.<br/>
                &copy; ${new Date().getFullYear()} NovaStock Enterprise Inventory Management
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Sends OTP to the given email address via Nodemailer.
 * Falls back to console.log in development if EMAIL_USER is not configured.
 * @param {string} email
 * @param {string} otp
 */
export const sendOTP = async (email, otp) => {
  // Fallback: if no email credentials, just log
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[sendOTP] No email credentials configured. OTP for ${email}: ${otp}`);
    return true;
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"NovaStock IMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 NovaStock – Your Edit Approval OTP',
      html: buildOtpEmailHtml(otp, 5),
      text: `Your NovaStock Edit Approval OTP is: ${otp}\n\nThis OTP expires in 5 minutes.\nDo NOT share this code with anyone.`,
    });

    console.log(`[sendOTP] Email sent to ${email} — Message ID: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[sendOTP] Failed to send email:', err.message);
    // Don't block the approval flow — log and continue
    return false;
  }
};
