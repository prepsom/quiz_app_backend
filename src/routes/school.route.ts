import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  getSchoolBySchoolNameHandler,
  getSchoolNameByGradeHandler,
} from "../controllers/school.controller";

const router = express.Router();

router.get("/school-name/:gradeId", getSchoolNameByGradeHandler);
router.get("/:schoolName", getSchoolBySchoolNameHandler); //school/radiant

export default router;
