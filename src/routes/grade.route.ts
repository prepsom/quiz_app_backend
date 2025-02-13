

import express from "express";
import { getGradeByIdHandler, getNotificationsHandler, getStudentsByGradeIdHandler } from "../controllers/grade.controller";
import { authenticateUser } from "../middlewares/auth.middleware";


const router = express.Router();

router.get("/:gradeId",getGradeByIdHandler);
router.get("/:gradeId/students",authenticateUser,getStudentsByGradeIdHandler);
router.get("/:gradeId/notifications",authenticateUser,getNotificationsHandler);


export default router;
