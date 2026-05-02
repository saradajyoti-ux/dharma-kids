import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const rawChunks = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "sources", "ramakrishna-chunks.json"),
    "utf8"
  )
);

function normalizeChunks(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data.chunks)) return data.chunks;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;

  return Object.values(data).filter(item => item && typeof item === "object");
}

const chunks = normalizeChunks(rawChunks).filter(chunk => {
  return chunk && (chunk.text || chunk.content);
});

function pickDailyChunks() {
  const day = Math.floor(Date.now() / 86400000);

  return [0, 1, 2, 3, 4, 5]
    .map(i => chunks[(day + i * 23) % chunks.length])
    .filter(chunk => chunk && (chunk.text || chunk.content));
}

export default async function handler(req, res) {
  try {
    const selectedChunks = pickDailyChunks();

    if (!selectedChunks.length) {
      return res.status(500).json({
        lesson: "Sorry, I could not find today’s lesson material."
      });
    }

    const context = selectedChunks
      .map(chunk => chunk.text || chunk.content)
      .join("\n\n---\n\n");

    const prompt = `
You are creating today's Dharma Kids lesson for children.

Use only the Gospel context below.

Create a daily lesson with exactly these sections:

🌞 Today's Teaching
A short teaching from Sri Ramakrishna in simple words.

🪷 Simple Explanation
Explain it gently for a child in 3-5 sentences.

💭 Reflection Question
Ask one thoughtful question a child can think about today.

Rules:
- Be warm, simple, and child-friendly.
- Do not use outside knowledge.
- Avoid scary or harsh language.

Gospel context:
${context}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });

    return res.status(200).json({
      lesson: response.text || "Sorry, I could not create today’s lesson right now."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      lesson: "Sorry, I could not create today’s lesson right now."
    });
  }
}
