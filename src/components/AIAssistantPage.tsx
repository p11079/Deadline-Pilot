/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles, AlertTriangle, Calendar, Plus, Play, User, Terminal, HelpCircle } from 'lucide-react';
import { Message, Task, TimeBlock } from '../types';

interface AIAssistantPageProps {
  messages: Message[];
  tasks: Task[];
  onSendMessage: (text: string) => void;
  onConfirmSuggestedAction: (actionType: string, payload: any) => void;
}

export default function AIAssistantPage({
  messages,
  tasks,
  onSendMessage,
  onConfirmSuggestedAction
}: AIAssistantPageProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    onSendMessage(userText);
    setInputText('');

    // Simulate realistic Pilot response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      let replyText = "";
      let suggestedAction = undefined;

      if (userText.toLowerCase().includes('plan') || userText.toLowerCase().includes('rescue')) {
        replyText = "Operational rescue matrix updated! I've calculated a focus corridor for your **Vibe2Ship submission**:\n\n* **Sprint 1 (Next 45 mins):** Record 2-minute demo video. (Don't rehearse, capture the interface raw).\n* **Sprint 2 (Next 20 mins):** Fill Devpost description prompts.\n\nShould I block out these periods in your Google Calendar database?";
        suggestedAction = {
          type: "add_time_block" as const,
          label: "Confirm survival calendar blocks",
          payload: { taskId: "task-1" }
        };
      } else if (userText.toLowerCase().includes('deployment') || userText.toLowerCase().includes('secrets')) {
        replyText = "Detected high risk on **Google Cloud Run Deployment Setup** (due tomorrow). I suggest scheduling a 2-hour DevOps sprint block today at 14:30. Let me stage this focal slot for you?";
        suggestedAction = {
          type: "add_time_block" as const,
          label: "Auto-Block 14:30-16:30 today",
          payload: { taskId: "task-2", startTime: "14:30", endTime: "16:30" }
        };
      } else {
        replyText = "Understood. I've recalculated your focus score indexes. If you keep up your current milestone speed, you'll land your next 3 deadlines perfectly. Let me know if you need to generate focus blocks or micro-checklists!";
      }

      // Add assistant response to mock history
      onConfirmSuggestedAction('simulate_reply', { text: replyText, suggestedAction });
    }, 1200);
  };

  const handleShortcutClick = (shortcut: string) => {
    setInputText(shortcut);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col justify-between font-sans relative">
      
      {/* Background neon grids */}
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main chat log */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scrollbar">
        
        {/* Pilot welcome banner info */}
        <div className="glass-panel p-5 rounded-2xl border-white/5 bg-gradient-to-r from-indigo-950/10 to-zinc-950 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 text-xs">
            <span className="font-bold text-white uppercase tracking-wider font-display block">DeadlinePilot Assistant</span>
            <p className="text-zinc-400 leading-relaxed">
              I proactively build checklists, allocate time blocks, and calculate submission probabilities before your deadlines loom. Ask me to "draft rescue sequence" or "schedule focus windows".
            </p>
          </div>
        </div>

        {/* Message bubble loop */}
        <div className="space-y-4">
          {messages.map((msg) => {
            const isAsst = msg.sender === 'assistant';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3.5 max-w-[85%] ${isAsst ? '' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isAsst 
                  ? 'bg-gradient-to-tr from-indigo-500 to-violet-500 text-white' 
                  : 'bg-zinc-800 text-zinc-300 border border-white/10'
                }`}>
                  {isAsst ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble details */}
                <div className="space-y-1.5">
                  <div className={`glass-panel p-4 rounded-2xl border text-xs leading-relaxed whitespace-pre-line ${
                    isAsst 
                    ? 'border-white/5 bg-zinc-900/60 text-zinc-200' 
                    : 'border-indigo-500/20 bg-indigo-500/5 text-zinc-100'
                  }`}>
                    {msg.text}

                    {/* Interactive action triggers inside bubbles */}
                    {isAsst && msg.suggestedAction && (
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <button 
                          onClick={() => onConfirmSuggestedAction(msg.suggestedAction!.type, msg.suggestedAction!.payload)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] px-3.5 py-2 rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {msg.suggestedAction.label}
                        </button>
                      </div>
                    )}
                  </div>

                  <span className={`block text-[10px] text-zinc-500 font-mono ${isAsst ? '' : 'text-right'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="glass-panel py-3 px-4 rounded-2xl border border-white/5 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

      </div>

      {/* Suggested shortcuts deck */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 text-xs shrink-0 scrollbar">
        <button 
          onClick={() => handleShortcutClick("Draft rescue sequence for Hackathon Submission")}
          className="glass-panel px-3.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:border-white/15 shrink-0"
        >
          🚨 Draft Hackathon rescue
        </button>
        <button 
          onClick={() => handleShortcutClick("Analyze risks for Google Cloud Run Deployment Setup")}
          className="glass-panel px-3.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:border-white/15 shrink-0"
        >
          🔍 Analyze deployment risks
        </button>
        <button 
          onClick={() => handleShortcutClick("Check current deadline safety values")}
          className="glass-panel px-3.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:border-white/15 shrink-0"
        >
          📊 Check safety scores
        </button>
      </div>

      {/* Input container */}
      <form onSubmit={handleSend} className="flex gap-3 shrink-0">
        <div className="relative flex-1">
          <Terminal className="absolute left-4 top-4.5 w-4.5 h-4.5 text-zinc-500" />
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Instruct Pilot: 'draft rescue plan', 'block schedule'..."
            className="w-full bg-zinc-900 border border-white/10 focus:border-indigo-500 focus:bg-zinc-800 outline-none rounded-2xl py-4 pl-12 pr-4 text-sm text-zinc-100 placeholder-zinc-500 transition-all font-sans shadow-inner"
          />
        </div>
        <button 
          type="submit"
          disabled={!inputText.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-4 rounded-2xl border border-indigo-400/20 shadow-lg shadow-indigo-500/15 transition-all flex items-center justify-center shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

    </div>
  );
}
