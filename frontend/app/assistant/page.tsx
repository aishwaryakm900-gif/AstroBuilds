"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  BrainCircuit,
  User as UserIcon,
  Sparkles,
  Loader2,
  RefreshCw
} from "lucide-react";

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChatHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("http://localhost:8000/api/assistant/history", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const formatted = data.flatMap((chat: any) => [
            { sender: "user", text: chat.message },
            { sender: "ai", text: chat.response }
          ]);
          setMessages(formatted);
        } else {
          setMessages([
            { sender: "ai", text: "Hello! I am AstroBuilds AI, your procurement copilot. Ask me about vendor reliability, delayed deliveries, invoice verification, or the best supplier for a material order." }
          ]);
        }
      }
    } catch (err: any) {
      setMessages([
        { sender: "ai", text: "I’m offline right now, but I can still help you with procurement queries once the backend is reachable." }
      ]);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query) return;

    setMessages(prev => [...prev, { sender: "user", text: query }]);
    setInput("");
    setSending(true);

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8000/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: query })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: "ai", text: data.response }]);
      } else {
        throw new Error();
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: "ai", text: "I couldn’t reach the procurement knowledge base. I can still guide you with the current project context and vendor data once the service is available." }]);
    } finally {
      setSending(false);
    }
  };

  const sampleQuestions = [
    "Which vendors quoted the lowest steel price?",
    "Which invoices are pending?",
    "Show contracts expiring this month",
    "Compare all quotations for cement",
    "Recommend the best supplier"
  ];

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col h-screen">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center">
            <Sparkles className="h-5 w-5 text-orange-500 mr-2" />
            <span>Procurement AI Copilot</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ask about vendor scoring, purchase order delays, invoice approvals, and contract risk</p>
        </div>
        <button
          onClick={fetchChatHistory}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
          <span>Clear History</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 max-w-3xl ${m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            <div className={`p-2 rounded-xl border shrink-0 ${m.sender === "user" ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "bg-slate-900 border-slate-850 text-slate-350"}`}>
              {m.sender === "user" ? <UserIcon className="h-4.5 w-4.5" /> : <BrainCircuit className="h-4.5 w-4.5 text-orange-500" />}
            </div>
            <div className={`p-4 rounded-2xl text-xs leading-relaxed font-medium ${m.sender === "user" ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/5 rounded-tr-none" : "bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none whitespace-pre-line"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-start gap-3 max-w-3xl mr-auto">
            <div className="bg-slate-900 border border-slate-850 p-2 rounded-xl text-slate-350 shrink-0">
              <BrainCircuit className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2 text-xs text-slate-400 font-medium">
              <Loader2 className="h-4.5 w-4.5 animate-spin text-orange-400" />
              <span>AI is scanning procurement records...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="border-t border-slate-900 p-6 space-y-4 bg-slate-950/40 backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={sending}
              className="bg-slate-900/60 hover:bg-slate-800 border border-slate-850 hover:border-slate-800 text-[10px] font-bold text-slate-450 hover:text-slate-200 px-3 py-2 rounded-xl transition-colors"
            >
              💡 {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-3"
        >
          <input
            required
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about vendors, invoices, contracts, or delivery issues..."
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-orange-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white p-3.5 rounded-xl border border-orange-500/20 shadow-lg shadow-orange-500/10 shrink-0 transition-all transform hover:-translate-y-0.5"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
