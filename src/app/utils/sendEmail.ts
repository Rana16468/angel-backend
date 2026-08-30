import nodemailer from "nodemailer";
import config from "../config";
import path from "path";
import fs from "fs";

const sendEmail = async (to: string, html: string, subject?: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com.",
    port: 587,
    secure: config.NODE_ENV?.includes("production"),
    auth: {
      user: config.send_email.nodemailer_email,
      pass: config.send_email.nodemailer_password,
    },
  });

  const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
  const attachments = fs.existsSync(logoPath)
    ? [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "appLogo",
        },
      ]
    : [];

  await transporter.sendMail({
    from: `"Angel Event Platform" <${config.send_email.nodemailer_email}>`,
    to,
    subject: subject ? subject : "User Verification Email",
    text: "Verify your email within 10 minutes",
    html,
    attachments,
  });
};

export default sendEmail;

