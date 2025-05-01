import { NextFunction, Request, Response } from "express";

const sanitizeMessage = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.messageText || typeof req.body.messageText !== "string") {
    res.status(400).json({ success: false, message: "Invalid message format" });
    return;
  }

  req.body.messageText = req.body.messageText.trim().slice(0, 1000); // Limit message length
  next();
};

// Then add this middleware to your route

export { sanitizeMessage };
