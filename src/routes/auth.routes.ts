import express from "express"
import { loginHandler } from "../controllers/auth.controller";

const router = express.Router();

router.post("/login",loginHandler);

export default router;
