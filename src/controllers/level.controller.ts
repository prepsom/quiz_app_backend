import { json, Request, Response } from "express";
import { openai, prisma } from "..";
import { $Enums, Question, QuestionResponse } from "@prisma/client";

type AddLevelRequestBody = {
  levelName: string;
  subjectId: string;
  passingQuestions: number;
};

type UpdateLevelRequestBody = {
  newLevelName: string;
};

const addLevelHandler = async (req: Request, res: Response) => {
  // who can add levels -> teachers
  try {
    const userId = req.userId;
    const { levelName, subjectId, passingQuestions } =
      req.body as AddLevelRequestBody;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role === "STUDENT") {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
      return;
    }

    // CAN ONLY ADD A LEVEL IF THE TEACHER TEACHES THE GRADE WHICH HAS  THE SUBJECT HE/SHE IS ADDING A LEVEL TO
    if (user.role === "TEACHER") {
      const teachesGrade = await prisma.teacherGrade.findFirst({
        where: { teacherId: user.id, gradeId: subject.gradeId },
      });
      if (!teachesGrade) {
        res.status(401).json({
          success: false,
          message: "teacher cannot add level in this subject",
        });
        return;
      }
    }

    if (passingQuestions < 0) {
      res.status(400).json({
        success: false,
        message: "passing questions cannot be negative",
      });
      return;
    }

    // teacher can add a level
    const highestPosition = await prisma.level
      .findMany({
        where: { subjectId: subject.id },
        orderBy: {
          position: "desc",
        },
        take: 1,
      })
      .then((levels) => levels[0]?.position ?? -1);

    const newLevel = await prisma.level.create({
      data: {
        levelName: levelName,
        position: highestPosition + 1,
        subjectId: subject.id,
        passingQuestions: passingQuestions,
      },
    });

    res.status(201).json({
      success: true,
      message: "Level added successfully",
      level: newLevel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Intenral server error when adding a level",
    });
  }
};

const getLevelsBySubjectHandler = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params as { subjectId: string };
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return;
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      return;
    }

    // subject exists to get levels for that subject
    // can only read levels if
    // if user student then the grade that the subject is in has to match user's grade
    // if user is teacher then teacher has to teach the grade that the subject is in
    if (user.role === "STUDENT") {
      if (user.gradeId !== subject.gradeId) {
        res.status(401).json({
          success: false,
          message: "",
        });
        return;
      }
    }

    if (user.role === "TEACHER") {
      const teachesGrade = await prisma.teacherGrade.findFirst({
        where: { teacherId: user.id, gradeId: subject.gradeId },
      });
      if (!teachesGrade) {
        res.status(401).json({
          success: false,
          message: "teacher cannot read levels of this subject",
        });
        return;
      }
    }

    const levels = await prisma.level.findMany({
      where: { subjectId: subject.id },
      orderBy: { position: "asc" },
    });

    res.status(200).json({
      success: true,
      levels,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when fetching levels for a subject",
    });
  }
};

const deleteLevelHandler = async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params as { levelId: string };
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "STUDENT") {
      res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
      return;
    }

    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: { subject: true },
    });
    if (!level) {
      res.status(404).json({
        success: false,
        message: "Level not found.",
      });
      return;
    }

    const gradeId = level.subject.gradeId; // grade in which the level is in

    if (user.role === "TEACHER") {
      const teachesGrade = await prisma.teacherGrade.findFirst({
        where: { teacherId: user.id, gradeId: gradeId },
      });
      if (!teachesGrade) {
        res.status(401).json({
          success: false,
          message:
            "Teacher is not authorized to delete levels of this subject.",
        });
        return;
      }
    }

    await prisma.level.delete({ where: { id: level.id } });
    res.status(200).json({
      success: true,
      message: "Level deleted successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting the level.",
    });
  }
};

const updateLevelHandler = async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params as { levelId: string };
    const { newLevelName } = req.body as UpdateLevelRequestBody;
    const userId = req.userId;

    // complete this update level handler
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "STUDENT") {
      res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
      return;
    }

    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: { subject: true },
    });
    if (!level) {
      res.status(404).json({
        success: false,
        message: "Level not found.",
      });
      return;
    }

    const gradeId = level.subject.gradeId; // Grade in which the level is present
    if (user.role === "TEACHER") {
      const teachesGrade = await prisma.teacherGrade.findFirst({
        where: { teacherId: user.id, gradeId },
      });
      if (!teachesGrade) {
        res.status(403).json({
          success: false,
          message:
            "Teacher is not authorized to update levels of this subject.",
        });
        return;
      }
    }

    const updatedLevel = await prisma.level.update({
      where: { id: level.id },
      data: { levelName: newLevelName.trim() },
    });

    res.status(200).json({
      success: true,
      message: "Level updated successfully.",
      level: updatedLevel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating the level",
    });
  }
};
type LevelResult = {
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  questionResults: {
    question: {
      id: string;
      questionTitle: string;
      questionHint: string | null;
      difficulty: $Enums.Difficulty;
      levelId: string;
      ready: boolean;
    };
    isCorrect: boolean;
    pointsEarned: number;
    responseTime: number;
  }[];
};

const getLevelResultsHandler = async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params as { levelId: string };
    const userId = req.userId;

    // get results for questions answered in a level by the user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });

      return;
    }

    const level = await prisma.level.findUnique({ where: { id: levelId } });
    if (!level) {
      res.status(400).json({
        success: false,
        message: "level not found",
      });

      return;
    }

    const responses = await prisma.questionResponse.findMany({
      where: {
        responderId: user.id,
        question: {
          levelId: level.id,
        },
      },
      include: {
        question: true,
      },
    });

    if (responses.length === 0) {
      res.status(404).json({
        success: false,
        message: "No results found for this level",
      });
      return;
    }

    const result: LevelResult = {
      totalPoints: responses.reduce((sum, r) => sum + r.pointsEarned, 0),
      correctAnswers: responses.filter((r) => r.isCorrect).length,
      totalQuestions: responses.length,
      questionResults: responses.map((r) => {
        return {
          question: r.question,
          isCorrect: r.isCorrect,
          pointsEarned: r.pointsEarned,
          responseTime: r.responseTime,
        };
      }),
    };

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error in getLevelResultsHandler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error when fetching level results",
    });
  }
};

const getLevelQuestions = async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params as { levelId: string };
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: {
        subject: true,
      },
    });
    if (!level) {
      res.status(400).json({
        success: false,
        message: "level not  found",
      });
      return;
    }
    const gradeId = level.subject.gradeId;

    if (user.role === "STUDENT") {
      if (user.gradeId !== gradeId) {
        res.status(401).json({
          success: false,
          message: "user not authorized to get questions for this grade",
        });
        return;
      }
    }

    if (user.role === "TEACHER") {
      //
      const teachesGrade = await prisma.teacherGrade.findFirst({
        where: { teacherId: user.id, gradeId: gradeId },
      });
      if (!teachesGrade) {
        res.status(401).json({
          success: false,
          message: "teacher not authorized to get questions for this grade",
        });
        return;
      }
    }

    // get all questions in a level and the question id's user has made responses to
    const allQuestions = await prisma.question.findMany({
      where: { levelId: level.id, ready: true },
    });
    const answeredQuestions = await prisma.question.findMany({
      where: {
        levelId: level.id,
        ready: true,
        QuestionResponse: {
          some: {
            responderId: user.id,
          },
        },
      },
      include: {
        QuestionResponse: {
          select: {
            pointsEarned: true,
            responderId: true,
          },
        },
      },
    });

    let currentPointsEarnedInLevel = 0;

    for (let i = 0; i < answeredQuestions.length; i++) {
      const answeredQuestionResponses = answeredQuestions[i].QuestionResponse;
      for (let k = 0; k < answeredQuestionResponses.length; k++) {
        if (answeredQuestionResponses[k].responderId === user.id) {
          currentPointsEarnedInLevel =
            currentPointsEarnedInLevel +
            answeredQuestionResponses[k].pointsEarned;
          break;
        }
      }
    }

    console.log(currentPointsEarnedInLevel);

    const answeredQuestionIds = answeredQuestions.map(
      (question) => question.id
    );

    res.status(200).json({
      success: true,
      allQuestions,
      answeredQuestionIds,
      currentPointsInLevel: currentPointsEarnedInLevel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting questions for a level",
    });
  }
};

const getLevelById = async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params as { levelId: string };
    const level = await prisma.level.findUnique({ where: { id: levelId } });
    if (!level) {
      res.status(400).json({
        success: false,
        message: "level not found",
      });
      return;
    }

    res.status(200).json({ success: true, level });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting level by id",
    });
  }
};

interface QuestionWithResponses extends Question {
  MCQAnswers: any[];
  BlankAnswers: any[];
  MatchingPairs: any[];
  QuestionResponse: QuestionResponse[];
}

interface QuestionAnalysis {
  question: QuestionWithResponses;
  questionResponseByUser: QuestionResponse | null;
  wasCorrect: boolean;
}
const completeLevelHandler = async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params as { levelId: string };
    const { answeredQuestionsInLevel } = req.body as {
      answeredQuestionsInLevel: string[];
    }; // answered questions in level id's
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    // Fetch level with all question types and their responses
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      include: {
        Questions: {
          where: { ready: true },
          include: {
            MCQAnswers: true,
            BlankAnswers: true,
            BlankSegments: true,
            MatchingPairs: true,
            QuestionResponse: {
              where: { responderId: userId },
            },
          },
        },
      },
    });

    if (!level) {
      res.status(400).json({
        success: false,
        message: "level not found",
      });
      return;
    }

    const totalAnsweredQuestionsInLevel = answeredQuestionsInLevel.length;
    if (totalAnsweredQuestionsInLevel === 0 || level.Questions.length === 0) {
      res.status(400).json({
        success: false,
        message: "no questions in level, user cannot complete level",
      });
      return;
    }

    // every answered question id should exist in the level.
    const answeredQuestions = await Promise.all(
      answeredQuestionsInLevel.map(async (answeredQuestionId: string) => {
        const questionInLevel = await prisma.question.findUnique({
          where: { id: answeredQuestionId },
        });
        if (!questionInLevel) {
          throw new Error("Invalid answered question id");
        }

        if (questionInLevel.levelId !== level.id)
          throw new Error("answered question not in level");

        return questionInLevel;
      })
    );

    // go through each answered question and filter from the totalquestion arr the question with id = currentAnswerId
    const answeredQuestionsWithResponse = answeredQuestions.map(
      (answeredQuestion) => {
        const answeredQuestionWithResponse = level.Questions.find(
          (question) => question.id === answeredQuestion.id
        );
        return answeredQuestionWithResponse;
      }
    );

    // Analyze each question's response
    // Analyze answered questions response
    const questionAnalysis = answeredQuestionsWithResponse.map(
      (answeredQuestionWithResponse) => {
        return {
          question: answeredQuestionWithResponse,
          questionResponseByUser:
            answeredQuestionWithResponse?.QuestionResponse !== undefined
              ? answeredQuestionWithResponse.QuestionResponse[0]
              : null,
          wasCorrect:
            answeredQuestionWithResponse?.QuestionResponse[0].isCorrect,
        };
      }
    );

    const noOfCorrectQuestions = questionAnalysis.filter(
      (qa) => qa.wasCorrect
    ).length;
    const totalPointsEarnedInLevel = questionAnalysis.reduce(
      (total, qa) => total + (qa.questionResponseByUser?.pointsEarned || 0),
      0
    );

    const percentage = Math.fround(
      (noOfCorrectQuestions / totalAnsweredQuestionsInLevel) * 100
    );

    console.log("No Of Correct questions :- ", noOfCorrectQuestions);

    const isComplete = noOfCorrectQuestions >= level.passingQuestions;

    // Prepare data for OpenAI
    const openAiMessages = questionAnalysis.map((qa) => ({
      ...qa.question,
      questionResponseByUser: qa.questionResponseByUser,
      wasCorrect: qa.wasCorrect,
      questionType: qa.question?.questionType,
    }));
    const openAIResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an assistant that provides feedback on user performance in a quiz. 
                        Analyze the user's responses across different question types (MCQ, Fill-in-blank, and Matching) 
                        and provide feedback on the conceptual clarity in the following JSON format:
                        {
                            "remarks": "Personalized remarks based on performance",
                            "strengths": ["Good hold on the topic of respiration", "strength2", ...],
                            "weaknesses": ["Weak in identifying process names", "weakness2", ...],
                            "recommendations": ["Recommend you to get a better understanding in reproductive systems", "recommendation2", ...]
                        }
                        Each array should typically contain 2-3 points in conceptual detail. Write remarks according to the performance. User
                        performance can be evaluated from the data you are receiving about questions and its respective responses and 
                        whether the response was correct or not.
                        Output JSON directly. DO NOT enclose within json
                        `,
        },
        {
          role: "user",
          content: JSON.stringify(openAiMessages),
        },
      ],
    });

    const feedback = openAIResponse.choices[0].message.content;
    console.log(feedback);
    let apiData: {
      remarks: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    } = {
      remarks: "",
      strengths: [],
      weaknesses: [],
      recommendations: [],
    };

    try {
      apiData = JSON.parse(feedback || "{}");
    } catch (parseError) {
      console.log("Failed to parse OpenAI response: ", parseError);

      apiData = {
        remarks: "Unable to generate detailed feedback",
        strengths: ["No specific strengths identified"],
        weaknesses: ["Unable to analyze performance"],
        recommendations: ["Review study materials"],
      };
    }

    console.log(apiData);

    if (!isComplete) {
      res.status(200).json({
        success: true,
        message: "user cannot complete this level. Get better",
        noOfCorrectQuestions,
        totalQuestions: totalAnsweredQuestionsInLevel,
        totalPointsEarnedInLevel,
        percentage,
        isComplete,
        strengths: apiData.strengths,
        weaknesses: apiData.weaknesses,
        recommendations: apiData.recommendations,
        remarks: apiData.remarks,
      });
      return;
    }

    // Handle level completion update
    const completedLevel = await prisma.userLevelComplete.findFirst({
      where: { userId: user.id, levelId: level.id },
    });

    if (completedLevel) {
      if (
        totalPointsEarnedInLevel >= completedLevel.totalPoints ||
        noOfCorrectQuestions >= completedLevel.noOfCorrectQuestions
      ) {
        await prisma.userLevelComplete.update({
          where: { id: completedLevel.id },
          data: {
            totalPoints: Math.max(
              totalPointsEarnedInLevel,
              completedLevel.totalPoints
            ),
            noOfCorrectQuestions: Math.max(
              noOfCorrectQuestions,
              completedLevel.noOfCorrectQuestions
            ),
            strengths: apiData.strengths,
            weaknesses: apiData.weaknesses,
            recommendations: apiData.recommendations,
          },
        });
      }
    } else {
      await prisma.userLevelComplete.create({
        data: {
          userId: user.id,
          levelId: level.id,
          noOfCorrectQuestions: noOfCorrectQuestions,
          totalPoints: totalPointsEarnedInLevel,
          strengths: apiData.strengths,
          weaknesses: apiData.weaknesses,
          recommendations: apiData.recommendations,
        },
      });
    }

    res.status(completedLevel ? 200 : 201).json({
      success: true,
      message: "Level completed",
      noOfCorrectQuestions,
      totalQuestions: totalAnsweredQuestionsInLevel,
      totalPointsEarnedInLevel,
      percentage,
      isComplete,
      strengths: apiData.strengths,
      weaknesses: apiData.weaknesses,
      recommendations: apiData.recommendations,
      remarks: apiData.remarks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "internal server error when completing level",
    });
  }
};

const getCompletedLevelsBySubjectHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { subjectId } = req.params as { subjectId: string };
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      res.status(400).json({
        success: false,
        message: "subject not found",
      });
      return;
    }

    // completed levels ,
    let completedLevelsByUser = await prisma.userLevelComplete.findMany({
      where: { userId: user.id },
      include: {
        level: true,
      },
    });

    // completedLevelsByUser -> includes all levels completed by user regardless of subject
    // allLevelsInSubject -> all levels in a subject duh
    let completedLevelsByUserInSubject = completedLevelsByUser
      .filter((completedLevel) => completedLevel.level.subjectId === subject.id)
      .map((completedLevel) => completedLevel.level);

    // sort by position
    completedLevelsByUserInSubject = completedLevelsByUserInSubject.sort(
      (a, b) => a.position - b.position
    );

    res.status(200).json({
      success: true,
      completedLevels: completedLevelsByUserInSubject,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting completed levels",
    });
  }
};

const getNextLevelHandler = async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params as { levelId: string };
    // the next level in terms of position to the level with id=levelId;

    const level = await prisma.level.findUnique({ where: { id: levelId } });
    if (!level) {
      res.status(400).json({
        success: false,
        message: "level not found",
      });
      return;
    }

    const currentLevelPosition = level.position;

    const nextLevels = await prisma.level.findMany({
      where: {
        subjectId: level.subjectId,
        position: { gt: currentLevelPosition },
      },
      orderBy: {
        position: "asc",
      },
    });
    const nextLevel = nextLevels.length !== 0 ? nextLevels[0] : null;

    res.status(200).json({
      success: true,
      nextLevel: nextLevel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting next level",
    });
  }
};

const getAllCompletedLevelsByUser = async (req: Request, res: Response) => {
  try {
    const COMPLETED_LEVELS_PER_PAGE = 10;
    const { page, limit } = req.query as { page: string; limit: string };
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const pageNum = page !== undefined && page !== "" ? parseInt(page) : 1;
    const limitNum =
      limit !== undefined && limit !== ""
        ? parseInt(limit)
        : COMPLETED_LEVELS_PER_PAGE;

    const skip = pageNum * limitNum - limitNum;

    console.log(page, limit);

    // we have the logged in user id , get all levels that have been completed by this user
    const completedLevelsByUser = await prisma.userLevelComplete.findMany({
      where: { userId: user.id },
      include: {
        level: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        level: {
          position: "asc",
        },
      },
      skip: skip,
      take: limitNum,
    });

    const completedLevelsWithScores = completedLevelsByUser.map((item) => {
      return {
        ...item.level,
        totalPoints: item.totalPoints,
        noOfCorrectQuestions: item.noOfCorrectQuestions,
        strengths: item.strengths,
        recommendations: item.recommendations,
        weaknesses: item.weaknesses,
      };
    });

    const totalCompletedLevelsByUserCount =
      await prisma.userLevelComplete.count({ where: { userId: user.id } });

    res.status(200).json({
      success: true,
      completedLevels: completedLevelsWithScores,
      noOfPages: Math.ceil(totalCompletedLevelsByUserCount / limitNum),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting completed levels",
    });
  }
};

const getAllCompletedLevelsByUserInSubject = async (
  req: Request,
  res: Response
) => {
  try {
    const COMPLETED_LEVELS_PER_PAGE = 10;
    const { limit, page } = req.query as { page: string; limit: string };
    const { subjectId } = req.params as { subjectId: string };
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const pageNum = page !== undefined && page !== "" ? parseInt(page) : 1;
    const limitNum =
      limit !== undefined && limit !== ""
        ? parseInt(limit)
        : COMPLETED_LEVELS_PER_PAGE;

    const skip = pageNum * limitNum - limitNum;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      res.status(400).json({
        success: false,
        message: "invalid subject id",
      });
      return;
    }

    // get completed levels with meta data in this subject.
    const completedLevelsByUser = await prisma.userLevelComplete.findMany({
      where: {
        userId: user.id,
        level: { subjectId: subject.id },
      },
      include: {
        level: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        level: {
          position: "asc",
        },
      },
      skip: skip,
      take: limitNum,
    });

    const completedLevelsInSubjectWithMetaData = completedLevelsByUser.map(
      (completedLevel) => {
        return {
          ...completedLevel.level,
          totalPoints: completedLevel.totalPoints,
          noOfCorrectQuestions: completedLevel.noOfCorrectQuestions,
          strengths: completedLevel.strengths,
          weaknesses: completedLevel.weaknesses,
          recommendations: completedLevel.recommendations,
        };
      }
    );

    const totalCompletedLevelsByUserInSubject =
      await prisma.userLevelComplete.count({
        where: {
          userId: user.id,
          level: {
            subjectId: subject.id,
          },
        },
      });

    res.status(200).json({
      success: true,
      completedLevelsInSubject: completedLevelsInSubjectWithMetaData,
      noOfPages: Math.ceil(totalCompletedLevelsByUserInSubject / limitNum),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting completed levels in subject",
    });
  }
};

export {
  addLevelHandler,
  getLevelsBySubjectHandler,
  deleteLevelHandler,
  updateLevelHandler,
  getLevelResultsHandler,
  getLevelQuestions,
  getLevelById,
  completeLevelHandler,
  getCompletedLevelsBySubjectHandler,
  getNextLevelHandler,
  getAllCompletedLevelsByUser,
  getAllCompletedLevelsByUserInSubject,
};
