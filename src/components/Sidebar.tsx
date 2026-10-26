import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Terminal,
  Cpu,
  Layers,
} from 'lucide-react';
import { FileItem } from '../types/protocol';

interface SidebarProps {
  files: FileItem[];
  selectedPath: string | null;
  onSelectFile: (file: FileItem) => void;
  onRunPresetTask: (prompt: string) => void;
  isTaskRunning: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedPath,
  onSelectFile,
  onRunPresetTask,
  isTaskRunning,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    Sources: true,
    'Sources/ChakkiEngine': true,
    'Sources/ChakkiEngine/Security': true,
    'Sources/ChakkiEngine/Tools': true,
    config: true,
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders[item.path] ?? false;
      const isSelected = selectedPath === item.path;

      if (item.type === 'dir') {
        return (
          <div key={item.path}>
            <button
              onClick={() => toggleFolder(item.path)}
              className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded transition-colors text-left"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              )}
              <span className="truncate">{item.name}</span>
            </button>
            {isExpanded && item.children && renderTree(item.children, depth + 1)}
          </div>
        );
      }

      const isModified = item.modified;

      return (
        <button
          key={item.path}
          onClick={() => onSelectFile(item)}
          className={`w-full flex items-center justify-between px-2 py-1 text-xs rounded transition-colors text-left ${
            isSelected
              ? 'bg-amber-500/15 text-amber-300 font-medium'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
          }`}
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
        >
          <div className="flex items-center gap-1.5 truncate">
            {item.name.endsWith('.swift') ? (
              <FileCode className="w-3.5 h-3.5 text-orange-400/80 shrink-0" />
            ) : item.name.endsWith('.json') ? (
              <Layers className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className="truncate">{item.name}</span>
          </div>

          {isModified && (
            <span className="text-[10px] text-amber-400 font-mono ml-1">●</span>
          )}
        </button>
      );
    });
  };

  const PRESETS = [
    {
      title: 'Harden Attestation (Anti-Replay)',
      prompt: 'Refactor Sources/ChakkiEngine/Security/Attestation.swift to add anti-replay protection with nonce tracking and verify with swift test.',
      icon: ShieldAlert,
    },
    {
      title: 'Audit Bash Tool Sandbox',
      prompt: 'Inspect Sources/ChakkiEngine/Tools/BashExecutor.swift, verify that commands are properly escaped, and test stdout streaming.',
      icon: Terminal,
    },
    {
      title: 'Enforce Rate Limit Invariants',
      prompt: 'Check config/engine.json and ensure sliding window rate limits are enforced in EngineServer.swift before invoking model inference.',
      icon: Cpu,
    },
  ];

  return (
    <aside className="w-64 bg-[#0d121f] border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
      {/* Workspace Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Explorer
        </span>
        <span className="text-[11px] font-mono text-slate-400">ChakkiEngine</span>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {renderTree(files)}
      </div>

      {/* Quick Presets for Swift Engine Testing */}
      <div className="p-3 border-t border-slate-800/80 bg-[#090d16]/70">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Engine Directives
          </span>
          <span className="text-[10px] font-mono text-amber-400/80">3 tasks</span>
        </div>
        <div className="space-y-1.5">
          {PRESETS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                disabled={isTaskRunning}
                onClick={() => onRunPresetTask(preset.prompt)}
                className={`w-full text-left p-2 rounded border border-slate-800 hover:border-amber-500/40 bg-slate-900/60 hover:bg-slate-800/50 transition-all text-xs flex items-start gap-2 ${
                  isTaskRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-slate-300 text-[11px] leading-tight font-medium">
                  {preset.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
