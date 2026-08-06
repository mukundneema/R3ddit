"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InterviewAnswer } from "@/lib/types";

export const INTERVIEW_QUESTIONS = [
  { id: "business", text: "Hi, I'm Geodo2. Let's start simple — what is your business? Give me the name and a one-line description." },
  { id: "sells", text: "Got it. What do you actually sell — products, a service, software, something else?" },
  { id: "customer", text: "Who is your target customer? Be as specific as you can — think about who actually buys or uses this." },
  { id: "unique", text: "What makes you different from the alternatives your customers could choose instead?" },
  { id: "location", text: "Where do you operate — a specific city, a country, or fully online / worldwide?" },
  { id: "goal", text: "Last one — what do you want this Reddit campaign to accomplish? Signups, sales, feedback, awareness, something else?" },
];

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

interface ChatInterviewProps {
  onComplete: (answers: InterviewAnswer[]) => void;
}

export function ChatInterview({ onComplete }: ChatInterviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INTERVIEW_QUESTIONS[0].text },
  ]);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const currentQuestion = INTERVIEW_QUESTIONS[questionIndex];
    const newAnswers = [
      ...answers,
      { id: currentQuestion.id, question: currentQuestion.text, answer: trimmed },
    ];

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setAnswers(newAnswers);
    setInput("");

    const nextIndex = questionIndex + 1;

    if (nextIndex < INTERVIEW_QUESTIONS.length) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: INTERVIEW_QUESTIONS[nextIndex].text }]);
        setQuestionIndex(nextIndex);
        setIsTyping(false);
      }, 550);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Perfect, that's everything I need. Building your business profile now..." },
        ]);
        setIsTyping(false);
        onComplete(newAnswers);
      }, 550);
    }
  }

  const progress = Math.min(questionIndex, INTERVIEW_QUESTIONS.length);

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-1 py-4">
        <AnimatePresence initial={false}>
          {messages.map((message, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-white/10 bg-white/[0.04] text-foreground"
                }`}
              >
                {message.content}
              </div>
              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <User className="h-4 w-4 text-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-2 border-t border-white/10 pt-4">
        <div className="mb-3 flex items-center gap-2">
          {INTERVIEW_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < progress ? "bg-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSubmit();
              }
            }}
            placeholder="Type your answer..."
            className="min-h-11 max-h-32"
            disabled={isTyping}
          />
          <Button type="submit" size="icon" disabled={isTyping || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
