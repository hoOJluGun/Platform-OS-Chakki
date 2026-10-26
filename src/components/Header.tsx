import React from 'react';
import { Play, Sparkles, Terminal, FileCode, Sliders, Database, Command, LayoutGrid, MessageSquare, Globe } from 'lucide-react';
import { ConnectionMode } from '../types/protocol';

export type UiMode = 'simple' | 'studio' | 'website';
export type ActiveTabType = 'workspace' | 'commands' | 'ledger' | 'inspector' | 'spec' | 'settings';

interface HeaderProps {
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  connectionMode: ConnectionMode;
  onNewTaskClick: () => void;
  isTaskRunning: boolean;
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  uiMode,
  setUiMode,
  activeTab,
  setActiveTab,
  connectionMode,
  onNewTaskClick,
  isTaskRunning,
  onOpenCommandPalette,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-2.5 bg-[#0d121f] border-b border-slate-800/80 shrink-0">
      {/* Zone 1: Brand Wordmark + Mode Toggles */}
      <div className="flex items-center gap-4 whitespace-nowrap shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
            CS
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-white whitespace-nowrap shrink-0">
              Chakki Studio
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              v2.0
            </span>
          </div>
        </div>

        {/* Primary View Mode Switcher: Simple / Studio / Website */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setUiMode('simple')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              uiMode === 'simple'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Simple</span>
          </button>
          <button
            onClick={() => setUiMode('studio')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              uiMode === 'studio'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setUiMode('website')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              uiMode === 'website'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Website</span>
          </button>
        </div>
      </div>

      {/* Zone 2: Studio Navigation Links (when in Studio mode) */}
      {uiMode === 'studio' && (
        <nav className="flex items-center gap-4 text-xs font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'workspace'
                ? 'text-white border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('commands')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'commands'
                ? 'text-white border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Command className="w-3.5 h-3.5" />
            <span>28 Commands</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'ledger'
                ? 'text-white border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'inspector'
                ? 'text-white border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>JSON-RPC</span>
          </button>

          <button
            onClick={() => setActiveTab('spec')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'spec'
                ? 'text-white border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Contract v2.0</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'settings'
                ? 'text-white border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>
      )}

      {/* Zone 3: Actions + Quick Palette & Connection */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
        >
          <span>Palette</span>
          <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[10px] text-amber-400">Ctrl+K</kbd>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="hidden lg:inline font-mono">
            {connectionMode === 'simulated' ? 'Engine: Ready' : 'WebSocket: Live'}
          </span>
        </div>

        <button
          onClick={onNewTaskClick}
          disabled={isTaskRunning}
          className={`px-3 py-1.5 text-xs font-semibold rounded text-slate-950 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            isTaskRunning
              ? 'bg-amber-400/50 cursor-not-allowed text-slate-700'
              : 'bg-amber-400 hover:bg-amber-300 shadow-sm active:scale-95'
          }`}
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isTaskRunning ? 'Busy' : 'Start Task'}</span>
        </button>
      </div>
    </header>
  );
};
