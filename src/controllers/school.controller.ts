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

export { getSchoolNameByGradeHandler };
