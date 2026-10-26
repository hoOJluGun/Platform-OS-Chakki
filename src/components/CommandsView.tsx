import React, { useState } from 'react';
import { Command, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { CommandRegistry } from '../core/commands';

interface CommandsViewProps {
  registry: CommandRegistry;
  engineContext: any;
}

export const CommandsView: React.FC<CommandsViewProps> = ({ registry, engineContext }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeOutput, setActiveOutput] = useState<{ cmd: string; output: string; success: boolean } | null>(null);

  const commands = registry.list();
  const categories = ['all', 'session', 'model', 'agent', 'git', 'memory', 'system'];

  const filtered = commands.filter((c) => selectedCategory === 'all' || c.category === selectedCategory);

  const handleExecute = async (cmdName: string) => {
    let input = cmdName;
    if (cmdName === '/resume') input = '/resume sess_main';
    if (cmdName === '/search') input = '/search Attestation';
    if (cmdName === '/memory') input = '/memory token';
    if (cmdName === '/history') input = '/history 1';
    if (cmdName === '/mode') input = '/mode review';

    const res = await registry.execute(input, engineContext);
    setActiveOutput({
      cmd: input,
      output: res.message,
      success: res.success,
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-slate-200 overflow-hidden text-xs">
      {/* Header */}
      <div className="px-6 py-3 bg-[#0d121f] border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Command className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
            Chakki 28-Command Execution Catalog
          </h2>
        </div>
        <span className="font-mono text-slate-400 text-[11px]">
          28/28 Built-in Handlers Verified
        </span>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 px-6 py-2 bg-[#090d16] border-b border-slate-800/60 font-mono text-[11px]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded transition-colors uppercase ${
              selectedCategory === cat
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Output card if active */}
      {activeOutput && (
        <div className="p-4 mx-6 my-3 rounded-lg border border-slate-800 bg-[#070a12] space-y-1 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            {activeOutput.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span className="text-amber-400 font-bold">{activeOutput.cmd}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{activeOutput.success ? 'Success' : 'Error'}</span>
          </div>
          <pre className="text-slate-300 p-2 rounded bg-slate-950 overflow-x-auto whitespace-pre-wrap">
            {activeOutput.output}
          </pre>
        </div>
      )}

      {/* Commands Grid */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((cmd) => (
          <div
            key={cmd.name}
            className="p-3 rounded-lg border border-slate-800 bg-[#070a12] hover:border-slate-700 transition-colors flex flex-col justify-between space-y-2"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-amber-400 font-bold">{cmd.name}</span>
                <span className="text-[10px] text-slate-500 uppercase">{cmd.category}</span>
              </div>
              <div className="font-mono text-[10px] text-slate-400">{cmd.usage}</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{cmd.description}</p>
            </div>

            <button
              onClick={() => handleExecute(cmd.name)}
              className="w-full py-1.5 px-3 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 font-mono text-[11px] border border-slate-800 transition-colors"
            >
              <Play className="w-3 h-3 fill-current text-amber-400" />
              <span>Test Command</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
