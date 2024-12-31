import { NextFunction, Request, Response } from "express";
import jwt, { decode } from "jsonwebtoken"

declare global {
    namespace Express {
        interface Request {
            userId:string;
        }
    }
}


const authenticateUser = async (req:Request,res:Response,next:NextFunction) => {
    // user logs in -> cookie -> token 
    // logged in user tries to access -> sends cookies -> 
    // middleware checks for cookies
    // verifys the auth_token with jwt_Secret and extracts payload 
    if(!req.cookies?.auth_token) {
        res.status(401).json({
            "success":false,
            "message":"user not authenticated",
        });
        return;
    }
    const tokenString = req.cookies?.auth_token;
    const decodedPayload = jwt.verify(tokenString,process.env.JWT_SECRET as string) as {userId:string};
    const userId = decodedPayload.userId;
    req.userId = userId;
    next();
}
export  {
    authenticateUser,
}