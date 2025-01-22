"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutHandler = exports.getAuthUserHandler = exports.loginHandler = void 0;
const __1 = require("..");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const loginHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // email and password
        // users will be already feeded in the db with their hashed passwords,email
        const { email, password } = req.body;
        if (email.trim() === "" || password.trim() === "") {
            res.status(400).json({
                success: false,
                message: "email and password required to login",
            });
            return;
        }
        // check if user with email exists in db
        const user = yield __1.prisma.user.findUnique({
            where: {
                email: email.trim().toLowerCase(),
            },
        });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "incorrect email or password",
            });
            return;
        }
        const hashedPassword = user.password;
        const isPasswordCorrect = yield bcrypt_1.default.compare(password, hashedPassword);
        if (!isPasswordCorrect) {
            res.status(400).json({
                success: false,
                message: "incorrect email or password",
            });
            return;
        }
        // email and password are correct
        // create token with userId and JWT_SECRET
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "2d",
        });
        // user has logged in -> update last login
        yield __1.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(Date.now()),
            },
        });
        res
            .cookie("auth_token", token, {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 48,
        })
            .status(200)
            .json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error when logging in",
        });
    }
});
exports.loginHandler = loginHandler;
const getAuthUserHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "authenticated user id not found",
            });
            return;
        }
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "invalid user id",
            });
            return;
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error when getting auth user",
        });
    }
});
exports.getAuthUserHandler = getAuthUserHandler;
const logoutHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // to logout user needs to be loggedi n
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "authenticated user id not found",
            });
            return;
        }
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "invalid user id",
            });
            return;
        }
        res
            .clearCookie("auth_token", {
            httpOnly: true,
            path: "/",
            maxAge: 0,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
        })
            .status(200)
            .json({
            success: true,
            message: "user logged out successfully",
        });
    }
    catch (error) {
        console.log(error);
    }
});
exports.logoutHandler = logoutHandler;
