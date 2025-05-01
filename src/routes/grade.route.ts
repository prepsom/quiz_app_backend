

import express from "express";
import { getGradeByIdHandler, getStudentsByGradeIdHandler } from "../controllers/grade.controller";
import { authenticateUser } from "../middlewares/auth.middleware";


const router = express.Router();

router.get("/:gradeId",getGradeByIdHandler);
router.get("/:gradeId/students",authenticateUser,getStudentsByGradeIdHandler);


export default router;
