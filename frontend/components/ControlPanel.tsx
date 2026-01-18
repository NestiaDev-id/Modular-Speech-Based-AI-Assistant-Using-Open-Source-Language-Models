import React, { useState, useEffect } from "react";
import { MicOff, Settings, Send, Power, Volume2 } from "lucide-react";
import api from "../src/api";
import type { VoiceProfile } from "../src/api";

interface ControlPanelProps {
  isActive: boolean;
  onToggle: () => void;
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
  onSendText: (text: string) => void;
  onSettingsClick: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isActive,
  onToggle,
  currentVoice,
  onVoiceChange,
  onSendText,
  onSettingsClick,
}) => {
  const [inputText, setInputText] = useState("");
  const [voices, setVoices] = useState<VoiceProfile[]>([]);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const res = await api.listVoices();
      setVoices(res.voices);
    } catch (err) {
      console.error("Failed to load voices:", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendText(inputText);
      setInputText("");
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full max-w-4xl px-6 z-50">
      <div className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 p-2.5 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] w-full transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20">
        {/* Toggle Connection / Mic */}
        <button
          onClick={onToggle}
          title={isActive ? "Disconnect Session" : "Connect Session"}
          className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group ${
            isActive
              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white"
              : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95"
          }`}
        >
          {isActive ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Power className="w-5 h-5" />
          )}
        </button>

        {/* Text Input Column */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex items-center bg-slate-800/40 border border-slate-700/20 rounded-2xl px-5 transition-all focus-within:bg-slate-800/60 focus-within:border-indigo-500/40"
        >
          <input
            type="text"
            placeholder={
              isActive
                ? "Ketik pesan untuk Luna..."
                : "Ketik untuk memulai percakapan..."
            }
            className="bg-transparent flex-1 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-2 transition-all duration-300 ${
              inputText.trim()
                ? "text-indigo-400 hover:text-indigo-300 scale-110"
                : "text-slate-600 scale-100"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Voice Selector - Desktop Only */}
        <div className="hidden lg:flex items-center px-4 gap-3 border-l border-slate-800">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Voice Profile
            </span>
            <select
              className="bg-transparent text-xs font-bold text-indigo-400 focus:outline-none cursor-pointer hover:text-indigo-300 transition-colors max-w-[120px]"
              value={currentVoice}
              onChange={(e) => onVoiceChange(e.target.value)}
            >
              <option
                value="default"
                className="bg-slate-900 text-white font-sans"
              >
                Default (Male)
              </option>
              {voices.map((v) => (
                <option
                  key={v.name}
                  value={v.name}
                  className="bg-slate-900 text-white font-sans"
                >
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Visualizer Activity */}
          <div className="flex gap-1 items-end h-6 w-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-500 ${isActive ? "bg-indigo-500" : "bg-slate-700 h-1"}`}
                style={{
                  height: isActive ? `${30 + Math.random() * 70}%` : "4px",
                  animation: isActive
                    ? `pulse 1.5s ease-in-out infinite ${i * 0.2}s`
                    : "none",
                }}
              />
            ))}
          </div>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Keyboard Hint */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        <span>Press</span>
        <span className="px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900">
          Enter
        </span>
        <span>to send message</span>
      </div>
    </div>
  );
};

export default ControlPanel;
