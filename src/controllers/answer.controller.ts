import { Request, Response } from "express";
import { prisma } from "..";
import { QuestionType } from '@prisma/client';

// Type definitions for different answer types
type CreateMCQAnswerBody = {
    value: string;
    questionId: string;
    isCorrect?: boolean;
};

type CreateBlankAnswerBody = {
    value: string;
    questionId: string;
    blankIndex: number;
};

type CreateMatchingPairBody = {
    leftItem: string;
    rightItem: string;
    questionId: string;
    order: number;
};

// Union type for all possible request bodies
type CreateAnswerRequestBody = 
    | ({ type: 'MCQ' } & CreateMCQAnswerBody)
    | ({ type: 'FILL_IN_BLANK' } & CreateBlankAnswerBody)
    | ({ type: 'MATCHING' } & CreateMatchingPairBody);


const MCQ_ANSWERS_PER_QUESTION = 4;

const createAnswerForQuestionHandler = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const requestData = req.body as CreateAnswerRequestBody;
        const { questionId } = requestData;

        // Authorization checks
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                success: false,
                message: "not authorized to create answers for a question"
            });
            return;
        }

        // Get question with type-specific includes
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                level: {
                    select: {
                        subject: true,
                    }
                },
                MCQAnswers: true,
                BlankAnswers: true,
                MatchingPairs: true,
                BlankSegments: {
                    where: { isBlank: true }
                }
            }
        });

        if (!question) {
            res.status(400).json({
                success: false,
                message: "question not found"
            });
            return;
        }

        // Teacher grade authorization check
        const gradeId = question.level.subject.gradeId;
        if (user.role === "TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({
                where: { teacherId: user.id, gradeId: gradeId }
            });
            if (!teachesGrade) {
                res.status(401).json({
                    success: false,
                    message: "teacher cannot add answers to a question in this grade"
                });
                return;
            }
        }

        // Validate request type matches question type
        if (requestData.type !== question.questionType) {
            res.status(400).json({
                success: false,
                message: `Invalid answer type. Question is of type ${question.questionType}`
            });
            return;
        }

        let result;

        switch (requestData.type) {
            case 'MCQ':
                result = await handleMCQAnswer(question, requestData);
                break;
            case 'FILL_IN_BLANK':
                result = await handleBlankAnswer(question, requestData);
                break;
            case 'MATCHING':
                result = await handleMatchingPair(question, requestData);
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "invalid question type"
                });
                return;
            }

        if ('error' in result) {
            res.status(400).json({
                success: false,
                message: result.error
            });
            return;
        }

        await updateQuestionReadyStatus(question.id);
        res.status(201).json({
            success: true,
            answer: result.data
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error when creating answer for question"
        });
    }
};

const handleMCQAnswer = async (
    question: any,
    data: CreateMCQAnswerBody
) => {
    if (question.MCQAnswers.length >= MCQ_ANSWERS_PER_QUESTION) {
        return { error: "question already has maximum allowed answers" };
    }

    if (data.value.trim() === "") {
        return { error: "please enter an answer value" };
    }

    const answer = await prisma.answer.create({
        data: {
            value: data.value,
            questionId: question.id,
            isCorrect: data.isCorrect || false
        }
    });

    return { data: answer };
};

const handleBlankAnswer = async (
    question: any,
    data: CreateBlankAnswerBody
) => {
    // Validate blank index exists
    const totalBlanks = question.BlankSegments.length;
    if (data.blankIndex >= totalBlanks) {
        return { error: `invalid blank index. Question has ${totalBlanks} blanks` };
    }

    if (data.value.trim() === "") {
        return { error: "please enter an answer value" };
    }

    // Check if answer already exists for this blank index
    const existingAnswer = question.BlankAnswers.find(
        (a: any) => a.blankIndex === data.blankIndex
    );
    if (existingAnswer) {
        return { error: `answer already exists for blank index ${data.blankIndex}` };
    }

    const answer = await prisma.blankAnswer.create({
        data: {
            value: data.value,
            questionId: question.id,
            blankIndex: data.blankIndex
        }
    });

    return { data: answer };
};

const handleMatchingPair = async (
    question: any,
    data: CreateMatchingPairBody
) => {
    if (data.leftItem.trim() === "" || data.rightItem.trim() === "") {
        return { error: "please enter both left and right items" };
    }

    // Check for duplicate pairs
    const existingPair = question.MatchingPairs.find(
        (p: any) => 
            p.leftItem === data.leftItem || 
            p.rightItem === data.rightItem
    );
    if (existingPair) {
        return { error: "matching pair with these items already exists" };
    }

    const pair = await prisma.matchingPair.create({
        data: {
            leftItem: data.leftItem,
            rightItem: data.rightItem,
            questionId: question.id,
            order: data.order
        }
    });

    return { data: pair };
};

// Helper function to determine if a question is ready
const updateQuestionReadyStatus = async (questionId: string) => {
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
            MCQAnswers: true,
            BlankAnswers: true,
            BlankSegments: { where: { isBlank: true } },
            MatchingPairs: true
        }
    });

    if (!question) return;

    let isReady = false;
    switch (question.questionType) {
        case 'MCQ':
            isReady = question.MCQAnswers.length >= MCQ_ANSWERS_PER_QUESTION &&
                     question.MCQAnswers.some(answer => answer.isCorrect);
            break;
        case 'FILL_IN_BLANK':
            isReady = question.BlankAnswers.length === question.BlankSegments.length;
            break;
        case 'MATCHING':
            isReady = question.MatchingPairs.length >= 2; // Minimum 2 pairs for matching
            break;
    }

    await prisma.question.update({
        where: { id: questionId },
        data: { ready: isReady }
    });
};

type UpdateCorrectAnswerParams = {
    answerId: string;
    isCorrect?: boolean; // Optional for Fill-in-blank to toggle correctness
};
const updateCorrectAnswerHandler = async (req: Request, res: Response) => {
    try {
        const {answerId} = req.params as {answerId:string};
        const { isCorrect } = req.body as UpdateCorrectAnswerParams;
        const userId = req.userId;

        // Authorization check
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                success: false,
                message: "not authorized to modify correct answers"
            });
            return;
        }

        // Get answer with question details based on answer type
        const answerData = await getAnswerWithQuestionDetails(answerId);
        
        if (!answerData || !answerData.question) {
            res.status(400).json({
                success: false,
                message: "answer not found"
            });
            return;
        }

        // Teacher grade authorization check
        const gradeId = answerData.question.level.subject.gradeId;
        if (user.role === "TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({
                where: { teacherId: user.id, gradeId: gradeId }
            });
            if (!teachesGrade) {
                res.status(401).json({
                    success: false,
                    message: "teacher cannot modify correct answers for questions in this grade"
                });
                return;
            }
        }

        let result;
        switch (answerData.question.questionType) {
            case 'MCQ':
                result = await handleMCQCorrectAnswer(answerData);
                break;
            case 'FILL_IN_BLANK':
                result = await handleBlankCorrectAnswer(answerData, isCorrect);
                break;
            case 'MATCHING':
                res.status(400).json({
                    success: false,
                    message: "matching questions do not support modifying correct answers"
                });
                return;
            default:
                res.status(400).json({
                    success: false,
                    message: "invalid question type"
                });
                return;
        }

        await updateQuestionReadyStatus(answerData.question.id);

        res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "internal server error when updating the correct answer"
        });
    }
};

const getAnswerWithQuestionDetails = async (answerId: string) => {
    // Try to get MCQ answer first
    const mcqAnswer = await prisma.answer.findUnique({
        where: { id: answerId },
        include: {
            question: {
                include: {
                    MCQAnswers: true,
                    level: {
                        select: {
                            subject: true
                        }
                    }
                }
            }
        }
    });

    if (mcqAnswer) return mcqAnswer;

    // Try to get Blank answer
    const blankAnswer = await prisma.blankAnswer.findUnique({
        where: { id: answerId },
        include: {
            question: {
                include: {
                    BlankAnswers: true,
                    level: {
                        select: {
                            subject: true
                        }
                    }
                }
            }
        }
    });

    return blankAnswer;
};


const handleMCQCorrectAnswer = async (answer: any) => {
    const answers = answer.question.MCQAnswers;
    let currentCorrectAnswer = answers.find((a:any) => a.isCorrect);
    
    if (!currentCorrectAnswer) {
        // No correct answer yet - make this one correct
        await prisma.answer.update({
            where: { id: answer.id },
            data: { isCorrect: true }
        });
        return { message: `Answer with id ${answer.id} is now the correct answer` };
    }
    
    if (answer.id === currentCorrectAnswer.id) {
        // This answer is currently correct - unmark it
        await prisma.answer.update({
            where: { id: answer.id },
            data: { isCorrect: false }
        });
        return { message: `Answer with id ${answer.id} is no longer marked as correct` };
    }
    
    // Another answer is correct - switch correctness
    await prisma.$transaction([
        prisma.answer.update({
            where: { id: currentCorrectAnswer.id },
            data: { isCorrect: false }
        }),
        prisma.answer.update({
            where: { id: answer.id },
            data: { isCorrect: true }
        })
    ]);
    
    return { message: `Answer with id ${answer.id} is now the correct answer` };
};

const handleBlankCorrectAnswer = async (answer: any, isCorrect: boolean | undefined) => {
    // For fill-in-blank, we allow multiple correct answers per blank
    // If isCorrect is not provided, we toggle the current state
    const newIsCorrect = isCorrect ?? !answer.isCorrect;
    
    await prisma.blankAnswer.update({
        where: { id: answer.id },
        data: { isCorrect: newIsCorrect }
    });

    return {
        message: `Answer with id ${answer.id} is now ${newIsCorrect ? 'marked' : 'unmarked'} as correct`
    };
};

const deleteAnswerHandler = async (req:Request,res:Response) => {
    // delete answer handler
    try {
        const {answerId} = req.params as {answerId:string};
        const userId = req.userId;
        
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user || user.role==="STUDENT") {
            res.status(401).json({
                "success":false,
                "message":"student cannot delete answers"
            })
            return;
        }
    
        const answer = await prisma.answer.findUnique({where:{id:answerId},include:{
            question:{
                select:{
                    level:{
                        select:{
                            subject:true,
                        }
                    }
                }
            }
        }});


        if(!answer) {
            res.status(400).json({
                "success":false,
                "message":"answer not found"
            });
            return;
        }
    
        if(user.role==="TEACHER") {
            const gradeId = answer.question.level.subject.gradeId;
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher cannot delete answers in this grade"
                })
                return;
            }
        }
    
        await prisma.answer.delete({where:{id:answer.id}});
        await updateQuestionReadyStatus(answer.questionId);
        res.status(200).json({
            "success":true,
            "message":"answer deleted successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when deleting answer"
        })
    }
}

export {
    createAnswerForQuestionHandler,
    updateCorrectAnswerHandler,
    deleteAnswerHandler
}