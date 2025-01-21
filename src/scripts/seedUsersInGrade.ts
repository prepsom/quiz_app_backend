import { User } from "@prisma/client";
import { prisma } from "..";
import bcrypt from "bcrypt";
import { parse } from "csv-parse";
import { CSVRow, readCSVFile } from "../utils/csvParsing";
import { generatePassword } from "../utils/generatePassword";
import { validateEmail } from "../utils/emailValidation";
import { sendEmaiL } from "../utils/sendEmail";

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

    await sendEmaiL(email, password);
    console.log(
      `email sent to ${email
        .trim()
        .toLowerCase()} for their PrepSOM Login Credentials`
    );
  } catch (error) {
    console.log("FAILED TO SEED USER IN THE DATABASE:- ", error);
  }
};

const readStudentsCsvData = async (csvPath: string) => {
  try {
    const data = await readCSVFile(csvPath);
    const studentsData: {
      email: string;
      name: string;
      role: "STUDENT" | "TEACHER" | "ADMIN";
      avatar: "MALE" | "FEMALE";
    }[] = data.map((data: CSVRow) => {
      return {
        email: data["Email ID (for Login)"],
        name: data["Full Name"],
        role: "STUDENT",
        avatar: data.Gender === "Male" ? "MALE" : "FEMALE",
      };
    });

    return studentsData;
  } catch (error) {
    console.log(error);
  }
};

export const seedUsersInGrade = async (
  gradeNumber: number,
  schoolName: string,
  csvPath: string
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

    const studentsCsvData = await readStudentsCsvData(csvPath);
    if (studentsCsvData === undefined)
      throw new Error("Cannot read CSV file in seeding users");

    // add list of users
    const usersList: {
      email: string;
      password: string;
      name: string;
      role: "STUDENT" | "TEACHER" | "ADMIN";
      avatar: "MALE" | "FEMALE";
      gradeId?: string;
    }[] = studentsCsvData.map((studentData) => {
      return {
        email: studentData.email,
        avatar: studentData.avatar,
        name: studentData.name,
        role: studentData.role,
        gradeId: grade.id,
        password: generatePassword(),
      };
    });

    for (const user of usersList) {
      try {
        // check if user with the current user's email already exists in db.
        // if yes then continue to next user.

        // validate email before inserting it in db or checking
        if (!validateEmail(user.email)) {
          console.log(
            `INVALID EMAIL , skipping record with invalid email ${user.email}`
          );
          continue;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email.trim().toLowerCase() },
        });
        if (existingUser !== null) {
          console.log(
            `SKIPPING user with email id ${user.email} as it already exists`
          );

          continue;
        }

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

    // if here then all users in the usersList were seeded
    // if all seeded successfully then send email to all of them with their login credentials.

    console.log(`SEEDED USERS IN GRADE ${gradeNumber} in school ${schoolName}`);
  } catch (error) {
    console.log("FAILED TO SEED USERS IN DATABASE :- ", error);
  }
};

// npm create-users-in-grade 8 schoolName csvPathForStudents
seedUsersInGrade(parseInt(process.argv[2]), process.argv[3], process.argv[4])
  .then(() => console.log("Sucessfully inserted users in grade of a school"))
  .catch((e) => process.exit(1));
