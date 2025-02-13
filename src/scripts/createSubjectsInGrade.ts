import { prisma } from "..";

export const seedSubjectsInGrade = async (
  gradeNumber: number,
  schoolName: string
) => {
  try {
    const school = await prisma.school.findFirst({
      where: { schoolName: schoolName.trim() },
    });

    if (!school) {
      console.log(`School with ${schoolName.trim()} not found`);
      return;
    }

    const grade = await prisma.grade.findFirst({
      where: { grade: gradeNumber, schoolId: school.id },
    });
    if (!grade) {
      console.log(`Grade ${gradeNumber} not found`);
      return;
    }

    const subjects: string[] = ["Science", "Mathematics"];

    await prisma.subject.createMany({
      data: subjects.map((subject: string) => {
        return {
          subjectName: subject,
          gradeId: grade.id,
        };
      }),
    });
    await prisma.notification.create({
      data:{
        gradeId:grade.id,
        message:`${subjects.length} new subjects added!`
      }
    })
    console.log(`Subjects added in grade with id ${grade.id}`);
  } catch (error) {
    console.log(error);
    throw new Error(`failed to add subjects in grade ${gradeNumber}`);
  }
};

seedSubjectsInGrade(parseInt(process.argv[2]), process.argv[3])
  .then(() => console.log("SUBJECTS SUCCESSFULLY ADDED IN GRADE"))
  .catch((e) => process.exit(1));
