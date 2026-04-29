export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { question, lessonTitle } = req.body || {};

  if (!question || question.length > 500) {
    return res.status(400).json({
      answer: "Please ask a shorter lesson question."
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
              "You are a safe, warm Hinduism lesson guide for children. Answer only using the lesson theme. Keep answers short, kind, age-appropriate, and non-argumentative. If asked something outside the lesson, say: 'That is a good question for your teacher.' Do not discuss politics, adult topics, violence, or anything unsafe."
          },
          {
            role: "user",
            content: `Lesson: ${lessonTitle || "Dharma Kids lesson"}\nChild question: ${question}`
          }
        ]
      })
    });

    const data = await response.json();

    const answer =
      data.output_text ||
      "I’m not sure. Please ask your teacher.";

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({
      answer: "Sorry, I could not answer right now. Please try again later."
    });
  }
}
