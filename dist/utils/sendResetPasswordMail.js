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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPasswordMail = void 0;
const nodemailer_1 = require("nodemailer");
const sendResetPasswordMail = (email, resetPasswordUrl) => __awaiter(void 0, void 0, void 0, function* () {
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
        const transporter = (0, nodemailer_1.createTransport)({
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
        const response = yield transporter.sendMail(mailOptions);
        console.log(response);
        console.log(`forgot password email sent to ${email.trim().toLowerCase()}`);
    }
    catch (error) {
        console.log("Failed to send forgot password email :- ", error);
        throw error;
    }
});
exports.sendResetPasswordMail = sendResetPasswordMail;
