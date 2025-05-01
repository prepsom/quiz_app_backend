import { Request, Response } from "express";
import { prisma } from "..";
import { QuestionType, Difficulty, Prisma } from "@prisma/client";

type BaseQuestionResponse = {
  questionId: string;
  timeTaken: number;
};

type MCQResponse = BaseQuestionResponse & {
  type: "MCQ";
  selectedAnswerId: string;
};

type FillInBlankResponse = BaseQuestionResponse & {
  type: "FILL_IN_BLANK";
  answers: { blankIndex: number; value: string }[];
};

type MatchingResponse = BaseQuestionResponse & {
  type: "MATCHING";
  pairs: { leftItem: string; rightItem: string }[];
};

type QuestionResponseRequestBody =
  | MCQResponse
  | FillInBlankResponse
  | MatchingResponse;

const POINTS_MAP: Record<Difficulty, number> = {
  EASY: 10,
  MEDIUM: 15,
  HARD: 20,
};

const TIME_BONUS_THRESHOLD = 60; // seconds
const TIME_BONUS_POINTS = 2;

const answerQuestionHandler = async (req: Request, res: Response) => {
  try {
    const responseData = req.body as QuestionResponseRequestBody;
    const userId = req.userId;

    // Fetch user and question data with appropriate relations based on type
    const [user, question] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.question.findUnique({
        where: { id: responseData.questionId },
        include: {
          MCQAnswers: true,
          BlankAnswers: true,
          MatchingPairs: true,
        },
      }),
    ]);

    if (!user || !question) {
      res.status(400).json({
        success: false,
        message: !user ? "Invalid user ID" : "Question not found",
      });
      return;
    }

    // Validate response and calculate points based on question type
    const validationResult = await validateResponse(responseData, question);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: (validationResult as any).message || "",
      });
      return;
    }

    const pointsEarned = calculatePoints(
      validationResult.isCorrect,
      question.difficulty,
      responseData.timeTaken
    );

    // Update or create question response
    const existingResponse = await prisma.questionResponse.findFirst({
      where: { responderId: user.id, questionId: question.id },
    });

    const responsePayload: Prisma.QuestionResponseUncheckedCreateInput = {
      isCorrect: validationResult.isCorrect,
      pointsEarned,
      responseTime: responseData.timeTaken,
      chosenAnswerId:
        "selectedAnswerId" in responseData
          ? responseData.selectedAnswerId
          : null,
      responseData:
        "selectedAnswerId" in responseData ? null : (responseData as any),
      questionId: question.id,
      responderId: userId,
    };

    const questionResponse = existingResponse
      ? await prisma.questionResponse.update({
          where: { id: existingResponse.id },
          data: {
            ...responsePayload,
            createdAt: new Date(Date.now()),
          },
        })
      : await prisma.questionResponse.create({
          data: responsePayload,
        });

    res.status(existingResponse ? 200 : 201).json({
      success: true,
      message: "Response recorded successfully",
      questionResponse,
      correctData: validationResult.correctData,
    });
  } catch (error) {
    console.error("Error in answerQuestionHandler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error when responding to question",
    });
  }
};

const validateResponse = async (
  responseData: QuestionResponseRequestBody,
  question: any
) => {
  switch (responseData.type) {
    case "MCQ":
      return validateMCQResponse(responseData, question);
    case "FILL_IN_BLANK":
      return validateFillInBlankResponse(responseData, question);
    case "MATCHING":
      return validateMatchingResponse(responseData, question);
    default:
      return {
        success: false,
        message: "Invalid question type",
      };
  }
};

const validateMCQResponse = (response: MCQResponse, question: any) => {
  const selectedAnswer = question.MCQAnswers.find(
    (answer: any) => answer.id === response.selectedAnswerId
  );

  if (!selectedAnswer) {
    return {
      success: false,
      message: "Selected answer is not an option for the question",
    };
  }

  const correctAnswer = question.MCQAnswers.find(
    (answer: any) => answer.isCorrect
  );

  return {
    success: true,
    isCorrect: selectedAnswer.isCorrect,
    correctData: { correctAnswerId: correctAnswer?.id },
  };
};

const validateFillInBlankResponse = (
  response: FillInBlankResponse,
  question: any
) => {
  const correctAnswers = question.BlankAnswers;
  let isCorrect = true;

  // Group correct answers by blank index
  const correctAnswersByIndex = correctAnswers.reduce(
    (acc: any, answer: any) => {
      if (!acc[answer.blankIndex]) acc[answer.blankIndex] = [];
      acc[answer.blankIndex].push(answer.value.toLowerCase().trim());
      return acc;
    },
    {}
  );

  // Create a map of user answers for easy lookup
  const userAnswerMap = new Map(
    response.answers.map((answer) => [
      answer.blankIndex,
      answer.value.toLowerCase().trim(),
    ])
  );

  // Check if all required blanks are filled and correct
  for (const [blankIndex, correctValues] of Object.entries(
    correctAnswersByIndex
  )) {
    const userAnswer = userAnswerMap.get(parseInt(blankIndex));

    // If no answer provided for this blank or answer is incorrect
    if (!userAnswer || !(correctValues as string).includes(userAnswer)) {
      isCorrect = false;
      break;
    }
  }

  // Check if user provided answers for non-existent blanks
  for (const [blankIndex] of userAnswerMap) {
    if (!correctAnswersByIndex[blankIndex]) {
      isCorrect = false;
      break;
    }
  }

  return {
    success: true,
    isCorrect,
    correctData: { correctAnswers: correctAnswersByIndex },
  };
};

const validateMatchingResponse = (
  response: MatchingResponse,
  question: any
) => {
  const correctPairs = question.MatchingPairs;
  let isCorrect = true;

  // Convert correct pairs to a map for easy lookup
  const correctPairsMap = new Map(
    correctPairs.map((pair: any) => [
      pair.leftItem.toLowerCase().trim(),
      pair.rightItem.toLowerCase().trim(),
    ])
  );

  // Check each submitted pair
  response.pairs.forEach((pair) => {
    const correctRight = correctPairsMap.get(
      pair.leftItem.toLowerCase().trim()
    );
    if (correctRight !== pair.rightItem.toLowerCase().trim()) {
      isCorrect = false;
    }
  });

  return {
    success: true,
    isCorrect,
    correctData: { correctPairs },
  };
};

const calculatePoints = (
  isCorrect: boolean,
  difficulty: Difficulty,
  timeTaken: number
): number => {
  if (!isCorrect) return 0;

  let points = POINTS_MAP[difficulty];
  if (timeTaken <= TIME_BONUS_THRESHOLD) {
    points += TIME_BONUS_POINTS;
  }

  return points;
};

export { answerQuestionHandler };
