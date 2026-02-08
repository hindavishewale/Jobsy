const express = require("express");
const handler = require("../Controllers/handler");
const router = express.Router();
const jwt = require("jsonwebtoken");
const sec = process.env.secret_key;
function validateUser(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/register");
  jwt.verify(token, sec, (err, user) => {
    if (err) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}
router.post("/signup", handler.upload.single("Resume"), handler.addData);
router.post("/signup/company",handler.addCompany);
router.post("/signin", handler.loginUser);
router.post("/internships",handler.addInternship);
router.get("/getUser",validateUser,handler.loader);
router.get("/getCandidateByEmail",handler.getCandidateByEmail);
router.post("/updateProfile",validateUser,handler.updateProfile);
router.get("/admin", validateUser, handler.admin);
router.get("/user/:pge", validateUser, handler.userSpecific);
router.get("/loadData/profile", validateUser, handler.loader);
router.get("/dashboard", validateUser, handler.getData);
router.get("/getCustomers", handler.getCustomers);
router.post("/contact", handler.contact);
router.get("/getContact", handler.getContact);
router.post("/changeStatus", handler.changeStatus);
router.post("/deletemesg", handler.deletemesg);
router.get("/logout", handler.logout);
module.exports = router;
