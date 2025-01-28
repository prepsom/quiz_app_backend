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
exports.sendWhatsappMessageWithAccountCredentials = void 0;
const twilio_1 = __importDefault(require("twilio"));
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const client = (0, twilio_1.default)(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const sendWhatsappMessageWithAccountCredentials = (email, password, phoneNum) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("sending message with credentials for prepsom");
        if (phoneNum.length !== 10) {
            console.log(`Invalid phone number ${phoneNum} with length ${phoneNum.length}`);
            return;
        }
        const validWhatsappNumber = "+91" + phoneNum;
        yield client.messages.create({
            body: `Welcome to PrepSOM\nHere are your Login Credentials\nEmail:-${email
                .trim()
                .toLowerCase()}\nPasswowrd:- ${password.trim()}`,
            from: "whatsapp:+14155238886",
            to: `whatsapp:${validWhatsappNumber}`,
        });
        console.log(`whatsapp message sent to ${email.trim().toLowerCase()}`);
    }
    catch (error) {
        console.log(`Failed to send whatsapp message to ${email.trim().toLowerCase}`);
        throw error;
    }
});
exports.sendWhatsappMessageWithAccountCredentials = sendWhatsappMessageWithAccountCredentials;
