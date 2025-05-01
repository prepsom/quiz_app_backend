import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { answerQuestionHandler } from "../controllers/questionResponse.controller";



const router = express.Router();


router.post("/",authenticateUser,answerQuestionHandler);

export default router;
