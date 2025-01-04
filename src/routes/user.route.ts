import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { getLeaderBoardHandler, getTotalPointsHandler } from "../controllers/user.controller";

const router = express.Router();


router.get("/points",authenticateUser,getTotalPointsHandler);
router.get("/leaderboard",authenticateUser,getLeaderBoardHandler);

export default router;