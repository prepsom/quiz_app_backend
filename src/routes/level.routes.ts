import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  addLevelHandler,
  completeLevelHandler,
  deleteLevelHandler,
  getAllCompletedLevelsByUser,
  getAllCompletedLevelsByUserInSubject,
  getCompletedLevelsBySubjectHandler,
  getCompletedLevelsByUser,
  getLevelById,
  getLevelQuestions,
  getLevelResultsHandler,
  getLevelsByIds,
  getLevelsBySubjectHandler,
  getNextLevelHandler,
  updateLevelHandler,
} from "../controllers/level.controller";

const router = express.Router();

router.get(
  "/levels/completed-all",
  authenticateUser,
  getAllCompletedLevelsByUser
);
router.get("/:levelId/questions", authenticateUser, getLevelQuestions);
router.get("/next-level/:levelId", authenticateUser, getNextLevelHandler);
router.post("/", authenticateUser, addLevelHandler);
router.post("/:levelId/complete", authenticateUser, completeLevelHandler);
router.get("/levels/completed", authenticateUser, getCompletedLevelsByUser);
router.get(
  "/levels-with-metadata/:subjectId/completed",
  authenticateUser,
  getAllCompletedLevelsByUserInSubject
);
router.get("/levels/:subjectId", authenticateUser, getLevelsBySubjectHandler);
router.get(
  "/levels/:subjectId/completed",
  authenticateUser,
  getCompletedLevelsBySubjectHandler
);
router.get("/:levelId", getLevelById);
router.delete("/:levelId", authenticateUser, deleteLevelHandler);
router.put("/:levelId", authenticateUser, updateLevelHandler);
router.get("/:levelId/results", authenticateUser, getLevelResultsHandler);
router.post("/levels", authenticateUser, getLevelsByIds);

export default router;
