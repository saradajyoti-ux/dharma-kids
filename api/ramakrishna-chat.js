import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ragData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "sources", "ramakrishna-chunks.json"), "utf8")
);

const chunks = Array.isArray(ragData) ? ragData : ragData.chunks;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have",
  "he", "her", "him", "his", "i", "in", "is", "it", "me", "my", "of", "on", "or", "our",
  "she", "sir", "so", "that", "the", "their", "them", "then", "there", "they", "this",
  "to", "was", "we", "were", "what", "when", "where", "who", "why", "with", "you", "your"
]);

function words(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

function scoreChunk(questionTerms, chunk) {
  const text = chunk.text.toLowerCase();
  let score = 0;

  for (const term of questionTerms) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    const matches = text.match(re);
    if (matches) score += matches.length;
  }

  // Small boost when important Dharma terms appear exactly.
  for (const term of questionTerms) {
    if (["god", "mother", "kali", "maya", "bhakti", "devotion", "jnana", "guru", "samadhi", "truth"].includes(term) && text.includes(term)) {
      score += 3;
    }
  }

  return score;
}

function retrieve(question, limit = 7) {
  const terms = [...new Set(words(question))];
  if (terms.length === 0) return [];

  return chunks
    .map(chunk => ({ ...chunk, score: scoreChunk(terms, chunk) }))
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ answer: "Only POST requests are allowed." });
  }

  const { question, childName, childAge, childLevel } = req.body || {};

  if (!question || question.length > 500) {
    return res.status(400).json({ answer: "Please ask a shorter question." });
  }

  try {
    const topChunks = retrieve(question, 7);

    if (topChunks.length === 0) {
      return res.status(200).json({
        answer: "I do not know from the materials I have. Please ask your teacher."
      });
    }

    const context = topChunks
      .map(chunk => `Source: ${chunk.source}, pages ${chunk.pageStart}-${chunk.pageEnd}\n${chunk.text}`)
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
- Do not mention page numbers unless the child asks for sources.
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
    return res.status(500).json({ answer: "Sorry, I could not answer right now." });
  }
}
