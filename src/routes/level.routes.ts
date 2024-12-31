
import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { addLevelHandler, getLevelsBySubjectHandler } from "../controllers/level.controller";

const router = express.Router();


router.post("/",authenticateUser,addLevelHandler);
router.get("/:subjectId",authenticateUser,getLevelsBySubjectHandler)

export default router;