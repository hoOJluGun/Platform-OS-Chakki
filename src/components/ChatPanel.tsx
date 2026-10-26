import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Brain,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ChatMessage, TaskStatus, ToolCallState } from '../types/protocol';
import { ToolCallBlock } from './ToolCallBlock';

interface ChatPanelProps {
  messages: ChatMessage[];
  taskStatus: TaskStatus;
  statusMessage?: string;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  onSendMessage: (text: string) => void;
  onCancelTask: () => void;
  onApproveTool: (toolCallId: string, approved: boolean) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  taskStatus,
  statusMessage,
  selectedModel,
  setSelectedModel,
  onSendMessage,
  onCancelTask,
  onApproveTool,
}) => {
  const [inputText, setInputText] = useState('');
  const [isReasoningOpen, setIsReasoningOpen] = useState(true);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const isBusy =
    taskStatus === 'planning' ||
    taskStatus === 'thinking' ||
    taskStatus === 'executing_tool' ||
    taskStatus === 'awaiting_approval' ||
    taskStatus === 'verifying';

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, taskStatus, statusMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isBusy) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const MODELS = [
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Thinking)' },
    { id: 'gpt-4o', name: 'GPT-4o (Clean-Room Engine)' },
    { id: 'deepseek-r1', name: 'DeepSeek R1 (Autonomous Reasoning)' },
    { id: 'custom-swift-local', name: 'Chakki Swift Core (Local Daemon)' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f19] overflow-hidden">
      {/* Top Status Bar */}
      <div className="px-6 py-2 bg-[#090d16]/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">Active Session</span>
          <span className="text-slate-500 font-mono">·</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {isBusy ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            ) : taskStatus === 'completed' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span
              className={
                taskStatus === 'awaiting_approval'
                  ? 'text-amber-300 font-semibold'
                  : 'text-slate-400'
              }
            >
              {taskStatus === 'idle'
                ? 'Standby'
                : taskStatus === 'awaiting_approval'
                ? 'Awaiting Operator Approval'
                : statusMessage || taskStatus}
            </span>
          </div>
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="model-select" className="text-slate-400 text-[11px]">
            Model:
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isBusy}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px] font-mono focus:outline-none focus:border-amber-400"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-semibold text-slate-200">
              Chakki Swift Agent Studio
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clean-room architecture environment connected to Swift Core via JSON-RPC 2.0. Pick an engine directive or type a task below to run autonomous reasoning, tool execution, and diff approval.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAssistant = msg.role === 'assistant';

            return (
              <div key={msg.id} className="space-y-3 max-w-4xl mx-auto">
                {/* Role header */}
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`font-semibold ${
                      isAssistant ? 'text-amber-400' : 'text-slate-300'
                    }`}
                  >
                    {isAssistant ? 'Chakki Agent' : 'User Operator'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                {/* Reasoning Accordion (Extended Thinking) */}
                {isAssistant && msg.reasoning && (
                  <div className="border border-slate-800/80 rounded-lg bg-[#080c16] overflow-hidden text-xs">
                    <button
                      onClick={() => setIsReasoningOpen(!isReasoningOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/60 hover:bg-slate-900 text-slate-300 text-[11px] font-mono transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-amber-400" />
                        <span>Extended Thinking & Invariant Checks</span>
                      </div>
                      {isReasoningOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {isReasoningOpen && (
                      <div className="p-3 text-slate-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap border-t border-slate-800/60 max-h-60 overflow-y-auto">
                        {msg.reasoning}
                      </div>
                    )}
                  </div>
                )}

                {/* Content Text */}
                {msg.content && (
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                )}

                {/* Tool Calls inside this message */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-2">
                    {msg.toolCalls.map((tc) => (
                      <ToolCallBlock
                        key={tc.id}
                        toolCall={tc}
                        onApprove={(approved) => onApproveTool(tc.id, approved)}
                        isInteractive={tc.status === 'pending_approval'}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Input Composer Box */}
      <div className="p-4 bg-[#0d121f] border-t border-slate-800/80">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-2">
          {/* Quick slash tags */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">Directives:</span>
            <button
              type="button"
              onClick={() => setInputText('Inspect security attestation and test replay resistance')}
              className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              /audit-security
            </button>
            <button
              type="button"
              onClick={() => setInputText('Run swift test and report benchmark timings')}
              className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              /run-tests
            </button>
          </div>

          <div className="relative rounded-lg border border-slate-700/80 bg-[#070a12] focus-within:border-amber-400/80 transition-colors">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
              placeholder={
                isBusy
                  ? 'Swift Engine is executing task...'
                  : 'Type instructions for Swift agent (e.g. "Add rate limiting middleware to EngineServer.swift")...'
              }
              rows={3}
              className="w-full bg-transparent p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none font-sans"
            />

            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800/60 bg-slate-900/40 text-[11px]">
              <div className="text-slate-400">
                <kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] font-mono">
                  Enter
                </kbd>{' '}
                to send ·{' '}
                <kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] font-mono">
                  Shift+Enter
                </kbd>{' '}
                new line
              </div>

              <div className="flex items-center gap-2">
                {isBusy ? (
                  <button
                    type="button"
                    onClick={onCancelTask}
                    className="px-3 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded flex items-center gap-1.5 transition-colors font-semibold"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Cancel</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`px-3 py-1 rounded flex items-center gap-1.5 font-semibold transition-all ${
                      inputText.trim()
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Execute</span>
                    <Send className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
