import bcrypt from "bcrypt"
import { prisma } from ".."




const createTeacherUser = async (email:string,password:string,name:string,avatar:"MALE" | "FEMALE",schoolName:string,grades:number[]) => {
    
    // create a user with role teacher in grades for ex (8,9,10) of the school with name "schoolName"
    // 1. check if the user with email already exists
    // 2.check if school with name "schoolName" exists
    // check if the grades in the school have grades 8,9,10 
    // get their gradeids
    // create a user with role teache in the grades with gradeids
    const existingUser = await prisma.user.findUnique({where:{email:email.trim().toLowerCase()}});
    if(existingUser) {
        throw new Error("User with email already exists");
    }

    const school = await prisma.school.findFirst({where:{schoolName:schoolName.trim()},include:{
        Grade:true,
    }});
    if(!school) {
        throw new Error(`School with name ${schoolName.trim()} doesn't exist`);
    }

    const teacherGrades = grades;


    const teacherGradeIds = school.Grade.filter((grade) => teacherGrades.includes(grade.grade)).map((grade) => grade.id);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);

    const teacher = await prisma.user.create({
        data:{
            email:email.trim().toLowerCase(),
            password:hashedPassword,
            avatar:avatar,
            name:name.trim(),
            role:"TEACHER",
            schoolName:school.schoolName,
            teacherGrades:{
                createMany:{
                    data:teacherGradeIds.map((gradeId) => {
                        return {
                            gradeId:gradeId,
                        }
                    })
                }
            },
        }
    });
}



createTeacherUser(process.argv[2],
    process.argv[3],
    process.argv[4],
    process.argv[5] as "MALE" | "FEMALE",
    process.argv[6],
    [8,9,10]
).then(() => console.log('ADDED TEACHER')).catch((e) => console.log('FAILED TO ADD TEACHER:- ',e));

