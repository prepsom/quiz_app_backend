"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.default.Router();
router.get("/points", auth_middleware_1.authenticateUser, user_controller_1.getTotalPointsHandler);
router.get("/leaderboard", auth_middleware_1.authenticateUser, user_controller_1.getLeaderBoardHandler);
router.post("/check-password", auth_middleware_1.authenticateUser, user_controller_1.isUserPasswordCorrect);
router.put("/name", auth_middleware_1.authenticateUser, user_controller_1.updateUserNameHandler);
router.put("/password", auth_middleware_1.authenticateUser, user_controller_1.updateUserPasswordHandler);
router.post("/forgot-password", user_controller_1.forgotPasswordHandler);
router.post("/reset-password", user_controller_1.resetPasswordHandler);
exports.default = router;
