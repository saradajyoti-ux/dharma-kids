export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ answer: "Only POST requests allowed." });
  }

  const { question } = req.body || {};

  if (!question) {
    return res.status(400).json({ answer: "Please ask a question." });
  }

  const lessonContent = `
Lesson title: Loving God Within Us.

Main teaching:
God lives within us. We are here to love God, remember God, help others, and grow in kindness.

Important points:
- Saints teach us to think about God every day.
- The more we remember God, the more our love and faith grow.
- Sri Ramakrishna was known as Gadadhar when he was young.
- Young Gadadhar loved stories of Sri Ram and Sri Krishna.
- He made spiritual learning joyful.
- Kindness, prayer, truthfulness, and helping others help us feel close to God.

Glossary:
Sri Ramakrishna: A great saint revered by many as an incarnation of God.
Gadadhar: Sri Ramakrishna's childhood name.
Satsang: Holy company or spiritual gathering.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "developer",
            content:
              "You are a warm, safe lesson guide for children. Answer only from the provided lesson content. Keep answers short, gentle, and age-appropriate. If the question is unrelated to the lesson, say: 'That is a good question for your teacher.'"
          },
          {
            role: "user",
            content:
              lessonContent +
              "\n\nChild question: " +
              question
          }
        ]
      })
    });

    const data = await response.json();

    let answer = data.output_text;

    if (!answer && data.output && data.output[0]?.content?.[0]?.text) {
      answer = data.output[0].content[0].text;
    }

    if (!answer) {
      answer = "God lives within us, in our hearts. We remember God through kindness, prayer, and love.";
    }

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({
      answer: "Sorry, I could not answer right now."
    });
  }
}
