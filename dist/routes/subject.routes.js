"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const subject_controller_1 = require("../controllers/subject.controller");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.authenticateUser, subject_controller_1.addSubjectByGradeHandler); // role = admin | teacher
router.get("/", auth_middleware_1.authenticateUser, subject_controller_1.getSubjectsByGradeHandler); // get subjects from whatever grade the authenticated user is in 
exports.default = router;
