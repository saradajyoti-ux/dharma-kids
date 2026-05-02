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
  return chunk && (chunk.text || chunk.content) && chunk.embedding;
});

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

const modeInstructions = {
  simple: `
Mode: Simple Explanation
- Explain in 3 to 5 short sentences.
- Use very simple words.
- Speak gently, like a loving teacher.
- Explain Sanskrit words in plain English.
- End with one small reflection question.
`,
  story: `
Mode: Story
- Turn the teaching into a gentle short story for a child.
- Keep the story short.
- Use warm, simple language.
- Do not invent new teachings.
- End with one small reflection question.
`,
  quiz: `
Mode: Quiz
- Create 3 simple quiz questions for a child.
- Give the answer after each question.
- Keep the tone kind and encouraging.
- Use only the Gospel context.
`
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      answer: "Only POST requests are allowed."
    });
  }

  const {
    question,
    childName,
    childAge,
    childLevel,
    mode = "simple",
    parentMode
  } = req.body || {};

  if (!question || question.length > 500) {
    return res.status(400).json({
      answer: "Please ask a shorter question."
    });
  }

  try {
    const selectedMode = modeInstructions[mode] || modeInstructions.simple;
    const questionEmbedding = await embed(question);

    const topChunks = chunks
      .map(chunk => ({
        ...chunk,
        score: cosine(questionEmbedding, chunk.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const context = topChunks
      .map(chunk => chunk.text || chunk.content)
      .join("\n\n---\n\n");

    const prompt = `
You are a warm Sri Ramakrishna guide for children.

Child profile:
Name: ${childName || "Guest"}
Age: ${childAge || "Unknown"}
Level: ${childLevel || "General"}

Adapt your answer:
- Young Child or age 4-7: very simple, short, gentle answer.
- Older Child or age 8-12: simple but with a little more explanation.
- Teen or age 13+: thoughtful but clear answer.

Rules:
- Answer only from the Gospel context below.
- Do not use outside knowledge.
- Keep answers kind, safe, and age-appropriate.
- Avoid scary or harsh language.
- When possible, include a short phrase from Sri Ramakrishna from the context.
- If the context does not clearly answer, say exactly:
"I do not know from the materials I have. Please ask your teacher."

${parentMode === "true" ? `
Parent / Teacher Mode is ON.

After the child-friendly answer, add:

Parent / Teacher Note:
- Give a slightly deeper explanation for an adult.
- Suggest one discussion question an adult can ask the child.
- Keep it respectful and practical.
` : ""}

${selectedMode}

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
      answer:
        response.text ||
        "I do not know from the materials I have. Please ask your teacher."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      answer: "Sorry, I could not answer right now."
    });
  }
}
