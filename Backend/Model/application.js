const mongoose=require('mongoose');
const applicationSchema=new mongoose.Schema({
candidateEmail:{type:String,required:true},
candidateName:{type:String,required:true},
internshipId:{type:String,required:true},
internshipTitle:{type:String,required:true},
companyName:{type:String,required:true},
location:{type:String},
stipend:{type:String},
status:{type:String,default:'Under Review'},
appliedDate:{type:Date,default:Date.now}
});
const applicationModel=mongoose.model("application",applicationSchema);
module.exports=applicationModel;
