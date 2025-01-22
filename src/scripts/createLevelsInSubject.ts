import { prisma } from "..";

const createLevelsInSubject = async (subjectId: string) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new Error(`Subject with id ${subjectId} not found`);
      return;
    }

    // if levels already in subject then get highest level , levle with highest position
    const highestLevel = await prisma.level.findMany({
      where: { subjectId: subject.id },
      orderBy: { position: "desc" },
      take: 1,
    });

    const highestPosition =
      highestLevel.length === 1 ? highestLevel[0].position : -1;

    const levelsData: {
      levelName: string;
      levelDescription: string;
      passingQuestions: number;
    }[] = [
      {
        levelName: "Microorganisms",
        levelDescription: "",
        passingQuestions: 10,
      },
      {
        levelName: "Combustion and flame",
        levelDescription: "",
        passingQuestions: 10,
      },
      {
        levelName: "Conservation",
        levelDescription: "",
        passingQuestions: 10,
      },
      {
        levelName: "Reproduction in animals",
        levelDescription: "",
        passingQuestions: 10,
      },
      {
        levelName: "Reaching the adolescence",
        levelDescription: "",
        passingQuestions: 10,
      },
      {
        levelName: "Force and Pressure",
        levelDescription: "",
        passingQuestions: 10,
      },
      {
        levelName: "Sound",
        levelDescription: "",
        passingQuestions: 10,
      },
      {
        levelName: "Electric current",
        levelDescription: "",
        passingQuestions: 10,
      },
      {
        levelName: "Natural Phenomena",
        levelDescription: "",
        passingQuestions: 10,
      },
      {
        levelName: "Lighting",
        levelDescription: "",
        passingQuestions: 10,
      },
    ];

    let currentLevelPosition = highestPosition + 1;

    const dbLevelsData: {
      levelName: string;
      levelDescription: string;
      position: number;
      subjectId: string;
      passingQuestions: number;
    }[] = levelsData.map((levelData) => {
      const returnObject = {
        ...levelData,
        position: currentLevelPosition,
        subjectId: subject.id,
      };

      currentLevelPosition++;

      return returnObject;
    });

    await prisma.level.createMany({ data: dbLevelsData });

    console.log(`LEVELS added in subject ${subject.subjectName}`);
  } catch (error) {
    console.log(`failed to add levels in subject with id ${subjectId}`);
    throw new Error(`failed to add levels in subject with id ${subjectId}`);
  }
};

createLevelsInSubject(process.argv[2])
  .then(() => console.log("SUCCESSFULLY ADDED levels in subject"))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
