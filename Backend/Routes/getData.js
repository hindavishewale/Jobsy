// Routes/route.js
const express = require("express");
const handler = require("../Controllers/getData");

const router = express.Router();

router.get("/getCompany",handler.comp);

router.get("/getInternships",handler.internships);


module.exports = router;
