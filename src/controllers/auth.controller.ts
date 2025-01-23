import { Request, Response } from "express";
import { prisma } from "..";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

type LoginRequestBody = {
  email: string;
  password: string;
};

type RegisterRequestBody = {
  email: string;
  password: string;
  name: string;
  grade: number;
};

const loginHandler = async (req: Request, res: Response) => {
  try {
    // email and password
    // users will be already feeded in the db with their hashed passwords,email
    const { email, password } = req.body as LoginRequestBody;

    if (email.trim() === "" || password.trim() === "") {
      res.status(400).json({
        success: false,
        message: "email and password required to login",
      });
      return;
    }

    // check if user with email exists in db
    const user = await prisma.user.findUnique({
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

    const isPasswordCorrect = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordCorrect) {
      res.status(400).json({
        success: false,
        message: "incorrect email or password",
      });
      return;
    }

    // email and password are correct
    // create token with userId and JWT_SECRET
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "2d",
      }
    );

    // user has logged in -> update last login
    await prisma.user.update({
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
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when logging in",
    });
  }
};

const registerUserHandler = async (req: Request, res: Response) => {
  // any user registering will be part of the default prepsom school in their specified grade
  try {
    const { email, grade, name, password } = req.body as RegisterRequestBody;
    const defaultSchoolName = "PrepSOM School";

    const school = await prisma.school.findFirst({
      where: { schoolName: defaultSchoolName.trim() },
    });

    if (!school) {
      console.log("DEFAULT SCHOOL DOESNT EXIST");
      res.status(500).json({
        success: false,
        message: "internal server error when registering user",
      });
      return;
    }

    // get grade id for the particular grade the user wants to be a part of  in default school
    const gradeResult = await prisma.grade.findFirst({
      where: { grade: grade, schoolId: school.id },
    });
    if (!gradeResult) {
      res.status(400).json({
        success: false,
        message: `grade ${grade} not found in default school`,
      });
      return;
    }
    const gradeId = gradeResult.id;

    // check if user exists in db
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingUser) {
      res.status(400).json({ success: false, message: "user already exists" });
      return;
    }

    const saltRounds = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

    const newUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name,
        password: hashedPassword,
        gradeId: gradeId,
        role: "STUDENT",
      },
    });

    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "2d",
      }
    );
    res
      .cookie("auth_token", token, {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 48,
      })
      .json({
        success: true,
        user: newUser,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "intenral server error when registering",
    });
  }
};

const getAuthUserHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "authenticated user id not found",
      });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
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
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting auth user",
    });
  }
};

const logoutHandler = async (req: Request, res: Response) => {
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
    const user = await prisma.user.findUnique({ where: { id: userId } });
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
  } catch (error) {
    console.log(error);
  }
};

export { loginHandler, getAuthUserHandler, logoutHandler, registerUserHandler };
