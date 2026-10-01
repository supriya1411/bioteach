'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Server,
  Activity,
  FileText,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAurumStore } from '@/store/useStore';
import { ChatMessage } from '@/types';

export const AiAssistantView: React.FC = () => {
  const { chatMessages, sendChatMessage, isAiStreaming, addToast } = useAurumStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'Which equipment is high risk today and why?',
    'What preventive maintenance tasks are overdue?',
    'Which AMC/CMC contracts expire within 30 days?',
    'Explain the root-cause correlation for Chiller EQ-204',
    'Summarize our estate PM compliance rate and audit readiness',
  ];

  const handleSend = (queryText?: string) => {
    const text = queryText || inputText;
    if (!text.trim() || isAiStreaming) return;
    sendChatMessage(text);
    setInputText('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiStreaming]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50/60 via-white to-white border-indigo-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#312E81] text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  AURUM Service Intelligence Copilot
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  EVIDENCE-BASED AI
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Continuously correlates asset condition, IoT sensor telemetry, CMMS maintenance history, and vendor contracts.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => addToast('Conversation history reset.', 'info')}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Clear Session
          </Button>
        </div>
      </Card>

      {/* Main Chat Interface */}
      <Card className="flex flex-col h-[560px] shadow-sm overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#312E81] text-white flex items-center justify-center text-xs shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4 text-indigo-200" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-[80%] leading-relaxed text-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#4F46E5] text-white font-medium rounded-tr-none shadow-xs'
                    : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 opacity-70 text-[10px]">
                  <span>{msg.sender === 'user' ? 'You (Operations)' : 'AURUM Intelligence'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                {/* Evidence Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Cited Ground-Truth Artifacts:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cite, idx) => (
                        <Link
                          key={idx}
                          href={cite.link}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition-colors"
                        >
                          <span>{cite.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-1">
                  DR
                </div>
              )}
            </div>
          ))}

          {isAiStreaming && (
            <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 max-w-sm text-xs text-indigo-700 font-medium animate-pulse">
              <span className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
              <span>Correlating telemetry streams & contract SLAs...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Suggested:</span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 text-xs bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask AURUM anything (e.g., 'What is causing the temperature spike on Chiller A?')..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#F8FAFC] border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Send className="w-4 h-4" />}
              disabled={!inputText.trim() || isAiStreaming}
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
