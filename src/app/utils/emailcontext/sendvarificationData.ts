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

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px; margin: 0 auto; background-color: #f7fafc; padding: 20px; }
    .container { border-radius: 16px; background-color: #ffffff; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
    .logo-container { text-align: center; padding: 32px 20px 12px; }
    .logo-img { width: 90px; height: 90px; object-fit: cover; border-radius: 22px; box-shadow: 0 6px 18px rgba(255, 75, 110, 0.28); display: inline-block; }
    .header { text-align: center; padding: 8px 20px 20px; }
    .header h2 { margin: 0; color: #1a202c; font-size: 22px; font-weight: 700; }
    .content { padding: 0 32px 32px; }
    .user-greeting { font-size: 16px; color: #2d3748; font-weight: 600; margin-bottom: 12px; }
    .otp-box { text-align: center; margin: 26px 0; padding: 20px; background: #fff5f7; border: 1.5px dashed #ff4b6e; border-radius: 14px; }
    .otp-label { font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; font-weight: 600; }
    .otp-code { font-size: 34px; font-weight: 800; color: #ff3366; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; margin: 4px 0; }
    .expiry-note { font-size: 13px; color: #718096; text-align: center; margin-top: 8px; }
    .footer { font-size: 12px; text-align: center; padding: 20px; color: #a0aec0; border-top: 1px solid #edf2f7; background-color: #faf5f7; }
    @media only screen and (max-width: 600px) { body { padding: 10px; } .content { padding: 0 20px 24px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img class="logo-img" src="cid:appLogo" alt="Angel Event Platform" />
    </div>
    <div class="header">
      <h2>${escapedSubject}</h2>
    </div>
    <div class="content">
      <p class="user-greeting">Hello ${escapedUsername},</p>
      <p>Thank you for connecting with <strong>Angel Event Platform</strong>. Please use the verification code below to complete your authentication:</p>
      
      <div class="otp-box">
        <div class="otp-label">Verification Code</div>
        <div class="otp-code" role="text" aria-label="Verification code">${otp}</div>
        <div class="expiry-note">&#9200; Valid for <strong>10 minutes</strong> only</div>
      </div>
      
      <p style="color: #718096; font-size: 14px;">If you did not request this verification code, please disregard this email.</p>
      <p style="margin-top: 24px;">Best regards,<br><strong>Angel Event Platform Team</strong></p>
    </div>
    <div class="footer">
      <p style="margin: 4px 0;">This is an automated security notification. Please do not reply directly to this email.</p>
      <p style="margin: 4px 0;">&copy; ${currentYear} Angel Event Platform. All rights reserved.</p>
    </div>
  </div>
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