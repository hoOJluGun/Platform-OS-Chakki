import React, { useState } from 'react';
import { FileCode, Copy, Check, Eye, GitCompare } from 'lucide-react';
import { FileItem } from '../types/protocol';
import { computeDiffLines } from '../engine/protocol';

interface FileViewerProps {
  file: FileItem | null;
  originalContent?: string;
}

export const FileViewer: React.FC<FileViewerProps> = ({ file, originalContent }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'diff'>('code');

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d121f] text-slate-500 text-xs">
        Select a file from the explorer or trigger an engine task
      </div>
    );
  }

  const content = file.content || '';
  const lines = content.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasDiff = originalContent && originalContent !== content;
  const diffResult = hasDiff ? computeDiffLines(originalContent, content) : null;

  return (
    <div className="h-full flex flex-col bg-[#0d121f] border-l border-slate-800/80 overflow-hidden">
      {/* Top Bar */}
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-slate-200 font-medium truncate max-w-xs">
            {file.path}
          </span>
          {file.modified && (
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded font-mono">
              modified
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasDiff && (
            <div className="flex items-center gap-1 bg-slate-800 rounded p-0.5 text-[11px]">
              <button
                onClick={() => setViewMode('code')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'code' ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setViewMode('diff')}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  viewMode === 'diff' ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                <GitCompare className="w-3 h-3" />
                <span>Diff (+{diffResult?.added} -{diffResult?.removed})</span>
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Copy file content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code / Diff Body */}
      <div className="flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed bg-[#080c16]">
        {viewMode === 'diff' && diffResult ? (
          <div className="space-y-0.5">
            {diffResult.lines.map((line, idx) => (
              <div
                key={idx}
                className={`flex gap-3 px-2 py-0.5 rounded ${
                  line.type === 'add'
                    ? 'bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500'
                    : line.type === 'del'
                    ? 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                    : 'text-slate-400'
                }`}
              >
                <span className="w-6 text-right select-none opacity-40 shrink-0">
                  {idx + 1}
                </span>
                <span className="w-3 select-none shrink-0 font-bold">
                  {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
                </span>
                <span className="whitespace-pre">{line.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-4 hover:bg-slate-800/30 px-1 rounded">
                <span className="w-8 text-right select-none text-slate-400 opacity-60 shrink-0">
                  {idx + 1}
                </span>
                <span className="text-slate-200 whitespace-pre">{line}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-1.5 bg-[#090d16] border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <span>{lines.length} lines · {file.size || content.length} bytes</span>
        <span>UTF-8 · {file.language || 'text'}</span>
      </div>
    </div>
  );
};
