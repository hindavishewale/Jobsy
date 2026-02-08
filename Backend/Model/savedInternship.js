const mongoose=require("mongoose");
const savedInternshipSchema=new mongoose.Schema({
candidateEmail:{type:String,required:true},
internshipTitle:{type:String,required:true},
companyName:{type:String,required:true},
location:{type:String},
stipend:{type:String},
skills:{type:String},
savedDate:{type:Date,default:Date.now}
});
module.exports=mongoose.model("SavedInternship",savedInternshipSchema);
