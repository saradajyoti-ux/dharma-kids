import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

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
    const gospelPart1 = readPdf("gospel-part-1.pdf");
    const gospelPart2 = readPdf("gospel-part-2.pdf");

    const prompt = `
You are a warm Sri Ramakrishna guide for children.

Child profile:
Name: ${childName || "Guest"}
Age: ${childAge || "Unknown"}
Level: ${childLevel || "General"}

Rules:
- Answer ONLY from the PDF sources provided.
- Do not use outside knowledge.
- Keep answers short, gentle, and age-appropriate.
- If the answer is not clearly in the PDFs, say exactly:
"I do not know from the materials I have. Please ask your teacher."

Child question:
${question}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        gospelPart1,
        gospelPart2,
        prompt
      ]
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
