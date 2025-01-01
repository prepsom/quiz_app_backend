import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { addQuestionByLevelHandler, deleteQuestionHandler, getQuestionsByLevelHandler, getQuestionWithAnswers } from "../controllers/question.controller";

const router = express.Router();

router.get("/:levelId",authenticateUser,getQuestionsByLevelHandler);
router.post("/",authenticateUser,addQuestionByLevelHandler);
router.delete("/:questionId",authenticateUser,deleteQuestionHandler);
router.get("/answers/:questionId",authenticateUser,getQuestionWithAnswers);

export default router;