const express=require("express");
const handler=require("../Controllers/quizController");
const router=express.Router();
router.post("/saveResult",handler.saveQuizResult);
router.get("/getResults",handler.getQuizResults);
module.exports=router;
