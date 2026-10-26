import React, { useState } from 'react';
import { Sliders, Cpu, Shield, Save, Check } from 'lucide-react';
import { ConnectionMode } from '../types/protocol';

interface SettingsModalProps {
  connectionMode: ConnectionMode;
  onUpdateConnectionMode: (mode: ConnectionMode, url?: string) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  connectionMode,
  onUpdateConnectionMode,
  onClose,
}) => {
  const [mode, setMode] = useState<ConnectionMode>(connectionMode);
  const [wsUrl, setWsUrl] = useState('ws://127.0.0.1:8765');
  const [autoApproveSafe, setAutoApproveSafe] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateConnectionMode(mode, wsUrl);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 bg-[#0d121f] border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
            Engine & Transport Settings
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 text-xs">
        {/* Connection mode */}
        <div className="border border-slate-800 rounded-lg bg-[#070a12] p-4 space-y-3">
          <div className="flex items-center gap-2 font-medium text-white">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Transport Bridge</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === 'simulated'}
                onChange={() => setMode('simulated')}
                className="text-amber-400 focus:ring-0"
              />
              <span>High-Fidelity Swift Simulator (Instant Local Verification)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === 'websocket_live'}
                onChange={() => setMode('websocket_live')}
                className="text-amber-400 focus:ring-0"
              />
              <span>Live Swift Engine WebSocket (`chakki-core` Daemon)</span>
            </label>
          </div>

          {mode === 'websocket_live' && (
            <div className="pt-2">
              <label className="block text-slate-400 text-[11px] mb-1">
                WebSocket URL:
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://127.0.0.1:8765"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>

        {/* Security / Approval Policies */}
        <div className="border border-slate-800 rounded-lg bg-[#070a12] p-4 space-y-3">
          <div className="flex items-center gap-2 font-medium text-white">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Approval & Sandbox Policy</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoApproveSafe}
              onChange={(e) => setAutoApproveSafe(e.target.checked)}
              className="text-amber-400 focus:ring-0 rounded"
            />
            <span>Auto-approve read-only operations (file_read, linter check)</span>
          </label>

          <p className="text-slate-400 text-[11px]">
            Destructive commands (`bash` with write permissions, `file_patch`, `file_write`) will always require explicit user confirmation regardless of this setting.
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold flex items-center gap-1.5 transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Saved' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
