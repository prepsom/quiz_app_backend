
import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { createAnswerForQuestionHandler, deleteAnswerHandler, updateCorrectAnswerHandler } from "../controllers/answer.controller";

const router = express.Router();


router.post("/",authenticateUser,createAnswerForQuestionHandler); // create possible answers for a question with this enpoint
router.patch("/correct-answer/:answerId",authenticateUser,updateCorrectAnswerHandler)
router.delete("/:answerId",authenticateUser,deleteAnswerHandler);

export default router;