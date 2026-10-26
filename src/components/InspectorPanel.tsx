import React, { useState } from 'react';
import { Terminal, ArrowDownLeft, ArrowUpRight, Copy, Check, Trash2, Filter } from 'lucide-react';
import { JsonRpcPacketLog } from '../types/protocol';

interface InspectorPanelProps {
  logs: JsonRpcPacketLog[];
  onClearLogs: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ logs, onClearLogs }) => {
  const [filterDirection, setFilterDirection] = useState<'all' | 'in' | 'out'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filterDirection === 'all') return true;
    return log.direction === filterDirection;
  });

  const handleCopy = (raw: string, id: string) => {
    navigator.clipboard.writeText(raw);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-3 bg-[#0d121f] border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>JSON-RPC 2.0 Protocol Stream Inspector</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            ({filteredLogs.length} packets)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter segment */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setFilterDirection('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterDirection === 'all' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterDirection('in')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                filterDirection === 'in' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
              <span>In (Engine)</span>
            </button>
            <button
              onClick={() => setFilterDirection('out')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                filterDirection === 'out' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3 h-3 text-blue-400" />
              <span>Out (Client)</span>
            </button>
          </div>

          <button
            onClick={onClearLogs}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
            title="Clear packet log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No JSON-RPC packets captured yet. Start a task or connect to Swift engine.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isOut = log.direction === 'out';

            return (
              <div
                key={log.id}
                className="rounded border border-slate-800 bg-[#070a12] p-3 text-slate-300 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    {isOut ? (
                      <span className="flex items-center gap-1 text-blue-400 font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>OUT (REQUEST)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>IN (EVENT/RESPONSE)</span>
                      </span>
                    )}

                    {log.method && (
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-amber-300 text-[11px] font-bold">
                        {log.method}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        fractionalSecondDigits: 3,
                      })}
                    </span>
                    <button
                      onClick={() => handleCopy(log.raw, log.id)}
                      className="text-slate-400 hover:text-slate-200"
                      title="Copy JSON-RPC payload"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Packet payload pre */}
                <pre className="p-2.5 rounded bg-slate-950/70 border border-slate-800/60 text-slate-300 text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
                  {log.raw}
                </pre>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
