"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = express_1.default.Router();
router.get("/notifications/:gradeId", auth_middleware_1.authenticateUser, notification_controller_1.getNotificationsHandler);
router.delete("/:notificationId", auth_middleware_1.authenticateUser, notification_controller_1.removeNotificationHandler);
router.put("/:notificationId", auth_middleware_1.authenticateUser, notification_controller_1.updateNotificationHandler);
router.post("/:gradeId", auth_middleware_1.authenticateUser, notification_controller_1.addNotificationHandler);
exports.default = router;
