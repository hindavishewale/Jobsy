require("dotenv").config();
const { HfInference } = require("@huggingface/inference");
const Candidate = require("../Model/candidate");
const Internship = require("../Model/internships");
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const hf = new HfInference(HUGGINGFACE_API_KEY);
const MODEL_CONFIG = {
  primary: "harshlaghave/fine-tuned-internship-model",
  fallback: "sentence-transformers/all-MiniLM-L6-v2"
};
const SIMILARITY_CONFIG = {
  minExpected: 0.3,
  maxExpected: 0.8,
  boostFactor: 1.5,
  minThreshold: 0.1
};
async function getBERTEmbedding(text, retryWithFallback = true) {
  try {
    console.log(`Attempting to get embedding using model: ${MODEL_CONFIG.primary}`);
    const embedding = await hf.featureExtraction({
      model: MODEL_CONFIG.primary,
      inputs: [text]
    });
    console.log("BERT Embedding Response received successfully");
    if (Array.isArray(embedding)) {
      if (Array.isArray(embedding[0])) {
        return { embedding: embedding[0], model: MODEL_CONFIG.primary };
      }
      return { embedding: embedding, model: MODEL_CONFIG.primary };
    }
    console.error("BERT embedding failed - unexpected format:", embedding);
    throw new Error("BERT embedding failed - unexpected format");
  } catch (error) {
    console.error(`Error with primary model (${MODEL_CONFIG.primary}):`, error.message);
    if (retryWithFallback) {
      console.log(`Falling back to model: ${MODEL_CONFIG.fallback}`);
      return await getBERTEmbeddingWithFallback(text);
    }
    throw error;
  }
}
async function getBERTEmbeddingWithFallback(text) {
  try {
    console.log(`Using fallback model: ${MODEL_CONFIG.fallback}`);
    const embedding = await hf.featureExtraction({
      model: MODEL_CONFIG.fallback,
      inputs: [text]
    });
    console.log("Fallback BERT Embedding Response received successfully");
    if (Array.isArray(embedding)) {
      if (Array.isArray(embedding[0])) {
        return { embedding: embedding[0], model: MODEL_CONFIG.fallback };
      }
      return { embedding: embedding, model: MODEL_CONFIG.fallback };
    }
    throw new Error("Fallback embedding failed - unexpected format");
  } catch (error) {
    console.error("Error with fallback model:", error);
    throw error;
  }
}
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB) {
    console.error("One or both vectors are undefined/null");
    return NaN;
  }
  const flatVecA = Array.isArray(vecA[0]) ? vecA[0] : vecA;
  const flatVecB = Array.isArray(vecB[0]) ? vecB[0] : vecB;
  if (flatVecA.length !== flatVecB.length) {
    console.error(`Vector length mismatch: ${flatVecA.length} vs ${flatVecB.length}`);
    return NaN;
  }
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < flatVecA.length; i++) {
    dot += flatVecA[i] * flatVecB[i];
    magA += flatVecA[i] * flatVecA[i];
    magB += flatVecB[i] * flatVecB[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) {
    console.error("Magnitude is zero for one vector");
    return NaN;
  }
  const similarity = dot / (magA * magB);
  return similarity;
}
function calibrateSimilarityScore(rawSimilarity, modelType) {
  if (isNaN(rawSimilarity) || rawSimilarity <= 0) return 0;
  let calibrated = rawSimilarity;
  if (modelType === MODEL_CONFIG.primary) {
    calibrated = Math.pow(rawSimilarity, 0.7);
    calibrated = calibrated * SIMILARITY_CONFIG.boostFactor;
  } else {
    calibrated = Math.pow(rawSimilarity, 0.8);
  }
  calibrated = Math.max(0, Math.min(1, calibrated));
  console.log(`Similarity calibration: ${rawSimilarity.toFixed(4)} -> ${calibrated.toFixed(4)}`);
  return calibrated;
}
function preprocessText(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function createCandidateText(candidate) {
  return preprocessText(`
    ${candidate.Education} in ${candidate.Major}
    Skills: ${candidate.Skills}
    Experience: ${candidate.Experience || 'No experience'}
    Location: ${candidate.Location}
    College: ${candidate.College}
  `);
}
function createInternshipText(internship) {
  return preprocessText(`
    ${internship.internshipTitle}
    Description: ${internship.description}
    Required Skills: ${internship.skills.join(", ")}
    Eligibility: ${internship.eligibility.join(", ")}
    Stream: ${internship.stream}
    Location: ${internship.location}
  `);
}
function calculateAdditionalMatchFactors(candidate, internship) {
  let additionalScore = 0;
  if (candidate.Location.toLowerCase() === internship.location.toLowerCase()) {
    additionalScore += 0.2;
  }
  const candidateMajor = candidate.Major.toLowerCase();
  const internshipStream = internship.stream.toLowerCase();
  if (candidateMajor === internshipStream) {
    additionalScore += 0.15;
  }
  if (candidate.Skills && internship.skills) {
    const candidateSkills = candidate.Skills.toLowerCase().split(/[,\s]+/);
    const internshipSkills = internship.skills.map(s => s.toLowerCase());
    const commonSkills = candidateSkills.filter(skill =>
      internshipSkills.some(is => is.includes(skill) || skill.includes(is))
    );
    if (commonSkills.length > 0) {
      additionalScore += (commonSkills.length / Math.max(candidateSkills.length, internshipSkills.length)) * 0.15;
    }
  }
  return Math.min(additionalScore, 0.5);
}
async function matchInternships(candidateEmail) {
  try {
    const candidate = await Candidate.findOne({ Email: candidateEmail });
    if (!candidate) {
      console.log("Candidate not found with email:", candidateEmail);
      return [];
    }
    console.log("Found candidate:", candidate.Name, "Major:", candidate.Major, "Location:", candidate.Location);
    const allInternships = await Internship.find({});
    console.log(`Total internships in database: ${allInternships.length}`);
    const filteredInternships = allInternships.filter(internship => {
      const locationMatch = internship.location.toLowerCase() === candidate.Location.toLowerCase();
      const candidateMajor = candidate.Major.toLowerCase();
      const internshipStream = internship.stream.toLowerCase();
      const streamMatch =
        candidateMajor === internshipStream ||
        (candidateMajor === 'cs' && internshipStream === 'it') ||
        (candidateMajor === 'it' && internshipStream === 'cs') ||
        internshipStream.includes(candidateMajor) ||
        candidateMajor.includes(internshipStream);
      return locationMatch || streamMatch;
    });
    console.log(`After flexible filtering: ${filteredInternships.length} internships`);
    if (filteredInternships.length === 0) {
      console.log("No internships passed the location/stream filter");
      return [];
    }
    const candidateString = createCandidateText(candidate);
    console.log("Candidate string for BERT:", candidateString);
    const candidateEmbeddingResult = await getBERTEmbedding(candidateString);
    console.log(`Candidate embedding length: ${candidateEmbeddingResult.embedding.length} (using model: ${candidateEmbeddingResult.model})`);
    const results = [];
    for (let internship of filteredInternships) {
      const internshipString = createInternshipText(internship);
      console.log("Internship string for BERT:", internship.internshipTitle);
      try {
        const internshipEmbeddingResult = candidateEmbeddingResult.model === MODEL_CONFIG.primary
          ? await getBERTEmbedding(internshipString, false)
          : await getBERTEmbeddingWithFallback(internshipString);
        console.log(`Internship embedding length: ${internshipEmbeddingResult.embedding.length}`);
        const rawSimilarity = cosineSimilarity(candidateEmbeddingResult.embedding, internshipEmbeddingResult.embedding);
        const calibratedSimilarity = calibrateSimilarityScore(rawSimilarity, candidateEmbeddingResult.model);
        const additionalScore = calculateAdditionalMatchFactors(candidate, internship);
        const finalSimilarity = Math.min(1, calibratedSimilarity + additionalScore);
        const matchPercentage = isNaN(finalSimilarity) ? 0 : Math.max(0, finalSimilarity * 100);
        console.log(`Similarity for ${internship.internshipTitle}:`);
        console.log(`  Raw: ${(rawSimilarity * 100).toFixed(2)}%`);
        console.log(`  Calibrated: ${(calibratedSimilarity * 100).toFixed(2)}%`);
        console.log(`  Additional: ${(additionalScore * 100).toFixed(2)}%`);
        console.log(`  Final: ${matchPercentage.toFixed(2)}%`);
        results.push({
          internship,
          matchPercentage: matchPercentage.toFixed(2),
          rawSimilarity: rawSimilarity,
          calibratedSimilarity: calibratedSimilarity,
          additionalScore: additionalScore,
          modelUsed: candidateEmbeddingResult.model
        });
      } catch (error) {
        console.error(`Error processing internship ${internship.internshipTitle}:`, error);
        results.push({
          internship,
          matchPercentage: "0.00",
          rawSimilarity: 0,
          calibratedSimilarity: 0,
          additionalScore: 0,
          modelUsed: "error"
        });
      }
    }
    const filteredResults = results.filter(result => result.rawSimilarity > SIMILARITY_CONFIG.minThreshold);
    filteredResults.sort((a, b) => {
      const scoreA = parseFloat(a.matchPercentage);
      const scoreB = parseFloat(b.matchPercentage);
      return scoreB - scoreA;
    });
    console.log(`Matching completed. Found ${filteredResults.length} qualified results.`);
    filteredResults.slice(0, 3).forEach((result, index) => {
      console.log(`Top match ${index + 1}: ${result.internship.internshipTitle} - ${result.matchPercentage}%`);
    });
    return filteredResults.slice(0, 3);
  } catch (error) {
    console.error("Error in matchInternships:", error);
    throw error;
  }
}
async function getMatchedInternships(req, res) {
  try {
    const candidateEmail = req.body.email;
    if (!candidateEmail) {
      return res.status(400).send("Email is required");
    }
    console.log("Matching internships for email:", candidateEmail);
    const matched = await matchInternships(candidateEmail);
    res.status(200).json(matched);
  } catch (err) {
    console.error("Error matching internships:", err);
    res.status(500).send("Error matching internships");
  }
}
module.exports = { getMatchedInternships };
