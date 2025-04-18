"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const school_controller_1 = require("../controllers/school.controller");
const router = express_1.default.Router();
router.get("/school-name/:gradeId", school_controller_1.getSchoolNameByGradeHandler);
router.get("/name/:schoolName", school_controller_1.getSchoolBySchoolNameHandler); //school/radiant
router.get("/:schoolId", school_controller_1.getSchoolByIdHandler);
router.get("/:schoolId/grades", school_controller_1.getGradesBySchoolHandler);
router.get("/", school_controller_1.getSchoolsHandler);
exports.default = router;
