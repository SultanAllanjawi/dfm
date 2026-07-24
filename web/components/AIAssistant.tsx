"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, Bot } from "lucide-react";
import { Panel, PanelLabel } from "./Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const QUICK_QUESTIONS = ["Is there a signal right now?", "What are the TP and SL?", "Should I enter this trade?", "How accurate is the model?"];

export function AIAssistant({ ticker }: { ticker: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
  }, [ticker]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await api.chat(ticker, text, messages);
      setMessages([...next, { role: "assistant", content: res.content }]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Connection error";
      setMessages([...next, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <PanelLabel dotColor="var(--chart-3)">
          <span className="flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" /> AI Assistant
          </span>
        </PanelLabel>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={sending}
            className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div ref={scrollRef} className="scrollbar-thin mb-3 max-h-64 space-y-2 overflow-y-auto rounded-lg bg-secondary/30 p-3">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-card text-foreground"
                }`}
              >
                {m.content}
              </motion.div>
            ))}
          </AnimatePresence>
          {sending && <div className="rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground">Thinking…</div>}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask anything about this stock or trading…"
          disabled={sending}
        />
        <Button onClick={() => send(input)} disabled={sending || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Panel>
  );
}
