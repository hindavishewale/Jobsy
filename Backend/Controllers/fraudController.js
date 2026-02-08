const checkFraud = async (req, res) => {
  try {
    const data = req.body;
    let score = 0;
    let reasons = [];

    // Email Checks
    if (!data.email) {
      score += 20;
      reasons.push("No official contact email provided");
    } else if (
      data.email.includes("gmail") ||
      data.email.includes("yahoo") ||
      data.email.includes("outlook")
    ) {
      score += 15;
      reasons.push("Personal email domain used instead of company email");
    }

    // Website Check
    if (!data.website || data.website.trim() === "") {
      score += 15;
      reasons.push("No official company website");
    }

    // Unrealistic Stipend
    if (data.stipend && data.stipend > 50000) {
      score += 15;
      reasons.push("Unrealistic stipend for an internship role");
    }

    // Poor Job Description
    if (!data.description || data.description.length < 100) {
      score += 10;
      reasons.push("Very short or vague job description");
    }

    // Scam Keywords
    const scamWords = [
      "earn fast",
      "quick money",
      "no interview",
      "100% placement",
      "limited seats"
    ];

    scamWords.forEach(word => {
      if (data.description?.toLowerCase().includes(word)) {
        score += 10;
        reasons.push(`Suspicious phrase detected: "${word}"`);
      }
    });

    // Location Check
    if (!data.location) {
      score += 5;
      reasons.push("Office location not specified");
    }

    // Contact Number Check
    if (!data.phone) {
      score += 5;
      reasons.push("No contact phone number provided");
    }

    // Final Risk Level
    let level = "Low";
    if (score >= 60) level = "High";
    else if (score >= 30) level = "Medium";

    res.json({
      riskLevel: level,
      riskScore: score,
      reasons
    });

  } catch (err) {
    res.status(500).json({
      error: "Fraud check failed",
      details: err.message
    });
  }
};

module.exports = { checkFraud };
