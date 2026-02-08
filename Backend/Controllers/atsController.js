const candidateModel = require('../Model/candidate');

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

async function analyzeResume(req, res) {
    try {
        const { email, jobDescription } = req.body;
        const candidate = await candidateModel.findOne({ Email: email });
        if (!candidate) return res.json({ success: false, error: 'Candidate not found' });
        
        if (!candidate.Resume || candidate.Resume.trim() === '') {
            return res.json({ success: false, error: 'No resume uploaded' });
        }
        
        const resume = `${candidate.Skills} ${candidate.Education} ${candidate.Major}`;
        const atsScore = calculateATSScore(resume, jobDescription);
        const missingKeywords = extractMissingKeywords(resume, jobDescription);
        
        res.json({ success: true, atsScore, missingKeywords });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
}

module.exports = { analyzeResume };
