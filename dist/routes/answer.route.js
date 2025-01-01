"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const answer_controller_1 = require("../controllers/answer.controller");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.authenticateUser, answer_controller_1.createAnswerForQuestionHandler); // create possible answers for a question with this enpoint
router.patch("/correct-answer/:answerId", auth_middleware_1.authenticateUser, answer_controller_1.updateCorrectAnswerHandler);
router.delete("/:answerId", auth_middleware_1.authenticateUser, answer_controller_1.deleteAnswerHandler);
exports.default = router;
