const express = require("express");
const { analyzeResume } = require("../Controllers/atsController");
const { upload, checkPDFResume } = require("../Controllers/pdfATSController");

const router = express.Router();

router.post("/analyze", analyzeResume);
router.post("/checkPDF", upload.single('resume'), checkPDFResume);

module.exports = router;
