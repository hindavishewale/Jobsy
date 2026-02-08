const notification=require("../Model/notification");
const getNotifications=async(req,res)=>{
const {email}=req.query;
try{
const notifications=await notification.find({candidateEmail:email}).sort({createdAt:-1});
res.json({success:true,notifications});
}catch(err){
console.error("Error fetching notifications:",err);
res.status(500).json({success:false,error:err.message});
}
};
const markAsRead=async(req,res)=>{
const {id}=req.body;
try{
await notification.findByIdAndUpdate(id,{read:true});
res.json({success:true});
}catch(err){
console.error("Error marking notification:",err);
res.status(500).json({success:false,error:err.message});
}
};
const createNotification=async(req,res)=>{
const {candidateEmail,message,type,internshipTitle,companyName}=req.body;
try{
await notification.create({candidateEmail,message,type,internshipTitle,companyName});
res.json({success:true});
}catch(err){
console.error("Error creating notification:",err);
res.status(500).json({success:false,error:err.message});
}
};
module.exports={getNotifications,markAsRead,createNotification};
