const express = require("express");
const { checkFraud } = require("../Controllers/fraudController");

const router = express.Router();

router.post("/check", checkFraud);

module.exports = router;
