import 'dotenv/config'
import express, { Request, Response } from "express"
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors"
import { GRADES } from "./constants";
import { dbInit, seedLevelsInSubject, seedUsers } from "./utils/dbSeeder";
import authRoutes from "./routes/auth.routes"
import subjectRoutes from "./routes/subject.routes"
import levelRoutes from "./routes/level.routes"
import questionRoutes from "./routes/question.routes"
import answerRoutes from "./routes/answer.route"
import questionResponseRoutes from "./routes/questionResponse.route"
import userRoutes from "./routes/user.route"
import OpenAI from 'openai';
import {join} from "path"

const projectRoot = join(__dirname, '..');

// Resolve the CSV path relative to the project root
const csvPath = join(projectRoot, 'public', process.env.USERS_CSV_PATH || 'Class-X-users-list.csv');

const app = express();
const port = process.env.PORT;
// instantiating a new prisma client
export const prisma = new PrismaClient()
export const openai = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY,
});


// middlewares
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials:true,
}));

const initialize = async () => {
    try {
        await dbInit();
        console.log('DB INITIALIZED');
    } catch (error) {
        console.log('server initialization error',error);
        process.exit(1);
    }
}

app.get("/test",async (req:Request,res:Response) => {
    res.status(200).json({
        "success":true,
        "message":"server working"
    });
});

app.use("/auth",authRoutes);
app.use("/subject",subjectRoutes);
app.use("/level",levelRoutes);
app.use("/question",questionRoutes);
app.use("/answer",answerRoutes);
app.use("/question-response",questionResponseRoutes);
app.use("/user",userRoutes);

initialize().catch((e) => {
    process.exit(1);
})
// seedUsers(1,csvPath).catch(e => {
//     console.log('Failed to seed users',e);
//     process.exit(1);
// });
// seedLevelsInSubject('0b0c9d2f-70f1-49e9-9bdb-225415e43d80').catch(e => {
//     console.log('FAILED TO SEED LEVELS IN DB',e)
//     process.exit(1);
// }).then(() => console.log('SUCCESSFULLY SEEDED LEVELS IN DB'));

app.listen(port,() => {
    console.log(`server is running on post ${port}`);
});
