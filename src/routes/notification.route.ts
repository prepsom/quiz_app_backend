

import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { addNotificationHandler, getNotificationsHandler, removeNotificationHandler, updateNotificationHandler } from "../controllers/notification.controller";

const router = express.Router();

router.get("/notifications/:gradeId",authenticateUser,getNotificationsHandler);
router.delete("/:notificationId",authenticateUser,removeNotificationHandler);
router.put("/:notificationId",authenticateUser,updateNotificationHandler);
router.post("/:gradeId",authenticateUser,addNotificationHandler);


export default router;


