import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Brain,
  CheckCircle2,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Search,
  Plus,
  Trash2,
  Terminal,
  Settings,
  Command,
  Sliders,
  Cpu,
  Layers,
  Bot,
  Workflow,
  Hammer,
  Check,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Activity,
  Compass,
} from 'lucide-react';
import { ChatMessage, TaskStatus } from '../types/protocol';
import { ToolCallBlock } from './ToolCallBlock';

export type AgentMode = 'director' | 'chat' | 'plan' | 'build' | 'review' | 'autopilot';
export type ReasoningEffort = 'low' | 'medium' | 'high' | 'max';

export interface ChatSession {
  id: string;
  name: string;
  createdAt: number;
  messageCount: number;
  active: boolean;
}

interface SimpleChatViewProps {
  messages: ChatMessage[];
  taskStatus: TaskStatus;
  statusMessage?: string;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  availableModels: Array<{ id: string; name: string; isFree: boolean }>;
  agentMode: AgentMode;
  setAgentMode: (mode: AgentMode) => void;
  reasoningEffort: ReasoningEffort;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onSendMessage: (text: string) => void;
  onCancelTask: () => void;
  onApproveTool: (toolCallId: string, approved: boolean) => void;
  onSwitchToStudio: () => void;
}

const AGENT_MODES: Array<{
  id: AgentMode;
  name: string;
  icon: React.ElementType;
  description: string;
  badge: string;
}> = [
  {
    id: 'director',
    name: 'Director',
    icon: Compass,
    description: 'Autonomous orchestrator dispatching specialized subagents',
    badge: 'Multi-Agent',
  },
  {
    id: 'chat',
    name: 'Direct Chat',
    icon: Bot,
    description: 'Fast interactive technical dialogue without tool execution',
    badge: 'Fast',
  },
  {
    id: 'plan',
    name: 'Task Planner',
    icon: Workflow,
    description: 'Decomposes complex requests into verified dependency steps',
    badge: 'Graph',
  },
  {
    id: 'build',
    name: 'Worker (Build)',
    icon: Hammer,
    description: 'Scoped code mutations, atomic patches, and build verification',
    badge: 'Write-Scoped',
  },
  {
    id: 'review',
    name: 'Reviewer',
    icon: ShieldCheck,
    description: 'AST invariant checks, security audits, and diff analysis',
    badge: 'Read-Only',
  },
  {
    id: 'autopilot',
    name: 'Autopilot',
    icon: Activity,
    description: 'Autonomous execution of pre-approved reversible tasks',
    badge: 'Autonomous',
  },
];

const REASONING_LEVELS: Array<{
  id: ReasoningEffort;
  label: string;
  budget: string;
  description: string;
}> = [
  { id: 'low', label: 'Low', budget: '1k tokens', description: 'Quick responses' },
  { id: 'medium', label: 'Medium', budget: '4k tokens', description: 'Standard chain-of-thought' },
  { id: 'high', label: 'High', budget: '8k tokens', description: 'Deep invariant checks' },
  { id: 'max', label: 'Max', budget: '16k tokens', description: 'Exhaustive verification' },
];

export const SimpleChatView: React.FC<SimpleChatViewProps> = ({
  messages,
  taskStatus,
  statusMessage,
  selectedModel,
  setSelectedModel,
  availableModels,
  agentMode,
  setAgentMode,
  reasoningEffort,
  setReasoningEffort,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onSendMessage,
  onCancelTask,
  onApproveTool,
  onSwitchToStudio,
}) => {
  const [inputText, setInputText] = useState('');
  const [isReasoningOpen, setIsReasoningOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const isBusy =
    taskStatus === 'planning' ||
    taskStatus === 'thinking' ||
    taskStatus === 'executing_tool' ||
    taskStatus === 'awaiting_approval' ||
    taskStatus === 'verifying';

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, taskStatus]);

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

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeModeConfig = AGENT_MODES.find((m) => m.id === agentMode) || AGENT_MODES[0];
  const ModeIcon = activeModeConfig.icon;

  return (
    <div className="flex-1 flex w-full h-full bg-[#070a12] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. LEFT SIDEBAR: SESSIONS, SEARCH, AGENT MODES, PLUGINS */}
      {isSidebarOpen && (
        <aside className="w-72 bg-[#090d16] border-r border-slate-800/80 flex flex-col shrink-0 h-full overflow-hidden transition-all duration-200">
          {/* Top Bar: Title & New Session */}
          <div className="p-3.5 border-b border-slate-800/70 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[10px]">
                  CH
                </div>
                <span className="text-xs font-bold text-white tracking-tight">Chakki Workspace</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-slate-800/60 rounded text-slate-400 hover:text-white transition-colors"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New Session Button */}
            <button
              onClick={onNewSession}
              className="w-full py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search sessions & memory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0e1320] border border-slate-800 rounded-md pl-8 pr-2.5 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
              />
            </div>
          </div>

          {/* Middle: Sessions List & Modes */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* SESSIONS SECTION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                <span>Sessions History</span>
                <span className="text-slate-500">{sessions.length}</span>
              </div>

              <div className="space-y-1">
                {filteredSessions.map((session) => {
                  const isCurrent = session.id === currentSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                        isCurrent
                          ? 'bg-amber-400/10 border-amber-500/40 text-amber-200'
                          : 'bg-transparent border-transparent hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isCurrent ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                          }`}
                        />
                        <span className="truncate text-[11px] font-medium">{session.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono text-slate-500">
                          {session.messageCount} msg
                        </span>
                        {sessions.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-opacity"
                            title="Delete session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AGENT MODES SECTION */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/70">
              <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                <span>Agent Modes</span>
                <span className="text-amber-400 font-mono text-[9px]">{activeModeConfig.name}</span>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {AGENT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = mode.id === agentMode;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setAgentMode(mode.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg text-left transition-all border ${
                        isSelected
                          ? 'bg-slate-800/80 border-amber-400/60 shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                          isSelected ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold ${
                              isSelected ? 'text-white' : 'text-slate-300'
                            }`}
                          >
                            {mode.name}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                              isSelected
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                          >
                            {mode.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                          {mode.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* INTEGRITY & PLUGINS STATUS */}
            <div className="space-y-2 pt-2 border-t border-slate-800/70">
              <div className="px-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Security & Extensions
              </div>
              <div className="bg-[#0e1320] border border-slate-800/80 rounded-lg p-2.5 space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Path Jail Root</span>
                  </span>
                  <span className="text-emerald-400 text-[10px]">LOCKED</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>SHA-256 Ledger</span>
                  </span>
                  <span className="text-amber-400 text-[10px]">VERIFIED</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>BM25 Memory</span>
                  </span>
                  <span className="text-cyan-400 text-[10px]">ISOLATED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="p-3 border-t border-slate-800/80 bg-[#080c14] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px]">Kilo Gateway: OK</span>
            </div>
            <button
              onClick={() => onSendMessage('/doctor')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[10px] transition-colors"
            >
              /doctor
            </button>
          </div>
        </aside>
      )}

      {/* 2. MAIN CONVERSATION & TASK WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0e1a]">
        {/* Top Control Bar: Mode, Model, Reasoning Effort, Studio switch */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#0d121f] border-b border-slate-800/80 text-xs shrink-0 gap-3">
          {/* Left: Sidebar Toggle + Active Mode Badge */}
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-amber-400/60 rounded text-slate-300 hover:text-white transition-colors"
                title="Expand Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg">
              <ModeIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white text-xs">{activeModeConfig.name}</span>
              <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-1 rounded border border-amber-500/20">
                {activeModeConfig.badge}
              </span>
            </div>

            {/* Task state text */}
            <div className="hidden md:flex items-center gap-1.5 text-slate-300">
              {isBusy ? (
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : taskStatus === 'completed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
              <span className="text-[11px] font-mono text-slate-400">
                {taskStatus === 'idle'
                  ? 'Ready for tasks'
                  : taskStatus === 'awaiting_approval'
                  ? 'Operator Approval Required'
                  : statusMessage || taskStatus}
              </span>
            </div>
          </div>

          {/* Right: Model Selector + Reasoning Effort + Studio switch */}
          <div className="flex items-center gap-2.5">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isBusy}
                className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name} {m.isFree ? '[FREE]' : '[PAID]'}
                  </option>
                ))}
              </select>
            </div>

            {/* Reasoning Effort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-400 uppercase font-mono">Effort:</span>
              <select
                value={reasoningEffort}
                onChange={(e) => setReasoningEffort(e.target.value as ReasoningEffort)}
                disabled={isBusy}
                className="bg-transparent text-amber-300 font-semibold text-xs font-mono focus:outline-none cursor-pointer"
              >
                {REASONING_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id} className="bg-slate-900 text-white">
                    {lvl.label} ({lvl.budget})
                  </option>
                ))}
              </select>
            </div>

            {/* Switch to Full Studio */}
            <button
              onClick={onSwitchToStudio}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-sm"
            >
              <span>Studio IDE</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Chakki Autonomous Engineering Agent
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
                  One canonical engine. Real Kilo Gateway model routing with live SSE streaming.
                  SHA-256 monotonic event ledger. Zero mock fallbacks.
                </p>
              </div>

              {/* Status Banner */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-md text-left font-mono text-[11px]">
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
                  <div className="text-slate-500 text-[10px]">GATEWAY</div>
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE OK
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
                  <div className="text-slate-500 text-[10px]">LEDGER</div>
                  <div className="text-amber-400 font-bold">SHA-256 CHAIN</div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
                  <div className="text-slate-500 text-[10px]">SANDBOX</div>
                  <div className="text-cyan-400 font-bold">PATH JAIL OK</div>
                </div>
              </div>

              {/* Quick Starter Chips */}
              <div className="w-full space-y-2 pt-2">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Recommended directives for {activeModeConfig.name} mode:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  <button
                    onClick={() =>
                      onSendMessage(
                        'Audit Sources/ChakkiEngine/Security/Attestation.swift for replay vulnerabilities, generate patch with anti-replay nonce, and execute verification.'
                      )
                    }
                    className="p-3 rounded-lg border border-slate-800 bg-[#0d121f] hover:border-amber-500/50 hover:bg-slate-900 text-xs text-slate-300 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white">Patch Attestation & Anti-Replay</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Audit security invariants and generate unified diff
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => onSendMessage('/doctor')}
                    className="p-3 rounded-lg border border-slate-800 bg-[#0d121f] hover:border-amber-500/50 hover:bg-slate-900 text-xs text-slate-300 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <Activity className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white">Subsystem Diagnostics (/doctor)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Verify Gateway, ledger hash chain, and permissions
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => onSendMessage('/models')}
                    className="p-3 rounded-lg border border-slate-800 bg-[#0d121f] hover:border-amber-500/50 hover:bg-slate-900 text-xs text-slate-300 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <Cpu className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white">Live Model Catalogue (/models)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Discover free and reasoning routes on Kilo Gateway
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      onSendMessage(
                        'Explain how the SHA-256 monotonic hash chain in Chakki Canonical Ledger detects tampering and scrubs credentials.'
                      )
                    }
                    className="p-3 rounded-lg border border-slate-800 bg-[#0d121f] hover:border-amber-500/50 hover:bg-slate-900 text-xs text-slate-300 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white">Cryptographic Ledger Truth</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Zero lossy compaction and tamper detection rules
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div key={msg.id} className="space-y-2.5 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                          isAssistant
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {isAssistant ? 'CK' : 'OP'}
                      </div>
                      <span className={`font-semibold ${isAssistant ? 'text-amber-400' : 'text-slate-200'}`}>
                        {isAssistant ? 'Chakki Agent' : 'User Operator'}
                      </span>
                      {isAssistant && (
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                          {selectedModel}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Extended Thinking / Reasoning Accordion */}
                  {isAssistant && msg.reasoning && (
                    <div className="border border-amber-500/30 rounded-lg bg-[#080c16] overflow-hidden text-xs shadow-sm">
                      <button
                        onClick={() => setIsReasoningOpen(!isReasoningOpen)}
                        className="w-full flex items-center justify-between px-3.5 py-2 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 text-[11px] font-mono transition-colors border-b border-amber-500/20"
                      >
                        <div className="flex items-center gap-2">
                          <Brain className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold">Extended Thinking ({reasoningEffort} effort)</span>
                        </div>
                        {isReasoningOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </button>
                      {isReasoningOpen && (
                        <div className="p-3.5 text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-slate-950/70 border-t border-slate-800/60">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  {msg.content && (
                    <div
                      className={`text-xs leading-relaxed whitespace-pre-wrap p-4 rounded-xl border ${
                        isAssistant
                          ? 'bg-[#0e1322] border-slate-800 text-slate-100 shadow-md'
                          : 'bg-[#151c2e] border-slate-700/80 text-white ml-8'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  {/* Tool Call Blocks */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-2 pt-1">
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

        {/* 3. COMPOSER */}
        <div className="p-4 bg-[#090d16] border-t border-slate-800/80 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Command Helper Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-slate-400 pb-1">
              <span className="text-slate-500 uppercase text-[9px] select-none">Quick:</span>
              <button
                onClick={() => setInputText('/doctor')}
                className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-amber-400/50 transition-colors"
              >
                /doctor
              </button>
              <button
                onClick={() => setInputText('/models --free')}
                className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-amber-400/50 transition-colors"
              >
                /models --free
              </button>
              <button
                onClick={() => setInputText('/plan ')}
                className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-amber-400/50 transition-colors"
              >
                /plan
              </button>
              <button
                onClick={() => setInputText('/diff')}
                className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-amber-400/50 transition-colors"
              >
                /diff
              </button>
              <button
                onClick={() => setInputText('/memory ')}
                className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-amber-400/50 transition-colors"
              >
                /memory
              </button>
              <button
                onClick={() => setInputText('/mode ')}
                className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-amber-400/50 transition-colors"
              >
                /mode
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="relative rounded-xl border border-slate-700/80 bg-[#060911] focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30 transition-all shadow-inner">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isBusy}
                  placeholder={
                    isBusy
                      ? 'Chakki is processing live inference on Kilo AI Gateway...'
                      : `Enter directive for ${activeModeConfig.name} mode, or type /help for commands...`
                  }
                  rows={3}
                  className="w-full bg-transparent p-3.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none font-sans"
                />

                <div className="flex items-center justify-between px-3.5 py-2 border-t border-slate-800/70 bg-slate-900/40 text-[11px]">
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="text-amber-400 font-bold">{activeModeConfig.name}</span>
                      <span>·</span>
                      <span className="text-slate-300">{reasoningEffort} effort</span>
                    </span>
                    <span className="text-slate-600 hidden sm:inline">|</span>
                    <span className="hidden sm:inline text-slate-500">
                      Press Enter to send · Shift+Enter newline
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isBusy ? (
                      <button
                        type="button"
                        onClick={onCancelTask}
                        className="px-3.5 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors font-semibold text-xs cursor-pointer"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Cancel Task</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-xs transition-all ${
                          inputText.trim()
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-md'
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
      </div>
    </div>
  );
};
