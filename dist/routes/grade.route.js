"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const grade_controller_1 = require("../controllers/grade.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get("/:gradeId", grade_controller_1.getGradeByIdHandler);
router.get("/:gradeId/students", auth_middleware_1.authenticateUser, grade_controller_1.getStudentsByGradeIdHandler);
router.get("/:gradeId/notifications", auth_middleware_1.authenticateUser, grade_controller_1.getNotificationsHandler);
exports.default = router;
