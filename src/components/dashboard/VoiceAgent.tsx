'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { GradientButton } from '@/components/ui';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VoiceAgentProps {
  token: string;
}

const SUGGESTED_QUESTIONS = [
  'How do ITEX trade dollars work?',
  'How do I find trade partners?',
  'What is a Trade Director?',
  'How do I download the app?',
];

export function VoiceAgent({ token }: VoiceAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your ITEX assistant. I can answer questions about how ITEX works, trading, your membership, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, message: messageText }),
      });

      const data = await res.json();
      const reply = res.ok ? data.reply : 'Sorry, I had trouble processing that. Please try again.';

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact your Trade Director.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Messages */}
      <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-gradient-itex' : 'bg-gray-200'
              }`}>
                {msg.role === 'assistant'
                  ? <Bot className="w-3.5 h-3.5 text-white" />
                  : <User className="w-3.5 h-3.5 text-itex-gray" />
                }
              </div>
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-gray-50 text-itex-dark rounded-tl-sm'
                  : 'bg-gradient-itex text-white rounded-tr-sm'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-itex flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-gray-50 px-3.5 py-2.5 rounded-2xl rounded-tl-sm">
              <Loader2 className="w-4 h-4 text-itex-gray animate-spin" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-itex-lime/30 text-itex-dark hover:bg-itex-lime/10 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask anything about ITEX..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm transition-colors bg-white/80 disabled:opacity-50"
        />
        <GradientButton
          size="sm"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Send className="w-4 h-4" />
        </GradientButton>
      </div>
    </div>
  );
}
