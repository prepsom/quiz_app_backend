import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAndCreateLevel(
  gradeNumber: number,
  schoolName: string
): Promise<string | null> {
  try {
    // Step 1: Find the target school
    const school = await prisma.school.findFirst({
      where: { schoolName },
    });

    if (!school) throw new Error(`School "${schoolName}" not found.`);

    // Step 2: Find grade in that school
    const grade = await prisma.grade.findFirst({
      where: {
        grade: gradeNumber,
        schoolId: school.id,
      },
    });

    if (!grade)
      throw new Error(
        `Grade ${gradeNumber} not found in school "${schoolName}".`
      );

    // Step 3: Find all subjects in that grade and their levels
    const subjects = await prisma.subject.findMany({
      where: {
        gradeId: grade.id,
      },
      include: {
        Levels: true,
      },
    });

    // Step 4: Collect level IDs to delete
    const levelIds: string[] = subjects.flatMap((subject) =>
      subject.Levels.map((level) => level.id)
    );

    if (levelIds.length > 0) {
      await prisma.level.deleteMany({
        where: {
          id: { in: levelIds },
        },
      });
      console.log(
        `Deleted ${levelIds.length} levels from grade ${gradeNumber} of school "${schoolName}".`
      );
    } else {
      console.log(
        `No levels to delete for grade ${gradeNumber} in school "${schoolName}".`
      );
    }

    // Step 5: Find subject "Mathematics" with position 0 in the same grade
    const subject = await prisma.subject.findFirst({
      where: {
        subjectName: "Mathematics",
        position: 0,
        gradeId: grade.id,
      },
    });

    if (!subject)
      throw new Error(
        `Subject "Mathematics" with position 0 not found in grade ${gradeNumber}.`
      );

    // Step 6: Create a new level "Sets" in that subject
    const newLevel = await prisma.level.create({
      data: {
        levelName: "Sets",
        position: 0,
        passingQuestions: 6,
        subjectId: subject.id,
      },
    });

    console.log(
      `Created level "${newLevel.levelName}" under subject "${subject.subjectName}" for grade ${gradeNumber}.`
    );
    return newLevel.id;
  } catch (error) {
    console.error("Error:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Example usage:
clearAndCreateLevel(11, "PrepSOM School").then((levelId) => {
  console.log("Newly created level ID:", levelId);
});
