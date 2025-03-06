"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMessage = void 0;
const sanitizeMessage = (req, res, next) => {
    if (!req.body.messageText || typeof req.body.messageText !== "string") {
        res.status(400).json({ success: false, message: "Invalid message format" });
        return;
    }
    req.body.messageText = req.body.messageText.trim().slice(0, 1000); // Limit message length
    next();
};
exports.sanitizeMessage = sanitizeMessage;
