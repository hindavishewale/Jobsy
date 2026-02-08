const express=require("express");
const handler=require("../Controllers/notificationController");
const router=express.Router();
router.get("/getNotifications",handler.getNotifications);
router.post("/markAsRead",handler.markAsRead);
router.post("/create",handler.createNotification);
module.exports=router;
