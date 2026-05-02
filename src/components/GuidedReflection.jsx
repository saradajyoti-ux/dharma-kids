import React, { useEffect, useMemo, useState } from "react";

const REFLECTIONS = [
  {
    id: "gratitude",
    title: "Gratitude Garden",
    emoji: "🌸",
    avatar: "🐘",
    age: "Ages 5–10",
    theme: "Gratitude",
    intro:
      "Let’s notice the good things around us, like flowers growing in a garden.",
    steps: [
      "What is one thing that made you smile today?",
      "Who helped you or showed you kindness?",
      "What is one thing you can say thank you for?"
    ]
  },
  {
    id: "calm",
    title: "Peaceful Breath",
    emoji: "🕯️",
    avatar: "🦚",
    age: "Ages 5–10",
    theme: "Calm",
    intro:
      "Let’s slow down and find a quiet place inside, like a still lake.",
    steps: [
      "Take 3 slow breaths. How does your body feel?",
      "What thought is floating in your mind right now?",
      "What can help you feel peaceful today?"
    ]
  },
  {
    id: "kindness",
    title: "Kindness Hero",
    emoji: "💛",
    avatar: "🐒",
    age: "Ages 6–12",
    theme: "Kindness",
    intro:
      "Every kind action is like a little light you share with the world.",
    steps: [
      "What kind thing did you do recently?",
      "How did it make you feel?",
      "What kind thing can you do tomorrow?"
    ]
  },
  {
    id: "courage",
    title: "Brave Little Light",
    emoji: "🔥",
    avatar: "🦁",
    age: "Ages 7–12",
    theme: "Courage",
    intro:
      "Courage means trying even when something feels difficult.",
    steps: [
      "What felt hard for you today?",
      "What helped you keep going?",
      "What brave step can you take next?"
    ]
  }
];

const MOODS = [
  { label: "Happy", emoji: "😊" },
  { label: "Calm", emoji: "😌" },
  { label: "Unsure", emoji: "🤔" },
  { label: "Sad", emoji: "😢" },
  { label: "Excited", emoji: "🤩" }
];

export default function GuidedReflection() {
  const [selectedId, setSelectedId] = useState("gratitude");
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState("");
  const [answers, setAnswers] = useState({});
  const [entries, setEntries] = useState([]);

  const reflection = useMemo(
    () => REFLECTIONS.find((item) => item.id === selectedId),
    [selectedId]
  );

  useEffect(() => {
    const saved = localStorage.getItem("guided-reflections");
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("guided-reflections", JSON.stringify(entries));
  }, [entries]);

  const currentAnswer = answers[step] || "";
  const progress = Math.round(((step + 1) / reflection.steps.length) * 100);

  function changeReflection(id) {
    setSelectedId(id);
    setStep(0);
    setMood("");
    setAnswers({});
  }

  function saveEntry() {
    const newEntry = {
      id: Date.now(),
      title: reflection.title,
      theme: reflection.theme,
      mood,
      avatar: reflection.avatar,
      date: new Date().toLocaleDateString(),
      answers: reflection.steps.map((question, index) => ({
        question,
        answer: answers[index] || ""
      }))
    };

    setEntries([newEntry, ...entries]);
    setStep(0);
    setMood("");
    setAnswers({});
  }

  function exportEntry(entry) {
    const text = `
${entry.title}
Date: ${entry.date}
Mood: ${entry.mood}

${entry.answers
  .map((item, index) => `${index + 1}. ${item.question}\n${item.answer}`)
  .join("\n\n")}
`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${entry.title.replaceAll(" ", "-")}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-orange-50 to-pink-50 p-4">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-orange-800">
            Guided Reflections
          </h1>
          <p className="mt-2 text-orange-700">
            Gentle self-awareness activities for kids.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          {REFLECTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => changeReflection(item.id)}
              className={`rounded-3xl border p-4 text-left shadow-sm transition hover:scale-[1.02] ${
                selectedId === item.id
                  ? "border-orange-400 bg-white"
                  : "border-orange-100 bg-white/70"
              }`}
            >
              <div className="text-4xl">{item.emoji}</div>
              <h2 className="mt-2 font-bold text-orange-900">{item.title}</h2>
              <p className="text-sm text-orange-700">{item.theme}</p>
              <p className="text-xs text-orange-500">{item.age}</p>
            </button>
          ))}
        </div>

        <main className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-5xl">
                {reflection.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-500">
                  {reflection.theme} Reflection
                </p>
                <h2 className="text-2xl font-bold text-orange-900">
                  {reflection.title}
                </h2>
                <p className="text-orange-700">{reflection.intro}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm text-orange-700">
                <span>
                  Step {step + 1} of {reflection.steps.length}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-orange-100">
                <div
                  className="h-3 rounded-full bg-orange-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {!mood && (
              <div className="mt-6">
                <h3 className="mb-3 text-lg font-bold text-orange-900">
                  How are you feeling today?
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {MOODS.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setMood(`${item.emoji} ${item.label}`)}
                      className="rounded-2xl bg-yellow-50 p-4 text-center shadow-sm hover:bg-yellow-100"
                    >
                      <div className="text-3xl">{item.emoji}</div>
                      <div className="mt-1 text-sm font-semibold text-orange-800">
                        {item.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mood && (
              <div className="mt-6">
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-orange-500">
                    Your guide asks:
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-orange-900">
                    {reflection.steps[step]}
                  </h3>
                </div>

                <textarea
                  value={currentAnswer}
                  onChange={(e) =>
                    setAnswers({ ...answers, [step]: e.target.value })
                  }
                  placeholder="Write or type your reflection here..."
                  className="mt-4 min-h-36 w-full rounded-2xl border border-orange-200 p-4 text-orange-900 outline-none focus:border-orange-400"
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                    className="rounded-full bg-orange-100 px-5 py-3 font-bold text-orange-700 disabled:opacity-40"
                  >
                    Back
                  </button>

                  {step < reflection.steps.length - 1 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="rounded-full bg-orange-500 px-5 py-3 font-bold text-white shadow-sm"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={saveEntry}
                      className="rounded-full bg-green-500 px-5 py-3 font-bold text-white shadow-sm"
                    >
                      Save Reflection
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-bold text-orange-900">
              Reflection Journal
            </h2>
            <p className="mt-1 text-sm text-orange-700">
              Saved reflections stay on this device.
            </p>

            <div className="mt-4 space-y-3">
              {entries.length === 0 && (
                <div className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-700">
                  No reflections saved yet.
                </div>
              )}

              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-orange-100 bg-yellow-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{entry.avatar}</div>
                    <div>
                      <h3 className="font-bold text-orange-900">
                        {entry.title}
                      </h3>
                      <p className="text-xs text-orange-600">
                        {entry.date} · {entry.mood}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => exportEntry(entry)}
                    className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm"
                  >
                    Export
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
