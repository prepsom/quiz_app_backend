import "dotenv/config";
import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import subjectRoutes from "./routes/subject.routes";
import levelRoutes from "./routes/level.routes";
import questionRoutes from "./routes/question.routes";
import answerRoutes from "./routes/answer.route";
import questionResponseRoutes from "./routes/questionResponse.route";
import userRoutes from "./routes/user.route";
import schoolRoutes from "./routes/school.route";
import gradeRoutes from "./routes/grade.route";
import notificationRoutes from "./routes/notification.route"
import OpenAI from "openai";
import https from "https";
import fs from "fs";
import http from "http";

const app = express();
const port = process.env.PORT;

// instantiating a new prisma client
export const prisma = new PrismaClient();
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.get("/test", async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "server working",
  });
});

app.use("/auth", authRoutes);
app.use("/subject", subjectRoutes);
app.use("/level", levelRoutes);
app.use("/question", questionRoutes);
app.use("/answer", answerRoutes);
app.use("/question-response", questionResponseRoutes);
app.use("/user", userRoutes);
app.use("/school", schoolRoutes);
app.use("/grade",gradeRoutes);
app.use("/notification",notificationRoutes);

// Check if SSL certificates exist
const sslEnabled = () => {
  try {
    return {
      key: fs.readFileSync("./certs/key.pem"),
      cert: fs.readFileSync("./certs/cert.pem"),
    };
  } catch (error) {
    return false;
  }
};

const options = sslEnabled();

if (options) {
  // Create HTTPS server if SSL certificates exist
  https.createServer(options, app).listen(port, () => {
    console.log(`Secure server is running on https://localhost:${port}`);
  });
} else {
  // Fallback to HTTP server if no SSL certificates
  http.createServer(app).listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
