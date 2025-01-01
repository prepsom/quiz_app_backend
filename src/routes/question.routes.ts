import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { addQuestionByLevelHandler, getQuestionsByLevelHandler } from "../controllers/question.controller";

const router = express.Router();

router.get("/:levelId",authenticateUser,getQuestionsByLevelHandler);
router.post("/",authenticateUser,addQuestionByLevelHandler);

export default router;