import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  getGradesBySchoolHandler,
  getSchoolByIdHandler,
  getSchoolBySchoolNameHandler,
  getSchoolNameByGradeHandler,
  getSchoolsHandler,
} from "../controllers/school.controller";

const router = express.Router();

router.get("/school-name/:gradeId", getSchoolNameByGradeHandler);
router.get("/name/:schoolName", getSchoolBySchoolNameHandler); //school/radiant
router.get("/:schoolId", getSchoolByIdHandler);
router.get("/:schoolId/grades", getGradesBySchoolHandler);
router.get("/", getSchoolsHandler);

export default router;
