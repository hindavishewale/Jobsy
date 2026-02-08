const candidateModel = require("../Model/candidate");
const Internship=require("../Model/internships");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const company=require("../Model/company");
const sec = process.env.secret_key || "yoursecret";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/resumes");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});
const upload = multer({ storage });
const addData = async (req, res) => {
  try {
    const body = req.body;
    const newCandidate = await candidateModel.create({
      Name: body.Name,
      Email: body.Email,
      Resume: req.file ? req.file.filename : "",
      Portfolio: body.Portfolio,
      Linkedin: body.Linkedin,
      Education: body.Education,
      College: body.College,
      Major: body.Major,
      Year: body.Year,
      Skills: body.Skills,
      Location: body.Location,
      Password: body.Password,
      ConPassword: body.ConPassword,
    });
    const token = jwt.sign({ Email: body.Email }, sec, { expiresIn: "5h" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.status(201).send("Candidate registered successfully");
  } catch (err) {
    console.error("Candidate registration failed:", err);
    res.status(400).send("Candidate registration failed!");
  }
};
const addCompany = async (req, res) => {
  try {
    const body = req.body;
    const newCompany = await company.create({
      CompanyName: body.CompanyName,
      CompanySize: body.CompanySize,
      Industry: body.Industry,
      Website: body.Website,
      ContactPerson: body.ContactPerson,
      Email: body.Email,
      Password: body.Password,
      ConPassword: body.ConPassword
    });
    const token = jwt.sign({ Email: body.Email }, sec, { expiresIn: "5h" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.status(201).send("Company registered successfully");
  } catch (err) {
    console.error("Company registration failed:", err);
    res.status(400).send("Company registration failed!");
  }
};
const loginUser = async (req, res) => {
  const { email, password, role } = req.body;
  console.log("email:", email, " pass:", password, " role:", role);
  try {
    let user;
    if (role === "candidate") {
      user = await candidateModel.findOne({ Email: email });
    } else if (role === "company") {
      user = await company.findOne({ Email: email });
    } else if (role === "government") {
      user ={
        Password:process.env.GOV_PASSWORD
      };
    } else {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "User not registered" });
    }
    if (user.Password !== password) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
     const token = jwt.sign({ email: email }, sec, { expiresIn: "5h" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    return res.json({
      success: true,
      message: "Login successful",
      role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};
const addInternship = async (req, res) => {
  try {
    const body = req.body;
    const newInternship = await Internship.create({
      internshipTitle: body.internshipTitle,
      companyName:body.name,
      location: body.location,
      stipend: body.stipend,
      stream: body.stream,
      eligibility: body.eligibility,
      applicationDeadline: body.applicationDeadline,
      description: body.description,
      skills: body.skills,
    });
    res.status(201).send("Internship created successfully");
  } catch (err) {
    console.error("Internship creation failed:", err);
    res.status(400).send("Failed to create internship");
  }
};
const loader=async (req,res)=>{
const target=req.user;
const candidate=await candidateModel.findOne({Email:target.email});
if(candidate){
return res.json(candidate);
}
const comp=await company.findOne({Email:target.email});
if(comp){
return res.json(comp);
}
res.status(404).json({error:"User not found"});
}
const updateProfile=async(req,res)=>{
const target=req.user;
const updates=req.body;
try{
const candidate=await candidateModel.findOneAndUpdate(
{Email:target.email},
{$set:updates},
{new:true,runValidators:false,upsert:false}
);
if(candidate){
return res.json({message:"Profile updated successfully"});
}
const comp=await company.findOneAndUpdate(
{Email:target.email},
{$set:updates},
{new:true,runValidators:false,upsert:false}
);
if(comp){
return res.json({message:"Profile updated successfully"});
}
res.status(404).json({error:"User not found"});
}catch(err){
console.error("Update error:",err);
res.status(500).json({error:err.message});
}
}
const userSpecific = (req, res) => {
    res.redirect(`/${req.params.pge}`);
}
const admin=(req,res)=>{
    const target=req.user;
    if(target.email == process.env.admin_email)
    {
        res.sendFile(path.join(__dirname, '..','..', 'Collection', `admin.html`));
    }else{
        res.send("Not Authorized !");
    }
}
const getData=async (req,res)=>{
    const total=await user.countDocuments();
    res.json({User:total});
}
const getCustomers=async (req,res)=>{
    try{
        const data=await user.find({});
        res.send(data);
    }catch(err)
    {
        res.send("can't load customers data");
    }
}
const logout=(req,res)=>{
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
    });
    res.redirect("/index");
}
const getCandidateByEmail=async(req,res)=>{
const {email}=req.query;
try{
const candidate=await candidateModel.findOne({Email:email});
if(!candidate){
return res.status(404).json({error:"Candidate not found"});
}
res.json(candidate);
}catch(err){
console.error("Error fetching candidate:",err);
res.status(500).json({error:err.message});
}
}
const contact=async (req,res)=>{
    const body=req.body;
    try{
        const target=await con.create({
            Name:body.name,
            Email:body.email,
            Subject:body.subject,
            Message:body.message,
            Date:body.date,
            Status:body.status
        })
        res.send("Your message has been sent");
    }catch(err)
    {
        console.log("error of contact : ",err);
        res.send("Unable to send the message ! Try again later");
    }
}
const getContact=async (req,res)=>{
    const data=await con.find({});
    res.json(data);
}
const changeStatus=async (req,res)=>{
    const body=req.body;
    try{
        const target=await con.findByIdAndUpdate(
            body.id,
            {Status:body.status},
            {new:true}
        );
        res.send("changed !");
    }catch(err)
    {
        res.send(err);
    }
    console.log("stats : ",body);
}
const deletemesg=async (req,res)=>{
    const body=req.body;
    try{
        const target=await con.findByIdAndDelete(body.id,{new:true});
        res.send("Message deleted successfully");
    }catch(err)
    {
        res.send("Unable to delete Message ! try again later");
        console.log("delete mesg error : ",err);
    }
}
module.exports = {
  addData,
  loginUser,
  userSpecific,
  loader,
  admin,
  getData,
  getCustomers,
  logout,
  contact,
  getContact,
  changeStatus,
  deletemesg,
  upload,
  addCompany,
  addInternship,
  updateProfile,
  getCandidateByEmail
};
