import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  forgotPasswordHandler,
  getLeaderBoardHandler,
  getTotalPointsHandler,
  getUserByIdHandler,
  getUserTotalPointsHandler,
  isUserPasswordCorrect,
  resetPasswordHandler,
  updateUserNameHandler,
  updateUserPasswordHandler,
} from "../controllers/user.controller";

const router = express.Router();

router.get("/points", authenticateUser, getTotalPointsHandler);
router.get("/leaderboard", authenticateUser, getLeaderBoardHandler);
router.post("/check-password", authenticateUser, isUserPasswordCorrect);
router.put("/name", authenticateUser, updateUserNameHandler);
router.put("/password", authenticateUser, updateUserPasswordHandler);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);
router.get("/:userId",authenticateUser,getUserByIdHandler);
router.get("/:userId/total-points",authenticateUser,getUserTotalPointsHandler);

export default router;
