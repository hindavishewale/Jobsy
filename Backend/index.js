require("dotenv").config();   

const express=require("express");
const path=require("path");
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");



const app=express();

const sec = process.env.secret_key;

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


function validateUser(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    jwt.verify(token, sec, (err, user) => {

        if (err) {
            res.clearCookie("token", {
                httpOnly: true,
                secure: true,
                sameSite: "strict"
            });
            console.log("validation error : ",err);

            return res.sendStatus(403);
        };
        req.user = user; // decoded payload
        console.log("data from token:", user);
        console.log("user.email :", user.email);
        console.log("password :",user.password)
        next();
    });
}
function validateAdmin(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    jwt.verify(token, sec, (err, user) => {
        if (err) {
            res.clearCookie("token", {
                httpOnly: true,
                secure: true,
                sameSite: "strict"
            });

            return res.sendStatus(403);
        };
        req.user = user; // decoded payload
        console.log("data from token:", user);
        console.log("user.email :", user.email);
        if(user.email==process.env.GOV_EMAIL)
        {

            next();
        }else{
            // res.send("access forbidden !");
            res.sendStatus(403).send("Access Forbidden");
        }
    });
}

app.get("/government.html",validateAdmin,(req,res)=>{
    res.sendFile(path.join(__dirname, '..', 'pm_dashboards_v2', `government.html`));
    // res.send("admin page");
})

app.get("/candidate.html",validateUser,(req,res)=>{
    res.sendFile(path.join(__dirname, '..', 'pm_dashboards_v2', `candidate.html`));
})


app.use(express.static(path.join(__dirname, '..','pm_dashboards_v2')));

app.get("/",(req,res)=>{
    // res.sendFile(path.join(__dirname, '..', 'pm_dashboards_v2', 'index.html'));
    res.redirect("/index.html");
    // res.send("hello world");

});

app.get("/validateUser",validateUser,(req,res)=>{
    res.send("success");
})

app.get("/admin",(req,res)=>{
    res.redirect("/admin.html");
})

app.use("/api/parse-resume",pdf);
app.use("/api",route);



app.get('/:page', (req, res) => {
   
    // console.log("page :: ",req.params.page);
    if (req.params.page.includes('.'))
        {
            return res.status(404).send('Not found');
        } 

    res.sendFile(path.join(__dirname, '..','pm_dashboards_v2', `${req.params.page}.html`));
});

app.listen(3400,()=>{
    console.log("Server started at 3400");
})
