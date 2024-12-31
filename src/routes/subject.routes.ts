import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { addSubjectByGradeHandler, getSubjectsByGradeHandler } from "../controllers/subject.controller";

const router = express.Router();


router.post("/",authenticateUser,addSubjectByGradeHandler); // role = admin | teacher
router.get("/",authenticateUser,getSubjectsByGradeHandler); // get subjects from whatever grade the authenticated user is in 


export default router;
