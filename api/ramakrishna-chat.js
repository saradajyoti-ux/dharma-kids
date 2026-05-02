import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const chunks = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "sources", "ramakrishna-chunks.json"),
    "utf8"
  )
);

function cosine(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function embed(text) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text
  });

  return result.embeddings[0].values;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      answer: "Only POST requests are allowed."
    });
  }

  const { question, childName, childAge, childLevel } = req.body || {};

  if (!question || question.length > 500) {
    return res.status(400).json({
      answer: "Please ask a shorter question."
    });
  }

  try {
    const questionEmbedding = await embed(question);

    const topChunks = chunks
      .map(chunk => ({
        ...chunk,
        score: cosine(questionEmbedding, chunk.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const context = topChunks
      .map(chunk => `Source: ${chunk.source}\n${chunk.text}`)
      .join("\n\n---\n\n");

    const prompt = `
You are a warm Sri Ramakrishna guide for children.

Child profile:
Name: ${childName || "Guest"}
Age: ${childAge || "Unknown"}
Level: ${childLevel || "General"}

Rules:
- Answer only from the Gospel context below.
- Do not use outside knowledge.
- Keep answers short, gentle, and age-appropriate.
- If the context does not clearly answer, say exactly:
"I do not know from the materials I have. Please ask your teacher."

Gospel context:
${context}

Child question:
${question}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });

    return res.status(200).json({
      answer: response.text || "I do not know from the materials I have. Please ask your teacher."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      answer: "Sorry, I could not answer right now."
    });
  }
}
