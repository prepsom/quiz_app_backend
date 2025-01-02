"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const level_controller_1 = require("../controllers/level.controller");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.authenticateUser, level_controller_1.addLevelHandler);
router.get("/:subjectId", auth_middleware_1.authenticateUser, level_controller_1.getLevelsBySubjectHandler);
router.delete("/:levelId", auth_middleware_1.authenticateUser, level_controller_1.deleteLevelHandler);
router.put("/:levelId", auth_middleware_1.authenticateUser, level_controller_1.updateLevelHandler);
router.get("/:levelId/results", auth_middleware_1.authenticateUser, level_controller_1.getLevelResultsHandler);
exports.default = router;
