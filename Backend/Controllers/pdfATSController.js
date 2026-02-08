const multer = require('multer');
const pdfParse = require('pdf-parse');

const upload = multer({ storage: multer.memoryStorage() });

function calculateATSScore(resume, jobDescription) {
    const resumeWords = resume.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const jobWords = jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const matched = jobWords.filter(word => resumeWords.includes(word));
    return Math.round((matched.length / jobWords.length) * 100);
}

function extractMissingKeywords(resume, jobDescription) {
    const resumeWords = new Set(resume.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const jobWords = jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const missing = [...new Set(jobWords.filter(word => !resumeWords.has(word)))];
    return missing.slice(0, 10);
}

async function checkPDFResume(req, res) {
    try {
        if (!req.file) {
            return res.json({ success: false, error: 'No PDF file uploaded' });
        }

        const { jobDescription } = req.body;
        if (!jobDescription) {
            return res.json({ success: false, error: 'Job description required' });
        }

        const pdfData = await pdfParse(req.file.buffer);
        const resumeText = pdfData.text;

        const atsScore = calculateATSScore(resumeText, jobDescription);
        const missingKeywords = extractMissingKeywords(resumeText, jobDescription);

        res.json({ success: true, atsScore, missingKeywords });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
}

module.exports = { upload, checkPDFResume };
