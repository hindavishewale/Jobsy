const mongoose = require("mongoose");
mongoose.connect("process.env.MONGO_URI")
.then(()=>{console.log("Mongo connected for internships")})
.catch((err)=>console.log("error of mongo internships : ",err))
const internshipSchema = new mongoose.Schema(
  {
    internshipTitle: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    stipend: {
      type: Number,
      required: true,
      min: 0,
    },
    stream: {
      type: String,
      required: true,
      trim: true,
    },
    eligibility: {
      type: [String],
      required: true,
      set: (eligibility) => eligibility.map((s) => s.trim()),
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      required: true,
      set: (skills) => skills.map((s) => s.trim()),
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  { timestamps: true }
);
const InternshipModel=mongoose.model("Internship", internshipSchema);
module.exports=InternshipModel;
