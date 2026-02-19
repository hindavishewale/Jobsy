const mongoose=require("mongoose");
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("Mongo connected for notifications"))
.catch(err=>console.log("error of mongo notifications:",err));
const notificationSchema=new mongoose.Schema({
candidateEmail:{type:String,required:true},
message:{type:String,required:true},
type:{type:String,enum:['Shortlisted','Rejected','Info'],default:'Info'},
internshipTitle:{type:String},
companyName:{type:String},
read:{type:Boolean,default:false},
createdAt:{type:Date,default:Date.now}
});
const NotificationModel=mongoose.model("Notification",notificationSchema);
module.exports=NotificationModel;
