import { Request, Response } from "express";
import { prisma } from "..";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

type LoginRequestBody = {
    email:string;
    password:string;
}

const loginHandler = async (req:Request,res:Response) => {
    try {
    // email and password
    // users will be already feeded in the db with their hashed passwords,email
    const {email,password} = req.body as LoginRequestBody;
    
    if(email.trim()==="" || password.trim()==="") {
        res.status(400).json({
            "success":false,
            "message":"email and password required to login"
        })
        return;
    }

    // check if user with email exists in db
    const user = await prisma.user.findUnique({where:{
        email:email.trim().toLowerCase(),
    }});
    
    if(!user) {
        res.status(400).json({
            "success":false,
            "message":"incorrect email or password"
        });
        return;
    }

    const hashedPassword = user.password;
    const isPasswordCorrect = await bcrypt.compare(password,hashedPassword);
    if(!isPasswordCorrect) {
        res.status(400).json({
            "success":false,
            "message":"incorrect email or password"
        });
        return;
    }    

    // email and password are correct
    // create token with userId and JWT_SECRET
    const token = jwt.sign({userId:user.id},process.env.JWT_SECRET as string,{
        expiresIn:"2d",
    });

    res.cookie("auth_token",token,{
        httpOnly:true,
        path:"/",
        secure:process.env.NODE_ENV==="production",
        sameSite:process.env.NODE_ENV==="production" ? "none" : "lax",
        maxAge:1000*60*60*48,
    }).status(200).json({
        "success":true,
        user,
    });
    } catch (error) {
       console.log(error);
       res.status(500).json({"success":false,"message":"internal server error when logging in"}); 
    }   
}

export {
    loginHandler,
}