import 'dotenv/config'
import express, { Request, Response } from "express"
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors"
import { GRADES } from "./constants";
import { dbInit, seedUsers } from "./utils/dbSeeder";
import authRoutes from "./routes/auth.routes"
import subjectRoutes from "./routes/subject.routes"
import levelRoutes from "./routes/level.routes"
import questionRoutes from "./routes/question.routes"
import answerRoutes from "./routes/answer.route"

const app = express();
const port = process.env.PORT;
// instantiating a new prisma client
export const prisma = new PrismaClient()

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

initialize().catch((e) => {
    process.exit(1);
})
// seedUsers().catch(e => {
//     console.log('Failed to seed users',e);
//     process.exit(1);
// });

app.listen(port,() => {
    console.log(`server is running on post ${port}`);
})