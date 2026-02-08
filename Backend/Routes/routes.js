const express = require("express");
const { getMatchedInternships } = require("../Controllers/bert");
const router = express.Router();
router.post("/matchInternships", getMatchedInternships);
module.exports = router;
