import { Request, Response } from "express";
import { prisma } from "..";

const getSchoolNameByGradeHandler = async (req: Request, res: Response) => {
  try {
    const { gradeId } = req.params as { gradeId: string };
    const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
    if (!grade) {
      res.status(400).json({ success: false, message: "invalid grade id" });
      return;
    }

    const schoolId = grade.schoolId;
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      // invalid reference in db , schoolId references to school table primary key but not available
      throw new Error(
        "Invalid reference between grades and schools table in DB"
      );
    }

    res.status(200).json({ success: true, schoolName: school.schoolName });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting school name",
    });
  }
};

const getSchoolBySchoolNameHandler = async (req: Request, res: Response) => {
  try {
    const { schoolName } = req.params as { schoolName: string };
    if (!schoolName.trim()) {
      res
        .status(400)
        .json({ success: false, message: "school name is empty of undefined" });
      return;
    }

    const school = await prisma.school.findFirst({
      where: { schoolName: schoolName.trim() },
    });
    if (!school) {
      res.status(400).json({
        success: false,
        message: `school with name ${schoolName.trim()} not found`,
      });
      return;
    }

    res.status(200).json({ success: true, school });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const getSchoolsHandler = async (req: Request, res: Response) => {
  try {
    const schools = await prisma.school.findMany();
    res.status(200).json({ success: true, schools });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const getGradesBySchoolHandler = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params as { schoolId: string };

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        Grade: {
          include: {
            _count: { select: { students: true } },
          },
          orderBy:{grade:"asc"}
        },
      },
    });

    if (!school) {
      res.status(400).json({ success: false, message: "school not found" });
      return;
    }

    const grades = school.Grade;

    res.status(200).json({ success: true, grades: grades });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const getSchoolByIdHandler = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params as { schoolId: string };

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      res.status(400).json({ success: false, message: "school not found" });
      return;
    }

    res.status(200).json({ success: true, school });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

export {
  getSchoolNameByGradeHandler,
  getSchoolBySchoolNameHandler,
  getSchoolsHandler,
  getGradesBySchoolHandler,
  getSchoolByIdHandler,
};
