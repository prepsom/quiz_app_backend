import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_SENDER_PASSWORD,
  },
});

async function sendEmaiL(email: string, password: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_SENDER,
      to: email.trim().toLowerCase(),
      subject: "PrepSOM Login Credentials",
      html: generateEmailTemplate(email, password),
      replyTo: process.env.EMAIL_SENDER,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}

const generateEmailTemplate = (email: string, password: string) => {
  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; padding: 20px 0; background-color: #f8f9fa; border-radius: 8px;">
            <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">Welcome to PrepSOM</h1>
        </div>
        
        <div style="padding: 30px 20px; background-color: #ffffff;">
            <p style="color: #555555; font-size: 16px; margin-bottom: 25px;">
                Thank you for joining PrepSOM. Below are your login credentials:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <div style="margin-bottom: 15px;">
                    <strong style="color: #2c3e50; display: inline-block; width: 100px;">Email:</strong>
                    <span style="color: #3498db;">${email
                      .trim()
                      .toLowerCase()}</span>
                </div>
                <div>
                    <strong style="color: #2c3e50; display: inline-block; width: 100px;">Password:</strong>
                    <span style="color: #3498db; font-family: monospace;">${password}</span>
                </div>
            </div>
            
            <p style="color: #555555; font-size: 14px; margin-top: 25px;">
                For security reasons, we recommend changing your password after your first login.
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin-top: 20px;">
            <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                If you didn't request this email, please ignore it or contact support.
            </p>
        </div>
    </div>
</body>
</html>`;
  return emailHtml;
};

export { sendEmaiL };
