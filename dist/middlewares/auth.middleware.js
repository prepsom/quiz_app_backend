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
exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // user logs in -> cookie -> token 
    // logged in user tries to access -> sends cookies -> 
    // middleware checks for cookies
    // verifys the auth_token with jwt_Secret and extracts payload 
    if (!((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.auth_token)) {
        res.status(401).json({
            "success": false,
            "message": "user not authenticated",
        });
        return;
    }
    const tokenString = (_b = req.cookies) === null || _b === void 0 ? void 0 : _b.auth_token;
    const decodedPayload = jsonwebtoken_1.default.verify(tokenString, process.env.JWT_SECRET);
    const userId = decodedPayload.userId;
    req.userId = userId;
    next();
});
exports.authenticateUser = authenticateUser;
