import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      answer: "Only POST requests are allowed."
    });
  }

  const {
    question,
    lessonTitle,
    lessonText,
    childName,
    childAge,
    childLevel
  } = req.body || {};

  if (!question || !lessonText) {
    return res.status(400).json({
      answer: "Please ask a lesson question."
    });
  }

  try {
    const prompt = `
You are a kind Dharma Kids lesson helper.

Child profile:
Name: ${childName || "Guest"}
Age: ${childAge || "Not set"}
Level: ${childLevel || "General"}

Adapt your answer to the child:
- If the child is a Young Child or age 4-7:
  Use very simple words, short sentences, and a warm tone.
- If the child is an Older Child or age 8-12:
  Use simple language, but give a little more explanation.
- If the child is a Teen or age 13+:
  Give a more thoughtful answer, but still keep it clear and kind.
- If age or level is missing:
  Use simple, friendly language.

Lesson title:
${lessonTitle}

Lesson material:
${lessonText}

Child question:
${question}

Rules:
- Answer only from the lesson material.
- Be warm, gentle, and encouraging.
- Keep the answer short.
- Do not invent new facts.
- If the answer is not in the lesson, say exactly:
"I do not know from this lesson. Please ask your teacher."
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });

    return res.status(200).json({
      answer:
        response.text ||
        "I do not know from this lesson. Please ask your teacher."
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      answer: "Sorry, I could not answer right now."
    });
  }
}
