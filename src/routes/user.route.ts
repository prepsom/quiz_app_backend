import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { getTotalPointsHandler } from "../controllers/user.controller";

const router = express.Router();


router.get("/points",authenticateUser,getTotalPointsHandler);

export default router;