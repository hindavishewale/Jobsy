require("dotenv").config();
const { HfInference } = require("@huggingface/inference");

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function testSentenceSimilarity(sent1, sent2) {
  try {
    const emb1 = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2", // valid HF sentence embedding model
      inputs: [sent1] // wrap as array
    });

    const emb2 = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: [sent2]
    });

    console.log("Embedding 1:", emb1);
    console.log("Embedding 2:", emb2);

    if (!Array.isArray(emb1) || !Array.isArray(emb2)) {
      throw new Error("Embedding fetch failed");
    }

    const similarity = cosineSimilarity(emb1[0], emb2[0]);
    console.log(`Similarity Score: ${similarity}`);
  } catch (error) {
    console.error("Error computing similarity:", error);
  }
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    console.error("Invalid vectors for cosine similarity");
    return NaN;
  }

  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) {
    console.error("Magnitude is zero for one vector");
    return NaN;
  }

  return dot / (magA * magB);
}

(async () => {
  const sentenceA = "I love programming in JavaScript";
  const sentenceB = "JavaScript coding is my passion";

  await testSentenceSimilarity(sentenceA, sentenceB);
})();
