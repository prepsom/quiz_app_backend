import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  addSubjectByGradeHandler,
  deleteSubjectHandler,
  getSubjectById,
  getSubjectsByGradeHandler,
  updateSubjectHandler,
} from "../controllers/subject.controller";

const router = express.Router();

router.post("/", authenticateUser, addSubjectByGradeHandler); // role = admin | teacher
router.get("/subjects/:gradeId", authenticateUser, getSubjectsByGradeHandler);
router.get("/:subjectId", getSubjectById);
router.delete("/:subjectId", authenticateUser, deleteSubjectHandler);
router.put("/:subjectId", authenticateUser, updateSubjectHandler);

export default router;
