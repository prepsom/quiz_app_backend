import { prisma } from "..";
import { GRADES } from "../constants";
import bcrypt from "bcrypt"


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
    avatar:"MALE" | "FEMALE",
) => {
    // passwords are in plain string () 
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
    
        const newUser = await prisma.user.create({data:{
            email:email.trim().toLowerCase(),
            gradeId:gradeId,
            avatar:avatar,
            role:role,
            name:name,
            password:hashedPassword,
        }});

        console.log('successfully seeded user in database');
    } catch (error) {
        console.log('FAILED TO SEED USER IN DATABASE :- ',error);
        throw error;
    }
}


// seed multiple users


export async function seedUsers() {
    const gradeId = "b4fcec63-e4bf-493f-9a20-99c3ff1e999d"
    const users = [
        {
            email: "teacher.smith@school.com",
            name: "John Smith",
            password: "teacher123",
            role: "TEACHER" as const,
            avatar: "MALE" as const
        },
        {
            email: "sarah.jones@school.com",
            name: "Sarah Jones",
            password: "teach456",
            role: "TEACHER" as const,
            avatar: "FEMALE" as const
        },
        {
            email: "alice.student@school.com",
            name: "Alice Johnson",
            password: "student123",
            role: "STUDENT" as const,
            avatar: "FEMALE" as const
        },
        {
            email: "bob.student@school.com",
            name: "Bob Wilson",
            password: "student456",
            role: "STUDENT" as const,
            avatar: "MALE" as const
        },
        {
            email: "emma.student@school.com",
            name: "Emma Brown",
            password: "student789",
            role: "STUDENT" as const,
            avatar: "FEMALE" as const
        }
    ];

    try {
        for(const user of users) {
            await seedUserInGrade(gradeId,user.email,user.name,user.password,user.role,user.avatar);
        }
        console.log('All users seeded successfully');
    } catch (error) {
        console.log('Error seeding users:- ',error);
        throw error;
    }
}