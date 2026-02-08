const mongoose=require("mongoose");
const quizResultSchema=new mongoose.Schema({
candidateEmail:{type:String,required:true},
skill:{type:String,required:true},
score:{type:Number,required:true},
totalQuestions:{type:Number,required:true},
correctAnswers:{type:Number,required:true},
timeTaken:{type:Number},
completedDate:{type:Date,default:Date.now}
});
module.exports=mongoose.model("QuizResult",quizResultSchema);
