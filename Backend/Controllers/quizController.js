const quizResult=require("../Model/quizResult");
const application=require("../Model/application");
const notification=require("../Model/notification");
const saveQuizResult=async(req,res)=>{
const {candidateEmail,skill,score,totalQuestions,correctAnswers,timeTaken}=req.body;
try{
const newResult=new quizResult({candidateEmail,skill,score,totalQuestions,correctAnswers,timeTaken});
await newResult.save();
res.status(201).json({success:true,message:"Quiz result saved"});
}catch(err){
console.error("Error saving quiz result:",err);
res.status(500).json({success:false,error:err.message});
}
};
const getQuizResults=async(req,res)=>{
const {email}=req.query;
try{
const results=await quizResult.find({candidateEmail:email}).sort({completedDate:-1});
const allResults=await quizResult.find({});
const resultsWithPercentile=results.map(result=>{
const skillResults=allResults.filter(r=>r.skill===result.skill);
const betterScores=skillResults.filter(r=>r.score<result.score).length;
const percentile=skillResults.length>1?Math.round((betterScores/skillResults.length)*100):100;
return{...result.toObject(),percentile};
});
res.status(200).json({success:true,results:resultsWithPercentile});
}catch(err){
console.error("Error fetching quiz results:",err);
res.status(500).json({success:false,error:err.message});
}
};
const updateApplicationStatus=async(req,res)=>{
const {candidateEmail,internshipTitle,status}=req.body;
try{
const updated=await application.findOneAndUpdate(
{candidateEmail,internshipTitle},
{status},
{new:true}
);
if(!updated){
return res.status(404).json({success:false,error:"Application not found"});
}
const message=status==='Shortlisted'
?`Congratulations! You have been shortlisted for ${internshipTitle} at ${updated.companyName}.`
:`Your application for ${internshipTitle} at ${updated.companyName} has been ${status.toLowerCase()}.`;
await notification.create({
candidateEmail,
message,
type:status,
internshipTitle,
companyName:updated.companyName
});
res.json({success:true,message:"Status updated"});
}catch(err){
console.error("Error updating status:",err);
res.status(500).json({success:false,error:err.message});
}
};
module.exports={saveQuizResult,getQuizResults,updateApplicationStatus};
