"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const questionResponse_controller_1 = require("../controllers/questionResponse.controller");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.authenticateUser, questionResponse_controller_1.answerQuestionHandler);
exports.default = router;
