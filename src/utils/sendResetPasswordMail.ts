import { createTransport } from "nodemailer";

export const sendResetPasswordMail = async (
  email: string,
  resetPasswordUrl: string
) => {
  try {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body>
        <div style="display:flex; flex-direction:column;">
            <p>Here is your reset password link</p>
        </div>
        <div style="display: flex; gap: 12px; flex-direction: column;">
            <div style="display: flex; gap: 6px;">
                <span>Link:-</span>
                <a href="${resetPasswordUrl}">${resetPasswordUrl}</a>
            </div>
        </div>
    </body>
    </html>`;

    const transporter = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email.trim().toLowerCase(),
      subject: "PrepSOM: Forgot Password Email",
      html: html,
    };
    const response = await transporter.sendMail(mailOptions);
    console.log(response);
    console.log(`forgot password email sent to ${email.trim().toLowerCase()}`);
  } catch (error) {
    console.log("Failed to send forgot password email :- ", error);
    throw error;
  }
};
