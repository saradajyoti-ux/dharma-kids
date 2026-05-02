import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PDF_FILES = [
  "gospel-part-1.pdf",
  "gospel-part-2.pdf",
  "gospel-part-3.pdf",
  "gospel-part-4.pdf"
];

function chunkText(text, size = 1200, overlap = 200) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

async function embed(text) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text
  });

  return result.embeddings[0].values;
}

const allChunks = [];

for (const file of PDF_FILES) {
  const filePath = path.join(process.cwd(), "sources", file);
  const buffer = fs.readFileSync(filePath);
  const parsed = await pdf(buffer);

  const chunks = chunkText(parsed.text);

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Embedding ${file} chunk ${i + 1}/${chunks.length}`);

    allChunks.push({
      id: `${file}-${i}`,
      source: file,
      text: chunks[i],
      embedding: await embed(chunks[i])
    });
  }
}

fs.writeFileSync(
  path.join(process.cwd(), "sources", "ramakrishna-chunks.json"),
  JSON.stringify(allChunks)
);

console.log("Done: sources/ramakrishna-chunks.json");
