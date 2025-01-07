import { json, Request, Response } from "express";
import { openai, prisma } from "..";
import { $Enums, Question } from "@prisma/client";


type AddLevelRequestBody = {
    levelName:string;
    subjectId:string;
    passingQuestions:number;
}

type UpdateLevelRequestBody = {
    newLevelName:string;
}


const addLevelHandler = async (req:Request,res:Response) =>  {
    // who can add levels -> teachers 
    try {
        const userId = req.userId;
        const {levelName,subjectId,passingQuestions} = req.body as AddLevelRequestBody;
        const user = await prisma.user.findUnique({where:{id:userId}});
        
        if(!user || user.role==="STUDENT") {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const subject = await prisma.subject.findUnique({where:{id:subjectId}});
        if (!subject) {
            res.status(400).json({
                success: false,
                message: "Invalid subject ID",
            });
            return;
        }
    
        // CAN ONLY ADD A LEVEL IF THE TEACHER TEACHES THE GRADE WHICH HAS  THE SUBJECT HE/SHE IS ADDING A LEVEL TO
        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:subject.gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher cannot add level in this subject"
                })
                return;
            }
        }

        if(passingQuestions < 0) {
            res.status(400).json({
                "success":false,
                "message":"passing questions cannot be negative"
            })
            return;
        }

        // teacher can add a level 
        const highestPosition = await prisma.level.findMany({where:{subjectId:subject.id},orderBy:{
            position:"desc"
        },take:1}).then(levels => levels[0]?.position ?? -1);

        const newLevel = await prisma.level.create({data:{
            levelName:levelName,
            position:highestPosition+1,
            subjectId:subject.id,
            passingQuestions:passingQuestions,
        }});
    
    
        res.status(201).json({
            success: true,
            message: "Level added successfully",
            level: newLevel,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"Intenral server error when adding a level"
        });
    }
}



const getLevelsBySubjectHandler = async (req:Request,res:Response) => {
    try {
        const {subjectId} = req.params as {subjectId:string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            return;
        }
    
        const subject = await prisma.subject.findUnique({where:{id:subjectId}});
        if(!subject) {
            return;
        }
    
        // subject exists to get levels for that subject 
        // can only read levels if
        // if user student then the grade that the subject is in has to match user's grade
        // if user is teacher then teacher has to teach the grade that the subject is in 
        if(user.role==="STUDENT") {
            if(user.gradeId !== subject.gradeId) {
                res.status(401).json({
                    "success":false,
                    "message":""
                })
                return;
            }   
        }
    
    
        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:subject.gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher cannot read levels of this subject"
                })
                return;
            }
        }

        const levels = await prisma.level.findMany({where:{subjectId:subject.id},orderBy:{position:"asc"}});

        res.status(200).json({
            "success":true,
            levels,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when fetching levels for a subject"
        })
    }
}

const deleteLevelHandler = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if (!user || user.role==="STUDENT") {
            res.status(401).json({
                success: false,
                message: "Unauthorized user.",
            });
            return;
        }
    
        const level = await prisma.level.findUnique({ where: { id: levelId },include:{subject:true}});
        if (!level) {
            res.status(404).json({
                success: false,
                message: "Level not found.",
            });
            return;
        }    
    
        const gradeId = level.subject.gradeId; // grade in which the level is in 
    
        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    success: false,
                    message: "Teacher is not authorized to delete levels of this subject.",
                });
                return;
            }
        }
    
        await prisma.level.delete({where:{id:level.id}});
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
}

const updateLevelHandler = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const {newLevelName} = req.body as UpdateLevelRequestBody;
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
                    message: "Teacher is not authorized to update levels of this subject.",
                });
                return;
            }
        }
    
        const updatedLevel = await prisma.level.update({
            where: { id: level.id },
            data: { levelName: newLevelName.trim()},
        });
    
        res.status(200).json({
            success: true,
            message: "Level updated successfully.",
            level: updatedLevel,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"Internal server error while updating the level"
        })
    }
}
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
}

const getLevelResultsHandler = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const userId = req.userId;
    
        // get results for questions answered in a level by the user 
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
    
            return;
        }
    
        const level = await prisma.level.findUnique({where:{id:levelId}});
        if(!level) {
            res.status(400).json({
                "success":false,
                "message":"level not found"
            });
    
            return;
        }
    
        const responses = await prisma.questionResponse.findMany({
            where:{
                 responderId:user.id,
                 question:{
                    levelId:level.id,
                 }
            },
            include:{
                question:true,
            }
        });
    
        if(responses.length===0) {
            res.status(404).json({
                "success":false,
                "message":"No results found for this level"
            });
            return;
        }
        
        const result:LevelResult = {
            totalPoints:responses.reduce((sum,r) => sum + r.pointsEarned,0),
            correctAnswers:responses.filter(r => r.isCorrect).length,
            totalQuestions:responses.length,
            questionResults:responses.map((r => {
                return {
                    question:r.question,
                    isCorrect:r.isCorrect,
                    pointsEarned:r.pointsEarned,
                    responseTime:r.responseTime
                }
            }))
        };
    
        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Error in getLevelResultsHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error when fetching level results"
        });
    }
}

const getLevelQuestions = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const level = await prisma.level.findUnique({where:{id:levelId},include:{
            subject:true,
        }});
        if(!level) {
            res.status(400).json({
                "success":false,
                "message":"level not  found"
            })
            return;
        }
        const gradeId = level.subject.gradeId;
    
        if(user.role==="STUDENT") {
            if(user.gradeId!==gradeId) {
                res.status(401).json({
                    "success":false,
                    "message":"user not authorized to get questions for this grade"
                });
                return;
            }
        }
    
        if(user.role==="TEACHER") {
            // 
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher not authorized to get questions for this grade"
                })
                return;
            }
        }
        
        // get all questions in a level and the question id's user has made responses to
        const allQuestions = await prisma.question.findMany({where:{levelId:level.id,ready:true}});
        const answeredQuestions = await prisma.question.findMany({
            where:{levelId:level.id,ready:true,QuestionResponse:{
                some:{
                    responderId:user.id,
                }
            }},
            include:{
                QuestionResponse:{
                    select:{
                        pointsEarned:true,
                        responderId:true,
                    }
                }
            }
        });

        let currentPointsEarnedInLevel = 0;
        
        for(let i=0;i<answeredQuestions.length;i++) {
            const answeredQuestionResponses = answeredQuestions[i].QuestionResponse;
            for(let k = 0 ; k < answeredQuestionResponses.length;k++) {
                if(answeredQuestionResponses[k].responderId===user.id) {
                    currentPointsEarnedInLevel = currentPointsEarnedInLevel + answeredQuestionResponses[k].pointsEarned;
                    break;
                }
            }
        }

        console.log(currentPointsEarnedInLevel);

        const answeredQuestionIds = answeredQuestions.map((question) => question.id);        

        res.status(200).json({
            "success":true,
            allQuestions,
            answeredQuestionIds,
            "currentPointsInLevel":currentPointsEarnedInLevel,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when getting questions for a level"
        })   
    }
}


const getLevelById = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const level = await prisma.level.findUnique({where:{id:levelId}});
        if(!level) {
            res.status(400).json({
                "success":false,
                "message":"level not found"
            })
            return;
        }
    
        res.status(200).json({"success":true,level});
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when getting level by id"
        })
    }
}

const completeLevelHandler = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const level = await prisma.level.findUnique({where:{id:levelId},include:{
            Questions:{
                where:{ready:true},
                select:{
                    questionTitle:true,
                    questionHint:true,
                    difficulty:true,
                    id:true,
                    Answers:true,
                    QuestionResponse:true,
                }
            },
        }});
        if(!level) {
            res.status(400).json({
                "success":false,
                "message":"level not found"
            });
            return;
        }

        // check if level already completed by user

        const totalQuestionsInLevel = level.Questions.length;
        
        if(totalQuestionsInLevel===0) {
            res.status(400).json({
                "success":false,
                "message":"no questions in level, user cannot complete level"
            });
            return;
        }

        // all the questions in the level and its responses where the responderId=user.id
        // [
        //     {
        //         question
        //         questionResponseByUser:{
                
        //         }
        //     },
        //     {

        //     },
        //     {

        //     }
        // ]

        let noOfCorrectQuestions = 0;
        let totalPointsEarnedInLevel = 0;
        for(let i=0;i<totalQuestionsInLevel;i++) {
            const questionResponse = level.Questions[i].QuestionResponse
            .find((questionResponse) => questionResponse.responderId===user.id);
            console.log(questionResponse);
            if(!questionResponse) {
                continue;
            }
            if(questionResponse.isCorrect) {
                noOfCorrectQuestions++;
            }
            totalPointsEarnedInLevel+=questionResponse.pointsEarned;
        }    
    
        let isComplete = false;
        const percentage = Math.fround(((noOfCorrectQuestions) / (totalQuestionsInLevel)) * 100);
        if(noOfCorrectQuestions > level.passingQuestions) {
            isComplete=true;
        }
    
        if(!isComplete) {
            res.status(400).json({
                "success":false,
                "message":"user cannot complete this level.Get better"
            })
            return;
        }

        const openAiMessages = level.Questions.map((question) => {
            const questionResponse = question.QuestionResponse.find((response) => response.responderId===user.id);
            return {
                ...question,
                "questionResponseByUser":questionResponse,
            }
        });        
        console.log(openAiMessages);

        // Give me  strength , weaknesses and recommendations based on the list of questions and its responses by the user.

        const openAIResponse = await openai.chat.completions.create({
            model:"gpt-3.5-turbo",
            store:true,
            messages: [
                {
                    role:"system",
                    "content":`You are an assistant that provides feedback on user performance in a quiz. 
                        Analyze the user's responses and provide feedback in the following JSON format:
                        {
                            "strengths": ["strength1", "strength2", ...],
                            "weaknesses": ["weakness1", "weakness2", ...],
                            "recommendations": ["recommendation1", "recommendation2", ...]
                        }
                        Each array should contain 2-3 points.`
                },
                {
                    role:"user",
                    content:JSON.stringify(openAiMessages)
                }
            ],
        });


        const feedback = openAIResponse.choices[0].message.content;
        const apiData = JSON.parse(feedback || "") as {"strengths":string[];"weaknesses":string[];"recommendations":string[]};
        const strengths = apiData.strengths;
        const weaknesses = apiData.weaknesses;
        const recommendations = apiData.recommendations;
        // Parsing feedback into structured JSON

        const completedLevel = await prisma.userLevelComplete.findFirst({where:{userId:user.id,levelId:level.id}});
        if(completedLevel) {
            // is level is already completed by user i.e user has passed this level 
            // if the points earned by user in completing this level currently > prev points earned 
            //  update the entry in the userLevelComplete table
            // else  do nothing and return success response for completing the level with 200 OK as no new 
            
            if(totalPointsEarnedInLevel  > completedLevel.totalPoints) {
                await prisma.userLevelComplete.update({where:{id:completedLevel.id},data:{
                    totalPoints:totalPointsEarnedInLevel,
                    strengths:strengths,
                    weaknesses:weaknesses,
                    recommendations:recommendations,
                }});
            }

            if(noOfCorrectQuestions > completedLevel.noOfCorrectQuestions) {
                await prisma.userLevelComplete.update({where:{id:completedLevel.id},data:{
                    noOfCorrectQuestions:noOfCorrectQuestions,
                    strengths:strengths,
                    weaknesses:weaknesses,
                    recommendations:recommendations,
                }})
            }
            
            res.status(200).json({
                "success":true,
                "message":"Level Completed",
                "noOfCorrectQuestions":noOfCorrectQuestions,
                "totalQuestions":totalQuestionsInLevel,
                "percentage":percentage,
                "isComplete":isComplete,
                "strengths":strengths,
                "weaknesses":weaknesses,
                "recomendations":recommendations,
            });
        } else {
            await prisma.userLevelComplete.create({data:{
                userId:user.id,
                levelId:level.id,
                totalPoints:totalPointsEarnedInLevel,
                noOfCorrectQuestions:noOfCorrectQuestions,
                strengths:strengths,
                weaknesses:weaknesses,
                recommendations:recommendations,
            }});
            res.status(201).json({
                "success":true,
                "message":"Level completed",
                "noOfCorrectQuestions":noOfCorrectQuestions,
                "totalQuestions":totalQuestionsInLevel,
                "percentage":percentage,
                "isComplete":isComplete,
                "strengths":strengths,
                "weaknesses":weaknesses,
                "recomendations":recommendations,
            });
        }        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when completing level "
        });
    }
}

const getCompletedLevelsBySubjectHandler = async (req:Request,res:Response) => {
    try {
        const {subjectId} = req.params as {subjectId:string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const subject = await prisma.subject.findUnique({where:{id:subjectId}});
        if(!subject) {
            res.status(400).json({
                "success":false,
                "message":"subject not found"
            });
            return;
        }
    
        // completed levels ,
        let completedLevelsByUser = await prisma.userLevelComplete.findMany({where:{userId:user.id},include:{
            level:true,
        }});
        
        // completedLevelsByUser -> includes all levels completed by user regardless of subject
        // allLevelsInSubject -> all levels in a subject duh
        let completedLevelsByUserInSubject = 
        completedLevelsByUser.filter((completedLevel) => completedLevel.level.subjectId===subject.id)
        .map((completedLevel) => completedLevel.level);
    
        // sort by position 
        completedLevelsByUserInSubject = completedLevelsByUserInSubject.sort((a,b) => a.position - b.position);

        res.status(200).json({
            "success":true,
            "completedLevels":completedLevelsByUserInSubject,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when getting completed levels"
        });
    }
}

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
}