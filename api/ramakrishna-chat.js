import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const PDF_FILES = [
  "gospel-part-1.pdf",
  "gospel-part-2.pdf",
  "gospel-part-3.pdf",
  "gospel-part-4.pdf"
];

function readPdf(filename) {
  const pdfPath = path.join(process.cwd(), "sources", filename);
  const pdfBuffer = fs.readFileSync(pdfPath);

  return {
    inlineData: {
      mimeType: "application/pdf",
      data: pdfBuffer.toString("base64")
    }
  };
}

async function askPdf(filename, question, childName, childAge, childLevel) {
  const pdf = readPdf(filename);

  const prompt = `
You are a warm Sri Ramakrishna guide for children.

Child profile:
Name: ${childName || "Guest"}
Age: ${childAge || "Unknown"}
Level: ${childLevel || "General"}

Rules:
- Answer ONLY from this PDF.
- Do not use outside knowledge.
- Keep answers short, gentle, and age-appropriate.
- If the answer is not clearly in this PDF, say exactly:
"I do not know from the materials I have. Please ask your teacher."

Child question:
${question}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [pdf, prompt]
  });

  return response.text || "";
}

function isUnknown(answer) {
  return (
    !answer ||
    answer.toLowerCase().includes("i do not know from the materials i have")
  );
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
    for (const file of PDF_FILES) {
      const answer = await askPdf(
        file,
        question,
        childName,
        childAge,
        childLevel
      );

      if (!isUnknown(answer)) {
        return res.status(200).json({ answer });
      }
    }

    return res.status(200).json({
      answer: "I do not know from the materials I have. Please ask your teacher."
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      answer: "Sorry, I could not answer right now."
    });
  }
}
