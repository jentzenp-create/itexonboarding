'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { GradientButton, useToast } from '@/components/ui';
import { SessionValidateResponse, AdJson } from '@/types';

interface AIDiscoveryChatProps {
  session: SessionValidateResponse;
  businessName: string;
  location: string;
  onComplete: (data: DiscoveryResult) => void;
}

export interface DiscoveryResult {
  adVersionId: string;
  businessDescription: string;
  offerSummary: string;
  ad: AdJson;
  conversationHistory: ChatMessage[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIDiscoveryChat({ session, businessName, location, onComplete }: AIDiscoveryChatProps) {
  const { error: showError } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getToken = () => window.location.pathname.split('/').pop() || '';

  // Start the conversation on mount
  useEffect(() => {
    startConversation();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const startConversation = async () => {
    setIsTyping(true);
    try {
      const res = await fetch('/api/ad/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: getToken(),
          businessName,
          location,
          messages: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start conversation');

      setMessages([{ role: 'assistant', content: data.reply }]);
    } catch (err) {
      showError('Connection issue', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setMessageCount(prev => prev + 1);
    setIsTyping(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/ad/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: getToken(),
          businessName,
          location,
          messages: updatedMessages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      const assistantMessage: ChatMessage = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMessage]);

      if (data.isReady) {
        setIsReady(true);
      }
    } catch (err) {
      showError('Message failed', err instanceof Error ? err.message : 'Please try again.');
      // Remove the user message on failure
      setMessages(messages);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ad/generate-from-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: getToken(),
          businessName,
          location,
          conversationHistory: messages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      onComplete({
        adVersionId: data.adVersionId,
        businessDescription: data.businessDescription,
        offerSummary: data.offerSummary,
        ad: data.ad,
        conversationHistory: messages,
      });
    } catch (err) {
      showError('Generation failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const progressPercent = Math.min((messageCount / 6) * 100, 100);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-itex-lime to-itex-cyan flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-itex-dark">Tell us about your business</h2>
            <p className="text-sm text-itex-gray">Our AI will craft your directory listing & a turnkey offer ad</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-itex-lime to-itex-cyan rounded-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {messageCount >= 3 && !isReady && (
            <span className="text-xs text-itex-gray whitespace-nowrap">Almost there...</span>
          )}
          {isReady && (
            <span className="text-xs text-itex-lime font-semibold whitespace-nowrap">✓ Ready!</span>
          )}
        </div>
      </motion.div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-itex-lime/20 to-itex-cyan/20'
                  : 'bg-itex-dark/10'
              }`}>
                {msg.role === 'assistant' ? (
                  <Bot className="w-4 h-4 text-itex-lime" />
                ) : (
                  <User className="w-4 h-4 text-itex-dark" />
                )}
              </div>

              {/* Message bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'assistant'
                  ? 'bg-white border border-gray-100 shadow-sm'
                  : 'bg-gradient-to-br from-itex-lime to-itex-cyan text-white'
              }`}>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'assistant' ? 'text-itex-dark' : 'text-white'
                }`}>
                  {msg.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-itex-lime/20 to-itex-cyan/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-itex-lime" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-itex-gray"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-itex-gray"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-itex-gray"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Ready to generate banner */}
      <AnimatePresence>
        {isReady && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="mb-3"
          >
            <div className="bg-gradient-to-r from-itex-lime/10 to-itex-cyan/10 border border-itex-lime/20 rounded-2xl p-4 text-center">
              <p className="text-sm text-itex-dark font-medium mb-3">
                ✨ Great conversation! I have enough to create your listing and ad.
              </p>
              <GradientButton onClick={handleGenerate} size="lg">
                <Sparkles className="w-5 h-5" />
                Generate My Listing & Ad
              </GradientButton>
              <p className="text-xs text-itex-gray mt-2">
                Or keep chatting to add more details
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generating overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3"
          >
            <div className="bg-white border border-gray-100 shadow-lg rounded-2xl p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 mx-auto mb-4"
              >
                <Sparkles className="w-12 h-12 text-itex-lime" />
              </motion.div>
              <h3 className="text-lg font-bold text-itex-dark mb-1">Crafting your listing & ad...</h3>
              <p className="text-sm text-itex-gray">
                Our AI is writing a compelling directory description and a turnkey offer ad based on our conversation.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      {!isGenerating && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaResize}
                onKeyDown={handleKeyDown}
                placeholder={messages.length === 0 ? 'Starting conversation...' : 'Type your answer...'}
                disabled={isTyping || messages.length === 0}
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 focus:border-itex-lime focus:outline-none text-sm resize-none transition-colors bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ maxHeight: '120px' }}
              />
              <div className="absolute right-2 bottom-2">
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-itex-lime to-itex-cyan flex items-center justify-center text-white disabled:opacity-30 transition-opacity hover:shadow-md"
                >
                  {isTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-itex-gray mt-1.5 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      )}
    </div>
  );
}
