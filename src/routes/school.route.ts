import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import { getSchoolNameByGradeHandler } from "../controllers/school.controller";

const router = express.Router();

router.get("/school-name/:gradeId", getSchoolNameByGradeHandler);

export default router;
