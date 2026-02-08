const application=require("../Model/application");
const candidate=require("../Model/candidate");
const savedInternship=require("../Model/savedInternship");
const applyInternship=async(req,res)=>{
const {candidateEmail,internshipId,internshipTitle,companyName,location,stipend}=req.body;
try{
const user=await candidate.findOne({Email:candidateEmail});
if(!user){
return res.status(404).json({error:"Candidate not found"});
}
const existing=await application.findOne({candidateEmail,internshipId});
if(existing){
return res.status(400).json({error:"Already applied"});
}
const newApp=new application({
candidateEmail,
candidateName:user.Name,
internshipId,
internshipTitle,
companyName,
location,
stipend
});
await newApp.save();
res.status(201).json({message:"Application submitted successfully"});
}catch(err){
console.error("Error applying:",err);
res.status(500).json({error:err.message});
}
}
const getApplicationsByCandidate=async(req,res)=>{
const {email}=req.query;
try{
const apps=await application.find({candidateEmail:email}).sort({appliedDate:-1});
res.status(200).json(apps);
}catch(err){
console.error("Error fetching applications:",err);
res.status(500).json({error:err.message});
}
}
const getApplicationsByCompany=async(req,res)=>{
const {companyName}=req.query;
try{
const apps=await application.find({companyName}).sort({appliedDate:-1});
res.status(200).json(apps);
}catch(err){
console.error("Error fetching applications:",err);
res.status(500).json({error:err.message});
}
}
const saveInternship=async(req,res)=>{
const {candidateEmail,internshipTitle,companyName,location,stipend,skills}=req.body;
try{
const existing=await savedInternship.findOne({candidateEmail,internshipTitle,companyName});
if(existing){
return res.status(400).json({error:"Already saved"});
}
const newSaved=new savedInternship({candidateEmail,internshipTitle,companyName,location,stipend,skills});
await newSaved.save();
res.status(201).json({message:"Internship saved successfully"});
}catch(err){
console.error("Error saving:",err);
res.status(500).json({error:err.message});
}
}
const getSavedInternships=async(req,res)=>{
const {email}=req.query;
try{
const saved=await savedInternship.find({candidateEmail:email}).sort({savedDate:-1});
res.status(200).json(saved);
}catch(err){
console.error("Error fetching saved:",err);
res.status(500).json({error:err.message});
}
}
const removeSavedInternship=async(req,res)=>{
const {candidateEmail,internshipTitle,companyName}=req.body;
try{
await savedInternship.deleteOne({candidateEmail,internshipTitle,companyName});
res.status(200).json({success:true,message:"Removed from saved"});
}catch(err){
console.error("Error removing:",err);
res.status(500).json({error:err.message});
}
}
module.exports={
applyInternship,
getApplicationsByCandidate,
getApplicationsByCompany,
saveInternship,
getSavedInternships,
removeSavedInternship
}
