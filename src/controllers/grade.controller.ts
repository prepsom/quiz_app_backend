import {Request,Response} from "express";
import { prisma } from "..";


const getGradeByIdHandler = async (req:Request,res:Response) => {
    try {
        const {gradeId} = req.params as {gradeId:string};
        const grade = await prisma.grade.findUnique({where:{id:gradeId}});
        if(!grade) {
            res.status(404).json({success:false,message:"Grade not found"});
            return;
        }

        res.status(200).json({success:true,message:"Grade found",grade});
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message:"Internal server error"});
    }

}

export {
    getGradeByIdHandler,
}