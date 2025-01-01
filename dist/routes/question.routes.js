"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const question_controller_1 = require("../controllers/question.controller");
const router = express_1.default.Router();
router.get("/:levelId", auth_middleware_1.authenticateUser, question_controller_1.getQuestionsByLevelHandler);
router.post("/", auth_middleware_1.authenticateUser, question_controller_1.addQuestionByLevelHandler);
router.delete("/:questionId", auth_middleware_1.authenticateUser, question_controller_1.deleteQuestionHandler);
router.get("/answers/:questionId", auth_middleware_1.authenticateUser, question_controller_1.getQuestionWithAnswers);
exports.default = router;
