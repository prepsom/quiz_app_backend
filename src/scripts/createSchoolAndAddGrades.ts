import { prisma } from "..";
import { GRADES } from "../constants";

const createSchoolAndAddGrades = async (schoolName: string) => {
  try {
    const existingSchool = await prisma.school.findFirst({
      where: { schoolName: schoolName.trim() },
    });
    if (existingSchool) {
      console.log(`SCHOOL with name ${schoolName.trim()} already exists`);
      return;
    }

    const school = await prisma.school.create({
      data: { schoolName: schoolName.trim() },
    });

    for (const grade of GRADES) {
      try {
        const gradeNumber = grade.grade;
        await prisma.grade.create({
          data: { grade: gradeNumber, schoolId: school.id },
        });
      } catch (error) {
        console.log(error);
        throw new Error(
          `FAILED TO ADD grade ${grade.grade} to ${school.schoolName}`
        );
      }
    }

    console.log(
      `CREATED SCHOOL ${school.schoolName} and added grades 1 to 12 to it`
    );
  } catch (error) {
    console.log(error);
    throw new Error("Failed to create school and add grades ");
  }
};
// 0          1                    2
// node dist/scripts/filename.js schoolName
createSchoolAndAddGrades(process.argv[2])
  .then(() => console.log("Successfully created school and added grades 1-12"))
  .catch((e) => process.exit(1));
