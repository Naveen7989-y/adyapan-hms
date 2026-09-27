import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Stethoscope,
  Phone,
  Clock,
  ExternalLink,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import standing3DImg from '../../assets/dr-junior-standing-transparent.png';
import { QUICK_SUGGESTIONS, generateDrJuniorResponse } from '../../utils/drJuniorAI';

/**
 * DrJuniorChatbot
 * Interactive ChatGPT-style AI Hospital & Pediatric Assistant
 */
export const DrJuniorChatbot = ({ isOpen, onClose, onActionClick }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'junior',
      text: "👋 **Hello there! I'm Dr. Junior!** 🩺\n\nI'm your 24/7 Adyapan Hospital AI Assistant. I can help you with:\n\n• Checking **OPD doctor schedules** & Room #s\n• Live **queue token tracking** guidance\n• **Emergency trauma** hotline (+91 800 425-9999)\n• Pharmacy, prescriptions, and child health triage\n\nHow can I care for you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = (queryText) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isTyping) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Natural typing delay simulation (450ms)
    setTimeout(() => {
      const response = generateDrJuniorResponse(textToSend);
      const botMessage = {
        id: `junior-${Date.now()}`,
        sender: 'junior',
        text: response.text,
        action: response.action,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 450);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset',
        sender: 'junior',
        text: "✨ Conversation cleared! I'm ready for your next question. Feel free to ask about our doctors, OPD timings, or tokens!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleAction = (action) => {
    if (!action) return;
    if (action.type === 'link' && action.url) {
      window.open(action.url, '_blank', 'noreferrer');
    } else if (action.type === 'scroll' && action.targetId) {
      const element = document.getElementById(action.targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (onActionClick) onActionClick(action.targetId);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-[9995] transition-all duration-300 ease-out flex flex-col ${
        isExpanded
          ? 'inset-3 sm:inset-6 md:inset-10'
          : 'bottom-2 left-2 right-2 sm:right-auto sm:bottom-6 sm:left-6 w-auto sm:w-[26rem] h-[34rem] max-h-[90vh]'
      } rounded-3xl bg-white dark:bg-[#0B1524] text-[#334155] dark:text-white border border-[#E2E8F0] dark:border-navy-700 shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in-scale`}
    >
      {/* 1. CHAT HEADER */}
      <div className="bg-[#F8FAFC] dark:bg-navy-950 px-4 py-3.5 border-b border-[#E2E8F0] dark:border-navy-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-amber-100/60 dark:bg-amber-500/20 p-1 border border-amber-300 dark:border-amber-400/40 flex items-center justify-center flex-shrink-0 shadow-xs">
            <img
              src={standing3DImg}
              alt="Dr. Junior Avatar"
              className="w-full h-full object-contain"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-navy-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-[#334155] dark:text-white leading-tight">
                Dr. Junior
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-[#0D9488] text-white shadow-2xs">
                AI BOT
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] dark:text-slate-300 flex items-center gap-1 font-semibold mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Online • Hospital Companion</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#334155] dark:text-slate-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden sm:inline-flex p-1.5 rounded-lg text-[#64748B] hover:text-[#334155] dark:text-slate-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-0.5"
            title="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. CHAT STREAM (MESSAGES) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-white to-[#F8FAFC] dark:from-[#070D18] dark:to-[#0B1524]">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-[#0D9488] text-white font-bold rounded-tr-xs'
                    : 'bg-white dark:bg-navy-900 text-[#334155] dark:text-slate-100 border border-[#E2E8F0] dark:border-navy-700/80 rounded-tl-xs'
                }`}
              >
                {/* Parse simple markdown bold / list breaks */}
                <div className="whitespace-pre-line space-y-1">
                  {msg.text.split('\n').map((line, lIdx) => {
                    const cleanLine = line
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/`([^`]+)`/g, '$1');
                    const isBullet = line.startsWith('• ') || line.startsWith('1.') || line.startsWith('2.');
                    return (
                      <p
                        key={lIdx}
                        className={`${isBullet ? 'pl-2' : ''} ${
                          line.startsWith('🚨') || line.startsWith('👋') || line.startsWith('🕒')
                            ? 'font-extrabold text-[12.5px] text-[#0F766E] dark:text-amber-300'
                            : 'text-[#334155] dark:text-slate-100'
                        }`}
                      >
                        {cleanLine}
                      </p>
                    );
                  })}
                </div>

                {/* Optional interactive action button inside response */}
                {msg.action && (
                  <button
                    type="button"
                    onClick={() => handleAction(msg.action)}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488] text-white hover:bg-[#0F766E] text-[11px] font-black uppercase tracking-wider shadow-xs transition-all transform hover:scale-105 active:scale-95"
                  >
                    <span>{msg.action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[9px] text-[#64748B] dark:text-slate-400 font-mono mt-1 px-1">
                {msg.time}
              </span>
            </div>
          );
        })}

        {/* Dynamic Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center p-0.5 border border-amber-300 dark:border-amber-500/40">
              <img src={standing3DImg} alt="Typing" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-navy-900 px-3 py-1.5 rounded-full border border-[#E2E8F0] dark:border-navy-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] dark:bg-teal-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] dark:bg-teal-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] dark:bg-teal-400 animate-bounce [animation-delay:300ms]" />
              <span className="text-[10px] font-semibold text-[#64748B] dark:text-slate-200 ml-1">
                Dr. Junior is thinking...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUICK SUGGESTION CHIPS (ONE-TAP QUESTIONS) */}
      <div className="px-3.5 py-2 bg-[#F8FAFC]/90 dark:bg-navy-950/90 border-t border-[#E2E8F0] dark:border-navy-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-300 uppercase tracking-wider flex-shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-[#0D9488] dark:text-amber-400" />
          Suggested:
        </span>
        {QUICK_SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleSend(item.query)}
            disabled={isTyping}
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-navy-900 text-[#334155] dark:text-amber-300 border border-[#E2E8F0] dark:border-navy-700 hover:border-[#0D9488] dark:hover:border-amber-400 hover:bg-[#F8FAFC] dark:hover:bg-navy-800 transition-all shadow-2xs transform active:scale-95 disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 4. INPUT BAR */}
      <div className="p-3 bg-white dark:bg-[#0B1524] border-t border-[#E2E8F0] dark:border-navy-800 flex items-center gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Dr. Junior about doctors, OPD, tokens..."
          disabled={isTyping}
          className="flex-1 bg-[#F8FAFC] dark:bg-navy-950 text-[#334155] dark:text-white placeholder-[#64748B]/70 dark:placeholder-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-navy-700 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isTyping}
          className="px-3.5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-black text-xs shadow-xs transition-all transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DrJuniorChatbot;
