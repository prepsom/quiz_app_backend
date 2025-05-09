"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_SENDER_PASSWORD,
    },
});
function sendEmail(email, password, schoolName, gradeNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield transporter.sendMail({
                from: process.env.EMAIL_SENDER,
                to: email.trim().toLowerCase(),
                subject: `${schoolName.trim()} class ${gradeNumber} Assessment login credentials`,
                html: generateEmailTemplate(email, password, schoolName),
                replyTo: process.env.EMAIL_SENDER,
            });
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    });
}
const generateEmailTemplate = (email, password, schoolName) => {
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
            <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">Welcome to ${schoolName}</h1>
        </div>

        <div style="padding: 30px 20px; background-color: #ffffff;">
            <p style="color: #555555; font-size: 16px; margin-bottom: 10px;">
                We have created a gamified assessment for you, kindly login to the tool by clicking on the link below.
            </p>
            <a href="games.prepsom.com">games.prepsom.com</a>
            <p>Following are your login credentials: </p>
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
