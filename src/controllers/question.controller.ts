import { Request, Response } from "express";
import { prisma } from "..";
import { Answer, Difficulty, Question, QuestionType } from "@prisma/client";

type BaseQuestionRequestBody = {
  difficulty: Difficulty;
  levelId: string;
  questionTitle: string;
  explanation: string;
  questionType: QuestionType;
};

type MCQQuestionRequestBody = BaseQuestionRequestBody & {
  questionType: "MCQ";
};

type FillBlankQuestionRequestBody = BaseQuestionRequestBody & {
  questionType: "FILL_IN_BLANK";
  segments: Array<{
    text: string;
    isBlank: boolean;
    blankHint?: string;
  }>;
  answers: Array<{
    value: string;
    blankIndex: number;
  }>;
};

type MatchingQuestionRequestBody = BaseQuestionRequestBody & {
  questionType: "MATCHING";
  pairs: Array<{
    leftItem: string;
    rightItem: string;
  }>;
};

type AddQuestionRequestBody =
  | MCQQuestionRequestBody
  | FillBlankQuestionRequestBody
  | MatchingQuestionRequestBody;

const getQuestionsByLevelHandler = async (req: Request, res: Response) => {
  // levelId and userId
  try {
    const { levelId } = req.params as { levelId: string };
    const userId = req.userId;
    const {filterByReady,page,limit,searchByTitle,filterByDifficulty,filterByQuestionType} = req.query as {filterByReady:"true" | "false";searchByTitle:string;filterByDifficulty:"EASY" | "MEDIUM" | "HARD";filterByQuestionType:"MCQ" | "FILL_IN_BLANK" | "MATCHING";page:string;limit:string};

    const isPagination = page!==undefined && limit!==undefined;

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
        message: "invalid level id",
      });
      return;
    }

    // level exists so can get questions under a level
    // if the user is a student then to see questions under a level
    // student has to be in the same grade the level is in
    const gradeId = level.subject.gradeId;
    if (user.role === "STUDENT" && user.gradeId !== gradeId) {
      res.status(401).json({
        success: false,
        message: "user cannot access questions for this level",
      });
      return;
    }

    // user is part of this grade here
    if (user.role === "TEACHER") {
      // teacher teaches this grade that the questions are in then its cool
      const teachesGrade = await prisma.teacherGrade.findFirst({
        where: { teacherId: user.id, gradeId: gradeId },
      });
      if (!teachesGrade) {
        res.status(401).json({
          success: false,
          message: "teacher cannot view questions of this grade",
        });
        return;
      }
    }

    // if the user is an admin or a teacher then they can see all questions else only ready questions
    const isFilterBySearchTitle = searchByTitle!==undefined ? true : false;
    const isFilterByDifficulty = filterByDifficulty!==undefined ? true : false;
    const isFilterByQuestionType = filterByQuestionType!==undefined ? true : false;

    type Response = {
      success:boolean;
      questions:Question[];
    }

    type PaginationResponse = Response & {
      totalPages:number;
      page:number;
      limit:number;
    }

    let response:Response | PaginationResponse;

    let questions = await prisma.question.findMany({where:{levelId:level.id}});

    if(isFilterBySearchTitle) {
      questions = questions.filter((question) => question.questionTitle.trim().toLowerCase().includes(searchByTitle.trim().toLowerCase()))
    }

    if(isFilterByDifficulty) {
      questions = questions.filter((question) => question.difficulty===filterByDifficulty);
    }

    if(isFilterByQuestionType) {
      questions = questions.filter((question) => question.questionType===filterByQuestionType);
    }

    // questions are filtered , now we paginate if page and limit are defined 
    if(isPagination) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;

      const skip = pageNum * limitNum - limitNum;
      const totalPages = Math.ceil(questions.length / limitNum);

      questions = questions.slice(skip,skip + limitNum);

      response = {
        success:true,
        questions:questions,
        totalPages:totalPages,
        page:pageNum,
        limit:limitNum
      } as PaginationResponse;
    } else {

      response = {
        success:true,
        questions:questions,
      } as Response;
    }

    
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting questions for a level",
    });
  }
};

/*

type PaginationResponse = Response & {
      totalPages:number;
      page:number;
      limit:number;
    }

    type Response = {
      success:boolean;
      questions:Question[];
    }

    let response:Response | PaginationResponse;
    
    let questions;
    let totalQuestionsCount = await prisma.question.count({where:{levelId:level.id}});
    // pagination first then filter
    if(isPagination) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = pageNum * limitNum - limitNum;
      const totalPages = Math.ceil(totalQuestionsCount / limitNum)
      questions = await prisma.question.findMany({
        where:{levelId:level.id},
        skip:skip,
        take:limitNum,
      });
    } else {
      questions = await prisma.question.findMany({
        where:{levelId:level.id},
      });
    }

    if(filterByReady!==undefined) {
      // filter by ready -> "true" | "false" , if "true" then ready:true else ready:false
      let ready:boolean = filterByReady==="true" ? true : false;
      questions = questions.filter((question) => question.ready===ready);
    } else {
      // filter by ready = undefined then fetch all questions if user is admin or teacher else fetch only ready questions 
      if(user.role==="STUDENT") {
        questions = questions.filter((question) => question.ready===true);
      }
    }

    if(isFilterBySearchTitle) {
      questions = questions.filter((question) => question.questionTitle.trim().toLowerCase().includes(searchByTitle.trim().toLowerCase()));
    }

    if(isFilterByDifficulty) {
      questions = questions.filter((question) => question.difficulty===filterByDifficulty);
    }

    if(isFilterByQuestionType) {
      questions = questions.filter((question) => question.questionType===filterByQuestionType);
    }

    if(isPagination) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = pageNum * limitNum - limitNum;
      const totalPages = Math.ceil(totalQuestionsCount / limitNum);
      response = {
        success:true,
        questions:questions,
        totalPages:totalPages,
        page:pageNum,
        limit:limitNum
      }
    } else {
      response = {
        success:true,
        questions:questions
      }
    }


*/

const isMCQQuestion = (
  data: AddQuestionRequestBody
): data is MCQQuestionRequestBody => {
  return data.questionType === "MCQ";
};

const isFillBlankQuestion = (
  data: AddQuestionRequestBody
): data is FillBlankQuestionRequestBody => {
  return data.questionType === "FILL_IN_BLANK";
};

const isMatchingQuestion = (
  data: AddQuestionRequestBody
): data is MatchingQuestionRequestBody => {
  return data.questionType === "MATCHING";
};

const addQuestionByLevelHandler = async (req: Request, res: Response) => {
  try {
    const requestData = req.body as AddQuestionRequestBody;
    const userId = req.userId;

    console.log(requestData);

    // Authorization checks remain the same
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "STUDENT") {
      res.status(401).json({
        success: false,
        message: "Only teachers can add questions",
      });
      return;
    }

    const level = await prisma.level.findUnique({
      where: { id: requestData.levelId },
      include: { subject: true },
    });

    if (!level) {
      res.status(401).json({
        success: false,
        message: "Invalid level id",
      });
      return;
    }

    // Teacher authorization check
    if (user.role === "TEACHER") {
      const teacherGrade = await prisma.teacherGrade.findFirst({
        where: {
          teacherId: userId,
          gradeId: level.subject.gradeId,
        },
      });
      if (!teacherGrade) {
        res.status(401).json({
          success: false,
          message: "Teacher cannot add questions to this grade's level",
        });
        return;
      }
    }

    // Validate request data based on question type
    if (isFillBlankQuestion(requestData)) {
      // Validate fill in blank specific data
      console.log(!requestData.segments);
      console.log(requestData.segments.length === 0);
      if (!requestData.segments || requestData.segments.length === 0) {
        res.status(400).json({
          success: false,
          message: "Fill in the blank questions must have at least one segment",
        });
        return;
      }
      if (!requestData.answers || requestData.answers.length === 0) {
        res.status(400).json({
          success: false,
          message: "Fill in the blank questions must have at least one answer",
        });
        return;
      }

      // Validate that answers correspond to blank segments
      const blankIndices = requestData.segments
        .map((segment, index) => (segment.isBlank ? index : -1))
        .filter((index) => index !== -1);

      const invalidAnswers = requestData.answers.some(
        (answer) => !blankIndices.includes(answer.blankIndex)
      );

      if (invalidAnswers) {
        res.status(400).json({
          success: false,
          message: "Answer indices must correspond to blank segments",
        });
        return;
      }
    }

    try {
      const isReady = validateReadyField(requestData);

      let question = null;
      if (isMCQQuestion(requestData)) {
        question = await prisma.question.create({
          data: {
            questionTitle: requestData.questionTitle,
            difficulty: requestData.difficulty,
            levelId: requestData.levelId,
            explanation: requestData.explanation,
            questionType: "MCQ",
            ready: false, // Use the validated ready value
          },
        });
      } else if (isFillBlankQuestion(requestData)) {
        console.log("FILL IN THE BLANK QUESTION CREATED");
        question = await prisma.question.create({
          data: {
            questionTitle: requestData.questionTitle,
            difficulty: requestData.difficulty,
            levelId: requestData.levelId,
            explanation: requestData.explanation,
            questionType: "FILL_IN_BLANK",
            ready: isReady, // Use the validated ready value
            BlankSegments: {
              createMany: {
                data: requestData.segments.map((segment, index) => ({
                  text: segment.text,
                  isBlank: segment.isBlank,
                  blankHint: segment.blankHint || null,
                  order: index,
                })),
              },
            },
            BlankAnswers: {
              createMany: {
                data: requestData.answers.map((answer) => ({
                  value: answer.value,
                  blankIndex: answer.blankIndex,
                  isCorrect: true,
                })),
              },
            },
          },
        });
      } else if (isMatchingQuestion(requestData)) {
        question = await prisma.question.create({
          data: {
            questionTitle: requestData.questionTitle,
            difficulty: requestData.difficulty,
            levelId: requestData.levelId,
            explanation: requestData.explanation,
            questionType: "MATCHING",
            ready: isReady, // Use the validated ready value
            MatchingPairs: {
              createMany: {
                data: requestData.pairs.map((pair, index) => ({
                  leftItem: pair.leftItem,
                  rightItem: pair.rightItem,
                  order: index,
                })),
              },
            },
          },
        });
      }

      // send notification to the students of grade about the question added in level
      await prisma.notification.create({
        data:{
          gradeId:level.subject.gradeId,
          message:`New Questions in level ${level.levelName} of subject ${level.subject.subjectName}`
        }
      });

      res.status(201).json({
        success: true,
        data: question,
      });
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create question",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error when adding question",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const validateReadyField = (requestData: AddQuestionRequestBody): boolean => {
  if (isFillBlankQuestion(requestData)) {
    // Fill in the blank: At least one blank segment and corresponding answers
    if (!requestData.segments || requestData.segments.length === 0)
      return false;

    const blankIndices = requestData.segments
      .map((segment, index) => (segment.isBlank ? index : -1))
      .filter((index) => index !== -1);

    const validAnswers = requestData.answers && requestData.answers.length > 0;
    const allAnswersMatchBlanks = requestData.answers?.every((answer) =>
      blankIndices.includes(answer.blankIndex)
    );

    return validAnswers && allAnswersMatchBlanks;
  } else if (isMatchingQuestion(requestData)) {
    // Matching: Ensure at least 3 valid pairs
    return requestData.pairs && requestData.pairs.length >= 3;
  }

  return false; // Default to not ready for unrecognized question types
};

const deleteQuestionHandler = async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params as { questionId: string };
    const userId = req.userId;

    // complete this handler
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "STUDENT") {
      res.status(401).json({
        success: false,
        message: "student cannot delete questions",
      });
      return;
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        level: {
          select: {
            subject: true,
          },
        },
      },
    });
    if (!question) {
      res.status(400).json({
        success: false,
        message: "question not found",
      });
      return;
    }

    if (user.role === "TEACHER") {
      const teachesGrade = await prisma.teacherGrade.findFirst({
        where: { teacherId: user.id, gradeId: question?.level.subject.gradeId },
      });
      if (!teachesGrade) {
        res.status(401).json({
          success: false,
          message: "teacher cannot delete question in this grade",
        });
        return;
      }
    }

    await prisma.question.delete({ where: { id: question?.id } });
    res.status(200).json({
      success: true,
      message: `question deleted successfully`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when deleting question",
    });
  }
};

const getQuestionWithAnswers = async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params as { questionId: string };
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    // Get question with all related data based on question type
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        level: {
          select: {
            subject: true,
          },
        },
        MCQAnswers: true,
        BlankSegments: {
          orderBy: {
            order: "asc",
          },
        },
        BlankAnswers: true,
        MatchingPairs: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!question) {
      res.status(400).json({
        success: false,
        message: "question not found",
      });
      return;
    }

    const gradeId = question.level.subject.gradeId;

    // Authorization checks
    if (user.role === "STUDENT" && user.gradeId !== gradeId) {
      res.status(401).json({
        success: false,
        message: "student cannot read questions for this grade",
      });
      return;
    }

    if (user.role === "TEACHER") {
      const teachesGrade = await prisma.teacherGrade.findFirst({
        where: { teacherId: user.id, gradeId: gradeId },
      });
      if (!teachesGrade) {
        res.status(401).json({
          success: false,
          message: "teacher cannot read questions for this grade",
        });
        return;
      }
    }

    // Process question data based on type
    let processedQuestion;
    switch (question.questionType) {
      case "MCQ":
        processedQuestion = processMCQQuestion(
          question,
          user.role === "STUDENT"
        );
        break;
      case "FILL_IN_BLANK":
        processedQuestion = processFillInBlankQuestion(
          question,
          user.role === "STUDENT"
        );
        break;
      case "MATCHING":
        processedQuestion = processMatchingQuestion(
          question,
          user.role === "STUDENT"
        );
        break;
      default:
        res.status(400).json({
          success: false,
          message: "invalid question type",
        });
        return;
    }

    res.status(200).json({
      success: true,
      question: processedQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting question with its answers",
    });
  }
};

// Helper function to shuffle arrays
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const processMCQQuestion = (question: any, isStudent: boolean) => {
  let answers = question.MCQAnswers;

  if (isStudent) {
    // Remove isCorrect field for students
    answers = answers.map((answer: Answer) => ({
      id: answer.id,
      value: answer.value,
      questionId: answer.questionId,
    }));
  }

  return {
    ...question,
    MCQAnswers:answers,
    BlankSegments: undefined,
    BlankAnswers: undefined,
    MatchingPairs: undefined,
  };
};

const processFillInBlankQuestion = (question: any, isStudent: boolean) => {
  const result = {
    ...question,
    MCQAnswers: undefined,
    BlankSegments: question.BlankSegments,
    BlankAnswers: isStudent ? undefined : question.BlankAnswers,
    MatchingPairs: undefined,
  };

  return result;
};

const processMatchingQuestion = (question: any, isStudent: boolean) => {
  let pairs = question.MatchingPairs;

  if (isStudent) {
    // Shuffle right items for students while maintaining the correct order of left items
    const rightItems = shuffleArray(pairs.map((pair: any) => pair.rightItem));
    pairs = pairs.map((pair: any, index: any) => ({
      id: pair.id,
      leftItem: pair.leftItem,
      rightItem: rightItems[index],
      order: pair.order,
    }));
  }

  return {
    ...question,
    MCQAnswers: undefined,
    BlankSegments: undefined,
    BlankAnswers: undefined,
    MatchingPairs: pairs,
  };
};

const getAnsweredQuestionsByLevelHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { levelId } = req.params as { levelId: string };
    const userId = req.userId;

    // get questions which have questionResponses by the user with id=userId and is in the level
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

    // get questions which have responses by the user and in the level with id = level.id
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
    });

    res.status(200).json({
      success: true,
      answeredQuestions: answeredQuestions,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting answered questions",
    });
  }
};

export {
  getQuestionsByLevelHandler,
  addQuestionByLevelHandler,
  deleteQuestionHandler,
  getQuestionWithAnswers,
  getAnsweredQuestionsByLevelHandler,
};
