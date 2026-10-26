import React, { useState } from 'react';
import { Command, Search, X, Check, ArrowRight } from 'lucide-react';
import { CommandRegistry } from '../core/commands';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  registry: CommandRegistry;
  engineContext: any;
  onCommandOutput: (output: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  registry,
  engineContext,
  onCommandOutput,
}) => {
  const [search, setSearch] = useState('');
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const commands = registry.list();
  const filtered = commands.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleRun = async (cmdName: string) => {
    let input = cmdName;
    if (cmdName === '/resume') input = '/resume sess_1';
    if (cmdName === '/search') input = '/search Attestation';
    if (cmdName === '/memory') input = '/memory security';
    if (cmdName === '/history') input = '/history 1';

    const result = await registry.execute(input, engineContext);
    setExecutionResult(result.message);
    onCommandOutput(`[CMD ${cmdName}] ${result.message}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-700/80 bg-[#0c111d] shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
          <Command className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or filter (e.g. /models, /tests, /doctor, /plan)..."
            autoFocus
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none text-xs font-mono"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Execution result notification if any */}
        {executionResult && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 font-mono text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto">
            {executionResult}
          </div>
        )}

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-slate-500">No commands matching &quot;{search}&quot;</div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.name}
                onClick={() => handleRun(cmd.name)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/60 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-amber-400 w-28 shrink-0">
                    {cmd.name}
                  </span>
                  <span className="text-slate-300 truncate">{cmd.description}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 text-[10px] font-mono shrink-0">
                  <span>Run</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <span>Total 28 verified commands</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
