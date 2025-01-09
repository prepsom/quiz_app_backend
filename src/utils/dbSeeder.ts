import { prisma } from "..";
import { GRADES } from "../constants";
import bcrypt from "bcrypt"
import { readCsvStream } from "./csvParsing";
import { UsersCsvData } from "../types";
import { Level } from "@prisma/client";


async function isGradesDbEmpty() {
    const gradesCount = await prisma.grade.count();
    return gradesCount===0;
}

export async function dbInit() {
    try {
        const isGradesEmpty = await isGradesDbEmpty();

        if(!isGradesEmpty) {
            console.log('GRADES ALREADY SEEDED');
            return;
        }
        await prisma.grade.createMany({
            data:GRADES,
        });
        console.log('GRADES SEEDED SUCCESSFULLY');
    } catch (error) {
        console.log('ERROR SEEDING DATABASE ',error);
        throw error;
    }
}


// seed users to a grade 
const seedUserInGrade = async (
    gradeId:string,
    email:string,
    name:string,
    password:string,
    role:"STUDENT" | "TEACHER" | "ADMIN",
) => {
    // passwords are in plain string () 
    try {

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        if(role==="STUDENT") {
            await prisma.user.create({data:{
                email:email.trim().toLowerCase(),
                gradeId:gradeId,
                role:role,
                name:name,
                password:hashedPassword,
            }});
        } else if(role==="TEACHER") {
            await prisma.user.create({
                data:{
                    email:email.trim().toLowerCase(),
                    name,
                    password:hashedPassword,
                    role,
                    teacherGrades:{
                        create:{
                            gradeId
                        }
                    }
                }
            });
        }
        console.log('successfully seeded user in database');
    } catch (error) {
        console.log('FAILED TO SEED USER IN DATABASE :- ',error);
        throw error;
    }
}


// seed multiple users


export async function seedUsers(gradeNo:number,filePath:string) {

    const grade = await prisma.grade.findFirst({where:{grade:gradeNo}});
    if(!grade) {
        console.log(`grade ${gradeNo} doesn't exist in DB`);
        return;
    }

    const gradeId = grade.id;

    // read from csv files to add users in a grade 
    const usersData = await readCsvStream(filePath) as UsersCsvData[];
    const users:{
        email: string;
        name: string;
        password: string;
        role: "STUDENT" | "TEACHER" | "ADMIN";
    }[] = usersData.map((userData:UsersCsvData) => {
        return {
            // email , name , password , role
            "email":userData["Email ID"],
            "name":userData["Full Name"],
            "password":"1234@#A",
            "role":"STUDENT",
        };
    })

    try {
        for(const user of users) {

            const existingUser = await prisma.user.findUnique({
                where:{email:user.email.trim().toLowerCase()}
            });
            if(!existingUser) {
                await seedUserInGrade(gradeId,user.email,user.name,user.password,user.role);
                console.log(`Seeded new user:- ${user.email}`);
            } else {
                console.log(`Skipping existing user:- ${user.email}`);
            }
        }
        console.log('All users seeded successfully');
    } catch (error) {
        console.log('Error seeding users:- ',error);
        throw error;
    }
}


const seedLevelInSubject = async (subjectId:string,levelName:string,levelPassingQuestions:number) => {
    try {
        const highestPosition = await prisma.level.findMany({where:{subjectId:subjectId},orderBy:{
            position:"desc"
        },take:1}).then(levels => levels[0]?.position ?? -1);


        const newLevel = await prisma.level.create({data:{levelName:levelName,passingQuestions:levelPassingQuestions,position:highestPosition+1,subjectId:subjectId}});
        console.log('LEVEL CREATED WITH ID :- ',newLevel.id);
    } catch (error) {
        console.log('FAILED TO ADD LEVEL IN DB');
    }
}


export const seedLevelsInSubject = async (subjectId:string) => {
    try {
            
    const subject = await prisma.subject.findUnique({where:{id:subjectId}});
    if(!subject) {
        console.log("Subject doesn't exist to add level in");
        return;
    }

    type Level = {
        levelName:string;
        passingQuestions:number;
    }
    const levels:Level[] = [
        {
            levelName:"Control and Coordination",
            passingQuestions:5,
        },
        {
            levelName:"How Do Organisms Reproduce?",
            passingQuestions:5,
        },
        {
            levelName:"Heredity and Evolution",
            passingQuestions:5,
        },
        {
            levelName:"Our Environment",
            passingQuestions:5,
        },
        {
            levelName:"Sustainable Management of Natural Resources",
            passingQuestions:5,
        }
    ];

    for(let i=0;i<levels.length;i++) {
        const level = levels[i];
        await seedLevelInSubject(subject.id,level.levelName,level.passingQuestions);
    }
    } catch (error) {
        console.log('FAILED TO INSERT LEVELS IN DB :- ',error);
        throw error;
    }
} 