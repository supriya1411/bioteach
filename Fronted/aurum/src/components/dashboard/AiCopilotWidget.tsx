'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Send, ArrowRight, ChevronDown, ChevronUp, Bot, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAurumStore } from '@/store/useStore';

export const AiCopilotWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [inputQuery, setInputQuery] = useState<string>('');

  const { chatMessages, sendChatMessage, isAiStreaming } = useAurumStore();

  const suggestedPrompts = [
    'Which equipment is high risk today?',
    'What PMs are overdue?',
    'Which contracts expire this month?',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputQuery;
    if (!text.trim() || isAiStreaming) return;
    sendChatMessage(text);
    setInputQuery('');
    if (!isExpanded) setIsExpanded(true);
  };

  return (
    <Card className="border-indigo-200 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-indigo-100/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#312E81] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">AURUM Operational Copilot</h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
                AI ENGINE ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Natural language intelligence with continuous evidence-linking across telemetry and contracts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/ai">
            <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              Open Full Assistant
            </Button>
          </Link>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Chat Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Recent Messages */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#312E81] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#4F46E5] text-white font-medium rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block w-full">
                        Evidence Citations:
                      </span>
                      {msg.citations.map((cite, cIdx) => (
                        <Link
                          key={cIdx}
                          href={cite.link}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition-colors"
                        >
                          <span>{cite.label}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAiStreaming && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                <span className="animate-spin w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                <span>Correlating fault streams and contract obligations...</span>
              </div>
            )}
          </div>

          {/* Suggested Prompts */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Try asking:</span>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="px-2.5 py-1 text-xs bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-slate-700 transition-colors shadow-2xs font-medium"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              placeholder="Ask AURUM anything about your equipment, telemetry anomalies, or contracts..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] shadow-2xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Send className="w-3.5 h-3.5" />}
              disabled={!inputQuery.trim() || isAiStreaming}
            >
              Ask
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
};
