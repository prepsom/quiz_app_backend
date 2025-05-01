import { User } from "@prisma/client";
import { prisma } from "..";
import { GRADES } from "../constants";

const dbInit = async () => {
  try {
    // check if default school exists

    const existingSchool = await prisma.school.findFirst({
      where: { schoolName: "PrepSOM School" },
    });

    if (existingSchool !== null) {
      return;
    }

    const school = await prisma.school.create({ data: {} });
    // once school is created , add grades (1 - 12) to said school

    for (const grade of GRADES) {
      try {
        await prisma.grade.create({
          data: {
            grade: grade.grade,
            schoolId: school.id,
          },
        });
      } catch (error) {
        console.log(
          `FAILED TO ADD grade ${grade.grade} in school ${school.schoolName}`
        );
        throw new Error("database initialization failed");
      }
    }

    // grades added in the default school
    console.log("DEFAULT SCHOOL AND GRADES INITIALIZED SUCCESSFULLY");
  } catch (error: any) {
    console.log(error);
  }
};

dbInit()
  .then(() =>
    console.log("DB initialized with default school and grade successfully")
  )
  .catch((e) => {
    console.log("FAILED TO INITIALIZE DB");
    process.exit(1);
  });
