interface EmailContextType {
  sendVerificationData: (username: string, otp: number, subject: string) => string;
  sendEventInvitation: (
    username: string,
    eventTitle: string,
    date: string,
    startingTime: string,
    endingTime: string,
    description?: string,
    photo?: string
  ) => string;
}

const escapeHtml = (value: string): string =>
  value.replace(/[<>&"]/g, (match) => {
    const escapeMap: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
    };
    return escapeMap[match] || match;
  });

const emailContext: EmailContextType = {
  sendVerificationData: (username: string, otp: number, subject: string): string => {
    if (!username || typeof username !== 'string') {
      throw new Error('Username must be a non-empty string');
    }
    if (!otp || typeof otp !== 'number' || otp < 100000 || otp > 999999) {
      throw new Error('OTP must be a 6-digit number');
    }
    if (!subject || typeof subject !== 'string') {
      throw new Error('Subject must be a non-empty string');
    }

    const currentYear = new Date().getFullYear();
    const escapedUsername = escapeHtml(username);
    const escapedSubject = escapeHtml(subject);

    const isForgotPassword = /forgot|password|reset/i.test(subject);

    const actionTitle = isForgotPassword
      ? 'Password Reset Code'
      : 'Email Verification Code';

    const actionDescription = isForgotPassword
      ? 'We received a request to reset the password for your account. Please use the verification code below to proceed:'
      : 'Thank you for joining <strong>Angel Event Platform</strong>. Please use the verification code below to verify your email address:';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedSubject}</title>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.6; color: #2d3748;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">
    <!-- Top Brand Logo -->
    <tr>
      <td align="center" style="padding: 36px 24px 12px; text-align: center;">
        <img src="cid:appLogo" alt="Angel Event Platform" width="80" height="80" style="display: block; margin: 0 auto; width: 80px; height: 80px; border-radius: 20px; object-fit: cover; border: 0;" />
        <div style="font-size: 18px; font-weight: 800; color: #1a202c; margin-top: 12px; letter-spacing: -0.3px;">Angel Event Platform</div>
      </td>
    </tr>

    <!-- Header Title -->
    <tr>
      <td align="center" style="padding: 6px 24px 20px; text-align: center;">
        <h2 style="margin: 0; color: #ff3366; font-size: 22px; font-weight: 700;">${actionTitle}</h2>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 0 36px 28px;">
        <p style="font-size: 16px; color: #2d3748; font-weight: 600; margin: 0 0 12px;">Hello ${escapedUsername},</p>
        <p style="font-size: 15px; color: #4a5568; margin: 0 0 20px; line-height: 1.6;">${actionDescription}</p>

        <!-- OTP Code Box -->
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff5f7; border: 1.5px dashed #ff4b6e; border-radius: 14px; margin: 24px 0;">
          <tr>
            <td align="center" style="padding: 20px; text-align: center;">
              <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 6px;">Your One-Time Code</div>
              <div style="font-size: 34px; font-weight: 800; color: #ff3366; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; margin: 4px 0;">${otp}</div>
              <div style="font-size: 13px; color: #a0aec0; margin-top: 8px;">&#9200; Valid for <strong style="color: #4a5568;">10 minutes</strong> only</div>
            </td>
          </tr>
        </table>

        <p style="font-size: 13px; color: #718096; line-height: 1.5; margin: 20px 0 0;">If you did not make this request, please safely ignore this email. Your account remains secure.</p>
        <p style="font-size: 14px; color: #4a5568; margin: 24px 0 0;">Best regards,<br><strong style="color: #1a202c;">Angel Event Platform Team</strong></p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="padding: 20px 24px; background-color: #faf5f7; border-top: 1px solid #edf2f7; text-align: center;">
        <p style="font-size: 12px; color: #a0aec0; margin: 0 0 4px;">This is an automated security notification. Please do not reply directly to this email.</p>
        <p style="font-size: 12px; color: #a0aec0; margin: 0;">&copy; ${currentYear} Angel Event Platform. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  },


  sendEventInvitation: (
    username: string,
    eventTitle: string,
    date: string,
    startingTime: string,
    endingTime: string,
    description?: string,
    photo?: string
  ): string => {
    if (!username || typeof username !== 'string') {
      throw new Error('Username must be a non-empty string');
    }
    if (!eventTitle || typeof eventTitle !== 'string') {
      throw new Error('Event title must be a non-empty string');
    }
    if (!date || !startingTime || !endingTime) {
      throw new Error('Date, starting_time, and ending_time are required');
    }

    const currentYear = new Date().getFullYear();
    const escapedUsername = escapeHtml(username);
    const escapedTitle = escapeHtml(eventTitle);
    const escapedDescription = description ? escapeHtml(description) : '';

    const safePhoto =
      photo && /^https?:\/\//i.test(photo) ? photo.replace(/"/g, '&quot;') : undefined;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited: ${escapedTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px; margin: 0 auto; background-color: #f7fafc; padding: 20px; }
    .container { border-radius: 16px; background-color: #ffffff; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
    .logo-container { text-align: center; padding: 32px 20px 10px; }
    .logo-img { width: 90px; height: 90px; object-fit: cover; border-radius: 22px; box-shadow: 0 6px 18px rgba(255, 75, 110, 0.28); display: inline-block; }
    .header { text-align: center; padding: 10px 20px 20px; }
    .header h2 { margin: 0; color: #1a202c; font-size: 22px; font-weight: 700; }
    .content { padding: 0 32px 32px; }
    .event-photo { width: 100%; max-height: 260px; object-fit: cover; border-radius: 10px; margin: 14px 0 20px; }
    .event-details { padding: 18px; margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
    .event-details p { margin: 6px 0; font-size: 14px; }
    .footer { font-size: 12px; text-align: center; padding: 20px; color: #a0aec0; border-top: 1px solid #edf2f7; background-color: #faf5f7; }
    @media only screen and (max-width: 600px) { body { padding: 10px; } .content { padding: 0 20px 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img class="logo-img" src="cid:appLogo" alt="Angel Event Platform" />
    </div>
    <div class="header"><h2>You're Invited!</h2></div>
    <div class="content">
      <p>Hello <strong>${escapedUsername}</strong>,</p>
      <p>You've been invited to the following event:</p>
      ${safePhoto ? `<img class="event-photo" src="${safePhoto}" alt="${escapedTitle}">` : ''}
      <div class="event-details">
        <p><strong>Event:</strong> ${escapedTitle}</p>
        <p><strong>Date:</strong> ${escapeHtml(date)}</p>
        <p><strong>Time:</strong> ${escapeHtml(startingTime)} - ${escapeHtml(endingTime)}</p>
        ${escapedDescription ? `<p><strong>Details:</strong> ${escapedDescription}</p>` : ''}
      </div>
      <p>We look forward to seeing you there!</p>
      <p>Best regards,<br><strong>Angel Event Platform Team</strong></p>
    </div>
    <div class="footer">
      <p style="margin: 4px 0;">This is an automated message, please do not reply to this email.</p>
      <p style="margin: 4px 0;">&copy; ${currentYear} Angel Event Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  },
};

export default emailContext;