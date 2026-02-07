const candidate = require("../Model/candidate");
const internship=require("../Model/internships");
const company=require("../Model/company");

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

const internships=async(req,res)=>{
    const name=req.body.name;
    console.log("comp : ",name);
    try{
        const target=await internships.findOne({companyName:name});
        console.log("target :",target);
        res.json(target);
    }catch(err)
    {
        res.json({
            error:err
        });
    }
}



module.exports={
    comp,
    internships
}