import React, { useState } from 'react';
import {
  Terminal,
  FileEdit,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ToolCallState } from '../types/protocol';

interface ToolCallBlockProps {
  toolCall: ToolCallState;
  onApprove: (approved: boolean) => void;
  isInteractive: boolean;
}

export const ToolCallBlock: React.FC<ToolCallBlockProps> = ({
  toolCall,
  onApprove,
  isInteractive,
}) => {
  const [isOutputExpanded, setIsOutputExpanded] = useState(true);
  const [isDiffExpanded, setIsDiffExpanded] = useState(true);

  const isBash = toolCall.toolName === 'bash';
  const isPatch = toolCall.toolName === 'file_patch' || toolCall.toolName === 'file_write';
  const isPending = toolCall.status === 'pending_approval';

  return (
    <div className="my-3 rounded-lg border border-slate-800 bg-[#0c111d] overflow-hidden text-xs shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {isBash ? (
            <Terminal className="w-4 h-4 text-emerald-400" />
          ) : isPatch ? (
            <FileEdit className="w-4 h-4 text-amber-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          )}

          <span className="font-mono font-medium text-slate-200">
            {toolCall.toolName}
          </span>

          {toolCall.args.path ? (
            <span className="text-slate-400 font-mono text-[11px] truncate max-w-xs">
              {String(toolCall.args.path)}
            </span>
          ) : toolCall.args.command ? (
            <span className="text-slate-400 font-mono text-[11px] truncate max-w-xs">
              {String(toolCall.args.command)}
            </span>
          ) : null}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {toolCall.result && (
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{toolCall.result.durationMs}ms</span>
            </span>
          )}

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider ${
              toolCall.status === 'pending_approval'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : toolCall.status === 'running'
                ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                : toolCall.status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {toolCall.status === 'pending_approval'
              ? 'Awaiting Approval'
              : toolCall.status}
          </span>
        </div>
      </div>

      {/* Body: Command / Arguments */}
      <div className="p-3 space-y-2">
        {Boolean(isBash && toolCall.args?.command) && (
          <div className="bg-[#070a12] p-2.5 rounded font-mono text-slate-200 border border-slate-800/80 overflow-x-auto">
            <span className="text-emerald-400 select-none mr-2">$</span>
            {String(toolCall.args.command)}
          </div>
        )}

        {/* Diff Preview if file patch */}
        {toolCall.diff && (
          <div className="border border-slate-800/80 rounded bg-[#070a12] overflow-hidden">
            <button
              onClick={() => setIsDiffExpanded(!isDiffExpanded)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-900/60 text-slate-300 hover:bg-slate-800/50 text-[11px] font-mono"
            >
              <div className="flex items-center gap-1.5">
                {isDiffExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Diff: {toolCall.diff.filePath}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">+{toolCall.diff.addedLines}</span>
                <span className="text-rose-400">-{toolCall.diff.removedLines}</span>
              </div>
            </button>

            {isDiffExpanded && (
              <div className="p-2.5 font-mono text-[11px] space-y-0.5 overflow-x-auto max-h-56">
                {toolCall.diff.originalContent && (
                  <div className="bg-rose-950/20 text-rose-300 p-1 rounded border-l-2 border-rose-500">
                    <pre className="whitespace-pre-wrap">{toolCall.diff.originalContent}</pre>
                  </div>
                )}
                {toolCall.diff.newContent && (
                  <div className="bg-emerald-950/20 text-emerald-300 p-1 rounded border-l-2 border-emerald-500 mt-1">
                    <pre className="whitespace-pre-wrap">{toolCall.diff.newContent}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Approval Prompt Box */}
        {isPending && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md space-y-2 mt-2">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Operator Approval Required</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Swift Engine sandbox protocol requires explicit confirmation before applying this modification.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                disabled={!isInteractive}
                onClick={() => onApprove(true)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Action</span>
              </button>

              <button
                disabled={!isInteractive}
                onClick={() => onApprove(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}

        {/* Output Console if completed */}
        {toolCall.result && toolCall.result.output && (
          <div className="border border-slate-800/80 rounded bg-[#070a12] overflow-hidden mt-2">
            <button
              onClick={() => setIsOutputExpanded(!isOutputExpanded)}
              className="w-full flex items-center justify-between px-3 py-1 bg-slate-900/60 text-slate-400 hover:bg-slate-800/50 text-[11px] font-mono"
            >
              <div className="flex items-center gap-1">
                {isOutputExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span>Standard Output (exit: {toolCall.result.exitCode})</span>
              </div>
            </button>

            {isOutputExpanded && (
              <div className="p-2.5 font-mono text-[11px] text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-48">
                {toolCall.result.output}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
