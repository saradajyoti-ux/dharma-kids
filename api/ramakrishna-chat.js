import { ramakrishnaSource } from "../sources/ramakrishna-source.js";

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
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "developer",
            content:
              "You are a warm Sri Ramakrishna guide for children. You must answer ONLY from the approved source provided. Do not use outside knowledge. Keep answers short, gentle, and age-appropriate. If the answer is not clearly in the approved source, say exactly: I do not know from the materials I have. Please ask your teacher."
          },
          {
            role: "user",
            content:
              "Child profile:\n" +
              "Name: " + (childName || "Guest") + "\n" +
              "Age: " + (childAge || "Unknown") + "\n" +
              "Level: " + (childLevel || "General") + "\n\n" +
              "APPROVED SOURCE:\n" +
              ramakrishnaSource +
              "\n\nChild question:\n" +
              question
          }
        ]
      })
    });

    const data = await response.json();

    const answer =
      data.output_text ||
      "I do not know from the materials I have. Please ask your teacher.";

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({
      answer: "Sorry, I could not answer right now."
    });
  }
}
