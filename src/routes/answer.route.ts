
import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { createAnswerForQuestionHandler, updateCorrectAnswerHandler } from "../controllers/answer.controller";

const router = express.Router();


router.post("/",authenticateUser,createAnswerForQuestionHandler); // create possible answers for a question with this enpoint
router.patch("/correct-answer/:answerId",authenticateUser,updateCorrectAnswerHandler)


export default router;