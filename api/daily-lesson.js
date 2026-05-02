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

function getDayNumber() {
  const now = new Date();
  return Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
}

function pickDailyChunks() {
  const day = getDayNumber();
  const selected = [];

  for (let i = 0; i < 6; i++) {
    const index = (day * 7 + i * 17) % chunks.length;
    selected.push(chunks[index]);
  }

  return selected;
}

export default async function handler(req, res) {
  try {
    const selectedChunks = pickDailyChunks();

    const context = selectedChunks
      .map(chunk => `Source: ${chunk.source}\n${chunk.text}`)
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
- If the context is unclear, choose a simpler teaching from the context.

Gospel context:
${context}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });

    res.status(200).json({
      lesson: response.text
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      lesson: "Sorry, I could not create today’s lesson right now."
    });
  }
}
