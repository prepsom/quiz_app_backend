

import express from "express";
import { getGradeByIdHandler } from "../controllers/grade.controller";


const router = express.Router();

router.get("/:gradeId",getGradeByIdHandler);

export default router;
