import React, { useState, useRef, useCallback, useEffect } from "react";
import { Terminal, Github, Settings, Activity, Sparkles } from "lucide-react";
import VTuberCharacter, { DEFAULT_CHARACTER } from "../components/VTuberCharacter";
import type { VTuberCharacterData } from "../components/VTuberCharacter";
import ControlPanel from "../components/ControlPanel";
import PipelineMonitor from "../components/PipelineMonitor";
import SettingsModal from "../components/SettingsModal";
import { DEFAULT_VOICE } from "../types";
import type { TranscriptionEntry, VTuberState, PipelineState } from "../types";
import api from "./api";

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(DEFAULT_VOICE);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>(
    [],
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<VTuberCharacterData>(DEFAULT_CHARACTER);
  const [vtState, setVtState] = useState<VTuberState>({
    isTalking: false,
    isBlinking: false,
    isThinking: false,
    expression: "neutral",
  });

  const [pipeline, setPipeline] = useState<PipelineState>({
    input: "idle",
    uplink: "idle",
    processing: "idle",
    downlink: "idle",
    output: "idle",
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (
      window.AudioContext || (window as any).webkitAudioContext
    )({ sampleRate: 24000 });

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await api.health();
        console.log("API Health:", health);
        if (health.status === "ok") {
          setIsActive(true);
          setPipeline((p) => ({ ...p, input: "active" }));
        }
      } catch (err) {
        console.error("API not available:", err);
      }
    };
    checkHealth();
  }, []);

  const cleanup = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setVtState((prev) => ({ ...prev, isTalking: false, isThinking: false }));
    setPipeline({
      input: "idle",
      uplink: "idle",
      processing: "idle",
      downlink: "idle",
      output: "idle",
    });
  }, []);

  const playAudio = async (audioPath: string) => {
    try {
      // Extract filename from path
      const filename = audioPath.split(/[/\\]/).pop();
      if (!filename) return;

      const audioUrl = api.getAudioUrl(filename);

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      setVtState((prev) => ({ ...prev, isTalking: true }));
      setPipeline((p) => ({ ...p, output: "playing" }));

      audio.onended = () => {
        setVtState((prev) => ({ ...prev, isTalking: false }));
        setPipeline((p) => ({ ...p, output: "idle" }));
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setVtState((prev) => ({ ...prev, isTalking: false }));
        setPipeline((p) => ({ ...p, output: "idle" }));
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error("Audio playback error:", err);
      setVtState((prev) => ({ ...prev, isTalking: false }));
      setPipeline((p) => ({ ...p, output: "idle" }));
    }
  };

  const handleSendText = async (text: string) => {
    if (!text.trim()) return;

    // Add user message to transcriptions
    setTranscriptions((prev) => [
      ...prev,
      { text, isUser: true, timestamp: Date.now() },
    ]);

    // Update UI state
    setVtState((prev) => ({ ...prev, isThinking: true }));
    setPipeline((p) => ({
      ...p,
      uplink: "transmitting",
      processing: "thinking",
    }));

    try {
      // Send to API
      const response = await api.sendMessage({
        message: text,
        use_voice_output: true,
      });

      // Update pipeline
      setPipeline((p) => ({ ...p, uplink: "idle", downlink: "receiving" }));

      // Add AI response to transcriptions
      setTranscriptions((prev) =>
        [
          ...prev,
          { text: response.response, isUser: false, timestamp: Date.now() },
        ].slice(-20),
      );

      // Update state
      setVtState((prev) => ({ ...prev, isThinking: false }));
      setPipeline((p) => ({ ...p, processing: "idle", downlink: "idle" }));

      // Play audio if available
      if (response.audio_path) {
        await playAudio(response.audio_path);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setVtState((prev) => ({ ...prev, isThinking: false }));
      setPipeline((p) => ({ ...p, processing: "idle", uplink: "idle" }));

      // Add error message
      setTranscriptions((prev) => [
        ...prev,
        { text: `Error: ${err.message}`, isUser: false, timestamp: Date.now() },
      ]);
    }
  };

  const toggleSession = async () => {
    if (isActive) {
      cleanup();
      setIsActive(false);
    } else {
      try {
        // Check API and optionally load model
        const health = await api.health();
        if (!health.llm_loaded) {
          setPipeline((p) => ({ ...p, processing: "thinking" }));
          await api.loadModel();
        }
        setIsActive(true);
        setPipeline((p) => ({ ...p, input: "active", processing: "idle" }));
      } catch (err) {
        console.error("Failed to connect:", err);
        alert(
          "Tidak dapat terhubung ke API. Pastikan server berjalan di localhost:8000",
        );
      }
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0f] text-slate-100 font-inter">
      {/* Dynamic Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.15),transparent_70%)]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      {/* Top Section with Pipeline Monitor */}
      <header className="absolute top-0 w-full p-6 flex flex-col items-center gap-4 z-20">
        <div className="w-full max-w-7xl flex justify-between items-center bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-outfit font-bold text-2xl tracking-tighter leading-none">
                LUNA <span className="text-indigo-400">AI</span>
              </h1>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Voice Assistant
              </span>
            </div>
          </div>

          <PipelineMonitor status={pipeline} />

          <div className="flex items-center gap-5 text-slate-500">
            {/* Settings Button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>

            <Github className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`}
              />
              <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">
                {isActive ? "Online" : "Standby"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative w-full h-full flex flex-col lg:flex-row items-center justify-center px-12 pt-28 pb-32 gap-16">
        {/* VTuber Area */}
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center relative">
          {/* VTuber Character */}
          <div className="w-full flex items-center justify-center drop-shadow-[0_0_50px_rgba(79,70,229,0.1)]">
            <VTuberCharacter state={vtState} character={currentCharacter} />
          </div>

          {/* Status Indicator - positioned closer to character */}
          <div
            className={`mt-4 px-8 py-3 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 transition-all duration-700 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <div className="flex items-center gap-3">
              <Activity
                className={`w-4 h-4 ${vtState.isTalking ? "text-emerald-400 animate-bounce" : "text-indigo-400"}`}
              />
              <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-200">
                {vtState.isTalking
                  ? "Speaking"
                  : vtState.isThinking
                    ? "Thinking"
                    : "Listening"}
              </span>
            </div>
          </div>
        </div>

        {/* Interaction Log Area */}
        <aside className="hidden lg:flex w-[400px] h-full max-h-[65vh] bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 flex-col shadow-2xl z-10 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none z-10" />

          <div className="flex items-center justify-between mb-8 relative z-20">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-3">
              <Terminal className="w-4 h-4" />
              Conversation Stream
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 pr-4 custom-scrollbar relative z-20">
            {transcriptions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <Sparkles className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-black tracking-[0.3em] uppercase max-w-[150px]">
                  System Initialized. Awaiting Input.
                </p>
              </div>
            ) : (
              transcriptions.map((t, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${t.isUser ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-3 duration-500`}
                >
                  <div
                    className={`max-w-[90%] px-5 py-3 rounded-3xl text-[13px] leading-relaxed shadow-xl ${
                      t.isUser
                        ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-50 rounded-tr-none"
                        : "bg-slate-800/80 border border-white/5 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {t.text}
                  </div>
                  <span className="text-[8px] font-bold text-slate-600 mt-2 px-1">
                    {new Date(t.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none z-10" />
        </aside>
      </main>

      {/* Refined Footer Controls */}
      <ControlPanel
        isActive={isActive}
        onToggle={toggleSession}
        currentVoice={currentVoice}
        onVoiceChange={setCurrentVoice}
        onSendText={handleSendText}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onVoiceChange={setCurrentVoice}
        onCharacterChange={(char) => setCurrentCharacter({
          id: char.id,
          name: char.name,
          type: char.type as "svg" | "image" | "live2d",
          path: char.path,
          thumbnail: char.thumbnail,
        })}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; height: 4px; }
          50% { opacity: 1; height: 100%; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(79, 70, 229, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(79, 70, 229, 0.4); }
      `}</style>
    </div>
  );
};

export default App;
