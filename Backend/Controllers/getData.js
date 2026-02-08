const candidate = require("../Model/candidate");
const internship=require("../Model/internships");
const company=require("../Model/company");
const application=require("../Model/application");
const fraudReport=require("../Model/fraudReport");
const action=require("../Model/action");
const comp=async(req,res)=>{
const email=req.body.email;
console.log("comp : ",email);
try{
const target=await company.findOne({Email:email});
console.log("target :",target);
res.json(target);
}catch(err)
{
res.json({
error:err
});
}
}
const getInternships=async(req,res)=>{
try{
const target=await internship.find({$or:[{status:'Active'},{status:{$exists:false}}]});
console.log("Found internships:",target.length);
res.status(200).json(target);
}catch(err)
{
console.error("Error fetching internships:",err);
res.status(500).json({
error:err.message
});
}
}
const getCompanyInternships=async(req,res)=>{
const {companyName}=req.query;
try{
const target=await internship.find({companyName});
res.status(200).json(target);
}catch(err){
console.error("Error fetching company internships:",err);
res.status(500).json({error:err.message});
}
}
const postInternship=async(req,res)=>{
const {internshipTitle,companyName,location,stipend,stream,eligibility,applicationDeadline,description,skills}=req.body;
try{
const newInternship=new internship({
internshipTitle,
companyName,
location,
stipend,
stream,
eligibility,
applicationDeadline,
description,
skills
});
await newInternship.save();
res.status(201).json({message:"Internship posted successfully"});
}catch(err){
console.error("Error posting internship:",err);
res.status(500).json({error:err.message});
}
}
const getGovStats=async(req,res)=>{
try{
const totalCompanies=await company.countDocuments();
const totalCandidates=await candidate.countDocuments();
const totalInternships=await internship.countDocuments();
const totalApplications=await application.countDocuments();
const totalFraudReports=await fraudReport.countDocuments();
const pendingFraudReports=await fraudReport.countDocuments({status:'Pending'});
const actionsTaken=await action.countDocuments();
res.json({
success:true,
stats:{
totalCompanies,
fraudReports:totalFraudReports,
verifiedCompanies:totalCompanies,
actionsTaken,
pendingReview:pendingFraudReports
}
});
}catch(err){
console.error("Error fetching gov stats:",err);
res.status(500).json({success:false,error:err.message});
}
}
const getRecentFraudReports=async(req,res)=>{
try{
const reports=await fraudReport.find().sort({reportDate:-1}).limit(5);
res.json({success:true,reports});
}catch(err){
console.error("Error fetching fraud reports:",err);
res.status(500).json({success:false,error:err.message});
}
}
const submitFraudReport=async(req,res)=>{
const {companyName,reportedBy,issue,severity}=req.body;
try{
const newReport=new fraudReport({companyName,reportedBy,issue,severity});
await newReport.save();
res.json({success:true,message:'Fraud report submitted'});
}catch(err){
console.error("Error submitting fraud report:",err);
res.status(500).json({success:false,error:err.message});
}
}
const getAllFraudReports=async(req,res)=>{
try{
const reports=await fraudReport.find().sort({reportDate:-1});
res.json({success:true,reports});
}catch(err){
console.error("Error fetching all fraud reports:",err);
res.status(500).json({success:false,error:err.message});
}
}
const getAllCompanies=async(req,res)=>{
try{
const companies=await company.find().sort({registrationDate:-1});
res.json({success:true,companies});
}catch(err){
console.error("Error fetching all companies:",err);
res.status(500).json({success:false,error:err.message});
}
}
const getAnalytics=async(req,res)=>{
try{
const totalInternships=await internship.countDocuments();
const activeCandidates=await candidate.countDocuments();
res.json({success:true,analytics:{totalInternships,activeCandidates}});
}catch(err){
console.error("Error fetching analytics:",err);
res.status(500).json({success:false,error:err.message});
}
}
const getRegionalData=async(req,res)=>{
try{
const regions=['Maharashtra','Karnataka','Delhi','Tamil Nadu','Telangana','Gujarat','Rajasthan','Punjab'];
const regionalStats=await Promise.all(regions.map(async(region)=>{
const companyCount=await company.countDocuments({Location:new RegExp(region,'i')});
const fraudCount=await fraudReport.countDocuments({companyName:new RegExp(region,'i')});
return{region,companyCount,fraudCount};
}));
res.json({success:true,regionalData:regionalStats});
}catch(err){
console.error("Error fetching regional data:",err);
res.status(500).json({success:false,error:err.message});
}
}
const getActionsTaken=async(req,res)=>{
try{
const actions=await action.find().sort({actionDate:-1});
res.json({success:true,actions});
}catch(err){
console.error("Error fetching actions:",err);
res.status(500).json({success:false,error:err.message});
}
}
const getPendingCompanies=async(req,res)=>{
try{
const companies=await company.find({verificationStatus:'Pending'}).sort({registrationDate:-1});
res.json({success:true,companies});
}catch(err){
console.error("Error fetching pending companies:",err);
res.status(500).json({success:false,error:err.message});
}
}
const approveCompany=async(req,res)=>{
const {email}=req.body;
try{
await company.findOneAndUpdate({Email:email},{verificationStatus:'Verified'});
res.json({success:true,message:'Company approved'});
}catch(err){
console.error("Error approving company:",err);
res.status(500).json({success:false,error:err.message});
}
}
const rejectCompany=async(req,res)=>{
const {email}=req.body;
try{
await company.findOneAndUpdate({Email:email},{verificationStatus:'Rejected'});
res.json({success:true,message:'Company rejected'});
}catch(err){
console.error("Error rejecting company:",err);
res.status(500).json({success:false,error:err.message});
}
}
const updateInternshipStatus=async(req,res)=>{
const {internshipTitle,companyName,status}=req.body;
try{
await internship.findOneAndUpdate({internshipTitle,companyName},{status});
res.json({success:true,message:`Internship ${status}`});
}catch(err){
console.error("Error updating internship:",err);
res.status(500).json({success:false,error:err.message});
}
}
const updateInternship=async(req,res)=>{
const {internshipTitle,companyName,updates}=req.body;
try{
await internship.findOneAndUpdate({internshipTitle,companyName},updates);
res.json({success:true,message:'Internship updated'});
}catch(err){
console.error("Error updating internship:",err);
res.status(500).json({success:false,error:err.message});
}
}
module.exports={
comp,
getInternships,
getCompanyInternships,
postInternship,
getGovStats,
getRecentFraudReports,
getPendingCompanies,
approveCompany,
rejectCompany,
submitFraudReport,
getAllFraudReports,
getAllCompanies,
getAnalytics,
getRegionalData,
getActionsTaken,
updateInternshipStatus,
updateInternship
}
