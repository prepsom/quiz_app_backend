
import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { addLevelHandler, deleteLevelHandler, getLevelResultsHandler, getLevelsBySubjectHandler, updateLevelHandler } from "../controllers/level.controller";


const router = express.Router();


router.post("/",authenticateUser,addLevelHandler);
router.get("/:subjectId",authenticateUser,getLevelsBySubjectHandler);
router.delete("/:levelId",authenticateUser,deleteLevelHandler);
router.put("/:levelId",authenticateUser,updateLevelHandler);
router.get("/:levelId/results",authenticateUser,getLevelResultsHandler);

export default router;