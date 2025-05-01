import Twilio from "twilio";

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;

const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendWhatsappMessageWithAccountCredentials = async (
  email: string,
  password: string,
  phoneNum: string
) => {
  try {
    console.log("sending message with credentials for prepsom");
    if (phoneNum.length !== 10) {
      console.log(
        `Invalid phone number ${phoneNum} with length ${phoneNum.length}`
      );
      return;
    }
    const validWhatsappNumber = "+91" + phoneNum;
    await client.messages.create({
      body: `Welcome to PrepSOM\nHere are your Login Credentials\nEmail:-${email
        .trim()
        .toLowerCase()}\nPasswowrd:- ${password.trim()}`,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${validWhatsappNumber}`,
    });
    console.log(`whatsapp message sent to ${email.trim().toLowerCase()}`);
  } catch (error) {
    console.log(
      `Failed to send whatsapp message to ${email.trim().toLowerCase}`
    );
    throw error;
  }
};

export { sendWhatsappMessageWithAccountCredentials };
