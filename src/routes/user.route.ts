import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { getLeaderBoardHandler, getTotalPointsHandler, isUserPasswordCorrect, updateUserNameHandler, updateUserPasswordHandler } from "../controllers/user.controller";

const router = express.Router();


router.get("/points",authenticateUser,getTotalPointsHandler);
router.get("/leaderboard",authenticateUser,getLeaderBoardHandler);
router.post("/check-password",authenticateUser,isUserPasswordCorrect);
router.put("/name",authenticateUser,updateUserNameHandler);
router.put("/password",authenticateUser,updateUserPasswordHandler);

export default router;