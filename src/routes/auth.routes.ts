import express from "express"
import { getAuthUserHandler, loginHandler, logoutHandler } from "../controllers/auth.controller";
import { authenticateUser } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/login",loginHandler);
router.get("/user",authenticateUser,getAuthUserHandler);
router.get("/logout",authenticateUser,logoutHandler);


export default router;
