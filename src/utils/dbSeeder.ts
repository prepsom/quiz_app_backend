// when the server initially starts up for the first time , we
// need to create a default school if not already created.
// once created , we need to add grades from 1 - 12 in the said school.

import { User } from "@prisma/client";
import { prisma } from "..";
import { GRADES } from "../constants";
import bcrypt from "bcrypt";

// dbInit function adds default school if it doesn't exist and then adds grades to it.
export const dbInit = async () => {
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

// create a script to add a school to the schools database and after
// adding it create grades in the newly created school.

export const createSchoolAndAddGrades = async (schoolName: string) => {
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
  }
};

const seedUserInGrades = async (
  gradeIdArr: string[],
  email: string,
  name: string,
  password: string,
  role: "STUDENT" | "TEACHER" | "ADMIN",
  avatar: "MALE" | "FEMALE"
) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user: User;
    if (role === "STUDENT") {
      if (gradeIdArr.length > 1) {
        console.log("USER CANNOT HAVE MORE THAN 1 GRADE");
        return;
      }

      user = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          avatar: avatar,
          gradeId: gradeIdArr[0],
          name: name,
          role: role,
        },
      });

      console.log(`${user.role} with email ${user.email} added`);
    } else if (role === "TEACHER") {
      // create a entry in users table along with
      // a teacher can teach multiple grades.
      user = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          avatar: avatar,
          name: name,
          role: role,
          teacherGrades: {
            createMany: {
              data: gradeIdArr.map((gradeId: string) => {
                return {
                  gradeId: gradeId,
                };
              }),
            },
          },
        },
      });

      console.log(`${user.role} with email ${user.email} added`);
    } else {
      user = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          name: name,
          password: hashedPassword,
          avatar: avatar,
          role: role,
        },
      });

      console.log(`${user.role} with ${user.email} added`);
    }
  } catch (error) {
    console.log("FAILED TO SEED USER IN THE DATABASE:- ", error);
  }
};

// seed users in a school in a particular grade ()

export const seedUsersInGrade = async (
  gradeNumber: number,
  schoolName: string
) => {
  try {
    // seeding users in a particular school's grade

    // get school with the particular school name (it should be exact)
    // get a grade with the particular gradeNumber mentioned (example 4) in the school

    // add users in the selected grade

    const school = await prisma.school.findFirst({
      where: { schoolName: schoolName.trim() },
    });

    if (!school) {
      console.log(`SCHOOL with ${schoolName} not found to seed users in`);
      return;
    }

    const grade = await prisma.grade.findFirst({
      where: { schoolId: school.id, grade: gradeNumber },
    });

    if (!grade) {
      console.log(`GRADE ${gradeNumber} in ${school.schoolName} not found`);
      return;
    }

    // add list of users
    const usersList: {
      email: string;
      password: string;
      name: string;
      role: "STUDENT" | "TEACHER" | "ADMIN";
      avatar: "MALE" | "FEMALE";
      gradeId?: string;
    }[] = [
      {
        email: "alice.student@school.com",
        name: "Alice Johnson",
        password: "student123",
        role: "STUDENT",
        avatar: "FEMALE",
        gradeId: grade.id,
      },
      {
        email: "bob.student@school.com",
        name: "Bob Johnson",
        password: "student456",
        role: "STUDENT",
        avatar: "MALE",
        gradeId: grade.id,
      },
      {
        email: "sarah.smith@school.com",
        name: "Sarah Smith",
        password: "secure789",
        role: "STUDENT",
        avatar: "FEMALE",
        gradeId: grade.id,
      },
      {
        email: "michael.chen@school.com",
        name: "Michael Chen",
        password: "secure101",
        role: "STUDENT",
        avatar: "MALE",
        gradeId: grade.id,
      },
      {
        email: "emma.davis@school.com",
        name: "Emma Davis",
        password: "secure202",
        role: "TEACHER",
        avatar: "FEMALE",
        gradeId: grade.id,
      },
      {
        email: "james.wilson@school.com",
        name: "James Wilson",
        password: "secure303",
        role: "STUDENT",
        avatar: "MALE",
        gradeId: grade.id,
      },
      {
        email: "diana.brown@school.com",
        name: "Diana Brown",
        password: "secure404",
        role: "ADMIN",
        avatar: "FEMALE",
      },
    ];

    for (const user of usersList) {
      try {
        await seedUserInGrades(
          user.gradeId !== undefined ? [user.gradeId] : [],
          user.email,
          user.name,
          user.password,
          user.role,
          user.avatar
        );
      } catch (error) {
        console.log(error);
        throw new Error(`FAILED to seed user with email  ${user.email} in DB`);
      }
    }
    console.log(`SEEDED USERS IN GRADE ${gradeNumber} in school ${schoolName}`);
  } catch (error) {
    console.log("FAILED TO SEED USERS IN DATABASE :- ", error);
  }
};
