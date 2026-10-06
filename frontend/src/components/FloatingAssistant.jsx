import React, { useMemo, useState } from "react";

const suggestions = [
  ["Headache", "For headaches, start with a General Medicine doctor. If symptoms are severe or sudden, seek urgent medical care."],
  ["Skin problem", "A Dermatologist can help with common skin concerns. You can browse doctors by specialization from Find Doctors."],
  ["Joint pain", "An Orthopedist is a suitable starting point for persistent joint or musculoskeletal pain."],
  ["Child care", "For children, look for a Pediatrician. MediCare Connect can help you compare availability and book a visit."],
];

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", text: "Hi! I’m MediCare Assist. Tell me what you need help finding. I provide general guidance, not a diagnosis." }]);
  const [input, setInput] = useState("");
  const canned = useMemo(() => suggestions.reduce((a, [, v]) => ({ ...a, [v]: true }), {}), []);

  const ask = (text) => {
    const q = text.trim();
    if (!q) return;
    let answer = "I can help you find the right specialty, understand how booking works, or prepare questions for your doctor. I can’t diagnose conditions.";
    const lower = q.toLowerCase();
    if (lower.includes("head") || lower.includes("fever")) answer = suggestions[0][1];
    else if (lower.includes("skin")) answer = suggestions[1][1];
    else if (lower.includes("joint") || lower.includes("bone")) answer = suggestions[2][1];
    else if (lower.includes("child") || lower.includes("baby")) answer = suggestions[3][1];
    setMessages((m) => [...m, { role: "user", text: q }, { role: "bot", text: answer }]);
    setInput("");
  };

  return (
    <>
      {open && (
        <div className="assistant-panel fixed bottom-24 right-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border shadow-2xl">
          <div className="bg-brand-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div><p className="font-bold">MediCare Assist</p><p className="text-xs text-brand-100">Smart healthcare navigation</p></div>
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-2 py-1">×</button>
            </div>
          </div>
          <div className="assistant-messages flex-1 space-y-3 overflow-y-auto bg-white p-4">
            {messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"}`}>{m.text}</div></div>)}
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestions.map(([label, text]) => <button key={label} onClick={() => ask(text)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700">{label}</button>)}
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t bg-white p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="input" placeholder="Ask about finding a doctor..." />
            <button className="btn-primary">Send</button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} className="assistant-fab fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-xl text-white shadow-xl ring-4 ring-white/80" aria-label="Open MediCare Assist">✦</button>
    </>
  );
}
